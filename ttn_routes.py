import os
import json
from flask import Blueprint, request, jsonify, send_file
from werkzeug.utils import secure_filename
from auth import token_required
from models import db, Document, WorkPlan, RequiredMaterial
from datetime import datetime
from risk_calculator import recalculate_project_risk

recognition_bp = Blueprint('recognition_bp', __name__)

UPLOAD_FOLDER = 'uploads'
AI_RESPONSES_FOLDER = 'ai_responses'


@recognition_bp.route('/api/recognize/document', methods=['POST'])
@token_required
def recognize_document():
    """
    Запускает асинхронную задачу Celery для распознавания данных из файла.
    Принимает файл (PDF, JPG, PNG) и ID проекта.
    Доступно только для прораба.
    
    ИЗМЕНЕНИЯ: Threading заменен на Celery для изоляции хрупкой зависимости (Qwen API).
    """
    if request.current_user.get('role') != 'foreman':
        return jsonify({"message": "Только прораб может загружать документы"}), 403
    
    if 'file' not in request.files:
        return jsonify({"message": "Файл не найден в запросе"}), 400
    
    project_id = request.form.get('project_id')
    if not project_id:
        return jsonify({"message": "Необходимо указать project_id"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"message": "Пустое имя файла"}), 400

    filename = secure_filename(file.filename)
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(file_path)

    document = None
    try:
        current_user_id = request.current_user['id']
        document = Document(
            project_id=project_id,
            uploader_id=current_user_id,
            file_type=file.content_type,
            url=file_path, 
            recognition_status='pending'  # Статус "pending" до запуска задачи
        )
        db.session.add(document)
        db.session.commit()

        # Запуск Celery задачи вместо threading
        from tasks import recognize_document_task
        task = recognize_document_task.delay(document.id)
        
        print(f"[API] Celery задача запущена: task_id={task.id}, document_id={document.id}")

        return jsonify({
            "message": "Распознавание запущено в фоновой задаче. Статус можно проверить по ID документа.",
            "document_id": document.id,
            "task_id": task.id,
            "status": "pending"
        }), 202

    except Exception as e:
        print(f"[API] Ошибка при запуске распознавания: {str(e)}")
        if document and document.id:
            document.recognition_status = 'failed'
            db.session.commit()
        return jsonify({"message": f"Ошибка при запуске распознавания: {e}"}), 500


@recognition_bp.route('/api/recognize/status/<int:document_id>', methods=['GET'])
@token_required
def get_recognition_status(document_id):
    """
    Проверяет статус задачи распознавания документа.
    Работает с Celery задачами.
    """
    document = Document.query.get_or_404(document_id)

    response = {
        "document_id": document.id,
        "recognition_status": document.recognition_status
    }

    if document.recognition_status == 'completed':
        response["recognized_data"] = document.recognized_data
        response["message"] = "Распознавание успешно завершено"
    elif document.recognition_status == 'failed':
        response["message"] = "Ошибка во время распознавания. Задача будет повторена автоматически (до 3 раз)."
    elif document.recognition_status == 'processing':
        response["message"] = "Распознавание выполняется Celery worker..."
    else:
        response["message"] = "Задача в очереди на выполнение."

    return jsonify(response), 200


@recognition_bp.route('/api/ttn/<int:document_id>/verify', methods=['POST'])
@token_required
def verify_and_process_ttn(document_id):
    """
    Верифицирует распознанные данные ТТН и создает поставку материалов.
    Прораб проверяет данные, может их скорректировать, и подтверждает оприходование.
    """
    if request.current_user.get('role') != 'foreman':
        return jsonify({"message": "Только прораб может верифицировать ТТН"}), 403
    
    document = Document.query.get_or_404(document_id)
    
    if document.recognition_status != 'completed':
        return jsonify({"message": "Документ еще не распознан или распознавание завершилось с ошибкой"}), 400
    
    data = request.get_json()
    if not data or 'verified_data' not in data:
        return jsonify({"message": "Отсутствуют верифицированные данные"}), 400
    
    verified_data = data['verified_data']
    
    try:
        from models import MaterialDelivery, MaterialDeliveryItem, Material, Project
        from geopy.geocoders import Nominatim
        from geopy.exc import GeocoderTimedOut, GeocoderServiceError
        
        project = None
        if 'project_id' in data:
            project = Project.query.get(data['project_id'])
        else:
            delivery_address = verified_data.get('delivery', {}).get('address', '')
            if delivery_address:
                try:
                    geolocator = Nominatim(user_agent="locus_construction_app", timeout=10)
                    location = geolocator.geocode(delivery_address, country_codes='ru')
                    if location:
                        projects = Project.query.filter(
                            Project.latitude.isnot(None),
                            Project.longitude.isnot(None)
                        ).all()
                        
                        min_distance = float('inf')
                        closest_project = None
                        for proj in projects:
                            distance = ((proj.latitude - location.latitude) ** 2 + 
                                      (proj.longitude - location.longitude) ** 2) ** 0.5
                            if distance < min_distance:
                                min_distance = distance
                                closest_project = proj
                        
                        if closest_project and min_distance < 0.01:
                            project = closest_project
                except (GeocoderTimedOut, GeocoderServiceError) as e:
                    print(f"Ошибка геокодирования: {e}")
        
        if not project:
            return jsonify({"message": "Не удалось определить проект по адресу доставки"}), 400
        
        delivery_date_str = verified_data.get('document_date')
        if delivery_date_str:
            try:
                delivery_date = datetime.strptime(delivery_date_str, '%Y-%m-%d')
            except ValueError:
                delivery_date = datetime.now()
        else:
            delivery_date = datetime.now()
        
        material_delivery = MaterialDelivery(
            project_id=project.id,
            document_id=document.id,
            foreman_id=request.current_user['id'],
            delivery_date=delivery_date
        )
        db.session.add(material_delivery)
        db.session.flush()
        
        items_list = verified_data.get('items', [])
        for item_data in items_list:
            material_name = item_data.get('name', '').strip()
            if not material_name:
                continue
            
            material = Material.query.filter_by(name=material_name).first()
            if not material:
                unit = item_data.get('unit', 'шт')
                material = Material(name=material_name, unit=unit)
                db.session.add(material)
                db.session.flush()
            
            quantity = item_data.get('quantity', 0)
            
            delivery_item = MaterialDeliveryItem(
                delivery_id=material_delivery.id,
                material_id=material.id,
                quantity=float(quantity)
            )
            db.session.add(delivery_item)
        
        db.session.commit()

        recalculate_project_risk(project.id, triggering_user_id=request.current_user['id'])
        
        return jsonify({
            "message": "Поставка материалов успешно оприходована",
            "delivery_id": material_delivery.id,
            "project_id": project.id,
            "project_name": project.name,
            "delivery": material_delivery.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Ошибка при оприходовании материалов: {str(e)}"}), 500


@recognition_bp.route('/api/ttn/<int:document_id>/suggest-project', methods=['POST'])
@token_required
def suggest_project_for_ttn(document_id):
    """
    Предлагает проект на основе адреса доставки из распознанной ТТН.
    """
    document = Document.query.get_or_404(document_id)
    
    if document.recognition_status != 'completed':
        return jsonify({"message": "Документ еще не распознан"}), 400
    
    if not document.recognized_data:
        return jsonify({"message": "Нет распознанных данных"}), 400
    
    try:
        from models import Project
        from geopy.geocoders import Nominatim
        from geopy.exc import GeocoderTimedOut, GeocoderServiceError
        
        recognized_data = document.recognized_data
        if isinstance(recognized_data, list) and len(recognized_data) > 0:
            recognized_data = recognized_data[0]
        
        delivery_address = recognized_data.get('delivery', {}).get('address', '')
        if not delivery_address:
            return jsonify({"message": "Адрес доставки не найден в распознанных данных"}), 400
        
        geolocator = Nominatim(user_agent="locus_construction_app", timeout=10)
        location = geolocator.geocode(delivery_address, country_codes='ru')
        
        if not location:
            return jsonify({
                "message": "Не удалось геокодировать адрес доставки",
                "address": delivery_address
            }), 404
        
        projects = Project.query.filter(
            Project.latitude.isnot(None),
            Project.longitude.isnot(None)
        ).all()
        
        suggestions = []
        for proj in projects:
            distance = ((proj.latitude - location.latitude) ** 2 + 
                       (proj.longitude - location.longitude) ** 2) ** 0.5
            distance_km = distance * 111
            
            suggestions.append({
                'project_id': proj.id,
                'project_name': proj.name,
                'project_address': proj.address,
                'distance_km': round(distance_km, 2),
                'coordinates': {
                    'latitude': proj.latitude,
                    'longitude': proj.longitude
                }
            })
        
        suggestions.sort(key=lambda x: x['distance_km'])
        
        return jsonify({
            "delivery_address": delivery_address,
            "delivery_coordinates": {
                "latitude": location.latitude,
                "longitude": location.longitude
            },
            "suggested_projects": suggestions[:5]
        }), 200
        
    except (GeocoderTimedOut, GeocoderServiceError) as e:
        return jsonify({"message": f"Ошибка геокодирования: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"message": f"Ошибка при поиске проекта: {str(e)}"}), 500


@recognition_bp.route('/api/ttn/<int:document_id>/link-to-plan', methods=['POST'])
@token_required
def link_ttn_to_plan(document_id):
    """
    Связывает распознанный ТТН с планом работ.
    """
    document = Document.query.get_or_404(document_id)
    
    if document.recognition_status != 'completed':
        return jsonify({"message": "Документ еще не распознан"}), 400
    
    if not document.recognized_data:
        return jsonify({"message": "Нет распознанных данных"}), 400
        
    project = document.project
    if not project or not project.work_plan:
        return jsonify({"message": "План работ для проекта не найден"}), 404
        
    work_plan = project.work_plan
    
    required_materials = []
    for item in work_plan.items:
        required_materials.extend(item.required_materials)
        
    recognized_items = document.recognized_data[0].get('items', [])
    
    links = []
    for rec_item in recognized_items:
        rec_name = rec_item.get('name', '').strip().lower()
        if not rec_name:
            continue
            
        best_match = None
        highest_ratio = 0.0
        
        for req_mat in required_materials:
            req_name = req_mat.material.name.strip().lower()
            
            common_words = set(rec_name.split()) & set(req_name.split())
            ratio = len(common_words)
            
            if ratio > highest_ratio:
                highest_ratio = ratio
                best_match = req_mat
        
        if best_match:
            links.append({
                'recognized_item': rec_item,
                'required_material': best_match.to_dict(),
                'similarity_ratio': highest_ratio
            })

    return jsonify(links), 200

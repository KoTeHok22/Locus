
from flask import Blueprint, request, jsonify
from models import db, Project, Document, Material, MaterialDelivery, MaterialDeliveryItem
from auth import token_required, role_required
from datetime import datetime
import os

delivery_bp = Blueprint('delivery_bp', __name__)

@delivery_bp.route('/api/projects/<int:project_id>/deliveries', methods=['POST'])
@token_required
@role_required('foreman')
def create_material_delivery(project_id):
    """
    Создает запись о поставке материалов.
    Принимает ID документа с распознанной ТТН и массив материалов,
    подтвержденных или исправленных пользователем.
    """
    data = request.get_json()
    if not data or not data.get('document_id') or not isinstance(data.get('items'), list):
        return jsonify({'message': 'Необходимы поля: document_id и массив items'}), 400

    project = Project.query.get_or_404(project_id)
    document = Document.query.get_or_404(data['document_id'])
    if document.project_id != project.id:
        return jsonify({'message': 'Документ не принадлежит данному проекту'}), 403

    existing_delivery = MaterialDelivery.query.filter_by(document_id=document.id).first()
    if existing_delivery:
        return jsonify({'message': f'Эта ТТН уже была оприходована в поставке #{existing_delivery.id}'}), 409

    current_user_id = request.current_user['id']
    delivery_date_str = data.get('delivery_date')
    delivery_date = datetime.strptime(delivery_date_str, '%Y-%m-%d') if delivery_date_str else datetime.utcnow()

    new_delivery = MaterialDelivery(
        project_id=project.id,
        document_id=document.id,
        foreman_id=current_user_id,
        delivery_date=delivery_date
    )

    try:
        if not data['items']:
             return jsonify({'message': 'Список материалов (items) не может быть пустым'}), 400

        for item_data in data['items']:
            material_name = item_data.get('name')
            material_unit = item_data.get('unit')
            quantity = item_data.get('quantity')

            if not material_name or not quantity:
                raise ValueError('Каждый материал должен содержать name и quantity')

            material = Material.query.filter_by(name=material_name).first()
            if not material:
                material = Material(name=material_name, unit=material_unit or 'шт')
                db.session.add(material)
                db.session.flush()
            
            delivery_item = MaterialDeliveryItem(
                delivery=new_delivery,
                material_id=material.id,
                quantity=float(quantity)
            )
            db.session.add(delivery_item)

        db.session.add(new_delivery)
        db.session.commit()
        return jsonify({'message': 'Поставка успешно зарегистрирована', 'delivery_id': new_delivery.id}), 201

    except (ValueError, KeyError) as e:
        db.session.rollback()
        return jsonify({'message': f'Ошибка в данных позиции: {e}'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Внутренняя ошибка сервера: {e}'}), 500


@delivery_bp.route('/api/deliveries/<int:delivery_id>', methods=['DELETE'])
@token_required
@role_required('foreman')
def delete_material_delivery(delivery_id):
    """
    Удаляет поставку материалов и связанный документ.
    Доступно только для прораба.
    """
    document_file_path = None
    try:
        delivery = MaterialDelivery.query.get_or_404(delivery_id)
        
        # Проверяем, что прораб удаляет свою поставку
        current_user_id = request.current_user['id']
        if delivery.foreman_id != current_user_id:
            return jsonify({'message': 'Вы можете удалять только свои поставки'}), 403
        
        # Получаем связанный документ ДО удаления
        document_id = delivery.document_id
        if document_id:
            document = Document.query.get(document_id)
            if document and document.url:
                document_file_path = document.url
        
        # Удаляем позиции поставки (cascade должен сработать, но на всякий случай явно)
        MaterialDeliveryItem.query.filter_by(delivery_id=delivery_id).delete()
        
        # Удаляем поставку
        db.session.delete(delivery)
        
        # Удаляем документ
        if document_id:
            document = Document.query.get(document_id)
            if document:
                db.session.delete(document)
                print(f"[Delete Delivery] Документ {document_id} помечен на удаление")
        
        # Коммитим изменения в БД
        db.session.commit()
        print(f"[Delete Delivery] Поставка {delivery_id} и документ {document_id} успешно удалены из БД")
        
        # Удаляем файл документа с диска ПОСЛЕ успешного commit
        if document_file_path:
            if os.path.exists(document_file_path):
                try:
                    os.remove(document_file_path)
                    print(f"[Delete Delivery] Файл {document_file_path} удален с диска")
                except Exception as e:
                    print(f"[Delete Delivery] Не удалось удалить файл {document_file_path}: {e}")
            else:
                print(f"[Delete Delivery] Файл {document_file_path} не найден на диске")
        
        return jsonify({'message': 'Поставка и связанный документ успешно удалены'}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"[Delete Delivery] Ошибка при удалении: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'message': f'Ошибка при удалении поставки: {str(e)}'}), 500


@delivery_bp.route('/api/projects/<int:project_id>/deliveries', methods=['GET'])
@token_required
def get_project_deliveries(project_id):
    """
    Возвращает все поставки материалов для проекта.
    """
    db.get_or_404(Project, project_id)
    
    deliveries = MaterialDelivery.query.filter_by(project_id=project_id).order_by(MaterialDelivery.delivery_date.desc()).all()
    
    result = []
    for delivery in deliveries:
        delivery_dict = {
            'id': delivery.id,
            'project_id': delivery.project_id,
            'document_id': delivery.document_id,
            'foreman_id': delivery.foreman_id,
            'delivery_date': delivery.delivery_date.isoformat() if delivery.delivery_date else None,
            'items': []
        }
        
        # Добавляем информацию о документе
        if delivery.document:
            delivery_dict['document'] = {
                'id': delivery.document.id,
                'url': delivery.document.url,
                'file_type': delivery.document.file_type,
                'recognized_data': delivery.document.recognized_data
            }
        
        # Добавляем позиции
        for item in delivery.items:
            delivery_dict['items'].append({
                'id': item.id,
                'material_id': item.material_id,
                'material_name': item.material.name if item.material else None,
                'material_unit': item.material.unit if item.material else None,
                'quantity': item.quantity
            })
        
        result.append(delivery_dict)
    
    return jsonify(result), 200

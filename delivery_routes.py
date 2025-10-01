
from flask import Blueprint, request, jsonify
from models import db, Project, Document, Material, MaterialDelivery, MaterialDeliveryItem
from auth import token_required, role_required
from datetime import datetime

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

from flask import Blueprint, request, jsonify
from models import Classifier, Checklist, ChecklistItem, db
from auth import token_required, role_required
from datetime import datetime, timezone
import uuid

classifier_bp = Blueprint('classifier', __name__)


@classifier_bp.route('/api/classifiers', methods=['GET'])
@token_required
def get_classifiers():
    """
    Возвращает список классификаторов.

    Позволяет фильтровать классификаторы по типу (violation, remark).
    """
    try:
        classifier_type = request.args.get('type')
        
        query = Classifier.query
        
        if classifier_type:
            query = query.filter_by(type=classifier_type)
        
        classifiers = query.all()
        
        return jsonify({
            'classifiers': [classifier.to_dict() for classifier in classifiers]
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Ошибка получения классификаторов', 'error': str(e)}), 500


@classifier_bp.route('/api/classifiers', methods=['POST'])
@token_required
@role_required('client')
def create_classifier():
    """
    Создает новый классификатор.

    Только клиенты могут создавать классификаторы. Принимает тип, код, название
    и другие данные. Создает новую запись в базе данных.
    """
    try:
        data = request.get_json()
        
        required_fields = ['type', 'code', 'title']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'message': f'Поле {field} обязательно для заполнения'}), 400
        
        valid_types = ['violation', 'remark']
        if data['type'] not in valid_types:
            return jsonify({'message': f'Тип должен быть одним из: {", ".join(valid_types)}'}), 400
        
        if Classifier.query.filter_by(code=data['code']).first():
            return jsonify({'message': 'Классификатор с таким кодом уже существует'}), 409
        
        new_classifier = Classifier(
            type=data['type'],
            code=data['code'],
            title=data['title'],
            description=data.get('description'),
            is_active=data.get('is_active', True)
        )
        
        db.session.add(new_classifier)
        db.session.commit()
        
        return jsonify({
            'message': 'Классификатор успешно создан',
            'classifier': new_classifier.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Ошибка создания классификатора', 'error': str(e)}), 500


@classifier_bp.route('/api/classifiers/<classifier_id>', methods=['GET'])
@token_required
def get_classifier(classifier_id):
    """
    Возвращает детальную информацию о классификаторе.
    """
    try:
        classifier = db.session.get(Classifier, classifier_id)
        
        if not classifier:
            return jsonify({'message': 'Классификатор не найден'}), 404
        
        return jsonify({
            'classifier': classifier.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Ошибка получения классификатора', 'error': str(e)}), 500


@classifier_bp.route('/api/classifiers/<classifier_id>', methods=['PUT'])
@token_required
@role_required('client')
def update_classifier(classifier_id):
    """
    Обновляет существующий классификатор.

    Только клиенты могут обновлять классификаторы.
    """
    try:
        classifier = db.session.get(Classifier, classifier_id)
        
        if not classifier:
            return jsonify({'message': 'Классификатор не найден'}), 404
        
        data = request.get_json()
        
        updatable_fields = ['title', 'description', 'is_active']
        for field in updatable_fields:
            if field in data:
                setattr(classifier, field, data[field])
        
        classifier.updated_at = datetime.now(timezone.utc)
        db.session.commit()
        
        return jsonify({
            'message': 'Классификатор успешно обновлен',
            'classifier': classifier.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Ошибка обновления классификатора', 'error': str(e)}), 500


@classifier_bp.route('/api/classifiers/<classifier_id>', methods=['DELETE'])
@token_required
@role_required('client')
def delete_classifier(classifier_id):
    """
    Удаляет классификатор.

    Только клиенты могут удалять классификаторы.
    """
    try:
        classifier = db.session.get(Classifier, classifier_id)
        
        if not classifier:
            return jsonify({'message': 'Классификатор не найден'}), 404
        
        db.session.delete(classifier)
        db.session.commit()
        
        return jsonify({'message': 'Классификатор успешно удален'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Ошибка удаления классификатора', 'error': str(e)}), 500


@classifier_bp.route('/api/checklists', methods=['GET'])
@token_required
def get_checklists():
    """
    Возвращает список чек-листов.

    Позволяет фильтровать чек-листы по типу.
    """
    try:
        checklist_type = request.args.get('type')
        
        query = Checklist.query
        
        if checklist_type:
            query = query.filter_by(type=checklist_type)
        
        checklists = query.all()
        
        return jsonify({
            'checklists': [checklist.to_dict() for checklist in checklists]
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Ошибка получения чек-листов', 'error': str(e)}), 500


@classifier_bp.route('/api/checklists', methods=['POST'])
@token_required
@role_required('client')
def create_checklist():
    """
    Создает новый чек-лист.

    Только клиенты могут создавать чек-листы. Принимает тип, название
    и список элементов чек-листа.
    """
    try:
        data = request.get_json()
        
        required_fields = ['type', 'name']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'message': f'Поле {field} обязательно для заполнения'}), 400
        
        new_checklist = Checklist(
            type=data['type'],
            name=data['name']
        )
        
        db.session.add(new_checklist)
        db.session.flush()
        
        items = data.get('items', [])
        for item_data in items:
            item = ChecklistItem(
                checklist_id=new_checklist.id,
                text=item_data.get('text', ''),
                is_required=item_data.get('is_required', False),
                order=item_data.get('order', 0)
            )
            db.session.add(item)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Чек-лист успешно создан',
            'checklist': new_checklist.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Ошибка создания чек-листа', 'error': str(e)}), 500


@classifier_bp.route('/api/checklists/<checklist_id>', methods=['GET'])
@token_required
def get_checklist(checklist_id):
    """
    Возвращает детальную информацию о чек-листе.
    """
    try:
        checklist = db.session.get(Checklist, checklist_id)
        
        if not checklist:
            return jsonify({'message': 'Чек-лист не найден'}), 404
        
        return jsonify({
            'checklist': checklist.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Ошибка получения чек-листа', 'error': str(e)}), 500


@classifier_bp.route('/api/checklists/<checklist_id>', methods=['PUT'])
@token_required
@role_required('client')
def update_checklist(checklist_id):
    """
    Обновляет существующий чек-лист.

    Только клиенты могут обновлять чек-листы. Позволяет изменять
    название и полностью перезаписывать элементы чек-листа.
    """
    try:
        checklist = db.session.get(Checklist, checklist_id)
        
        if not checklist:
            return jsonify({'message': 'Чек-лист не найден'}), 404
        
        data = request.get_json()
        
        updatable_fields = ['name']
        for field in updatable_fields:
            if field in data:
                setattr(checklist, field, data[field])
        
        checklist.updated_at = datetime.now(timezone.utc)
        
        if 'items' in data:
            ChecklistItem.query.filter_by(checklist_id=checklist_id).delete()
            
            for item_data in data['items']:
                item = ChecklistItem(
                    checklist_id=checklist_id,
                    text=item_data.get('text', ''),
                    is_required=item_data.get('is_required', False),
                    order=item_data.get('order', 0)
                )
                db.session.add(item)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Чек-лист успешно обновлен',
            'checklist': checklist.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Ошибка обновления чек-листа', 'error': str(e)}), 500


@classifier_bp.route('/api/checklists/<checklist_id>', methods=['DELETE'])
@token_required
@role_required('client')
def delete_checklist(checklist_id):
    """
    Удаляет чек-лист.

    Только клиенты могут удалять чек-листы.
    """
    try:
        checklist = db.session.get(Checklist, checklist_id)
        
        if not checklist:
            return jsonify({'message': 'Чек-лист не найден'}), 404
        
        db.session.delete(checklist)
        db.session.commit()
        
        return jsonify({'message': 'Чек-лист успешно удален'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Ошибка удаления чек-листа', 'error': str(e)}), 500

from flask import Blueprint, request, jsonify
from models import LabSampleRequest, User, db
from auth import token_required, role_required
from datetime import datetime, timezone
import uuid

lab_sample_bp = Blueprint('lab_sample', __name__)


@lab_sample_bp.route('/api/projects/<project_id>/lab-samples', methods=['POST'])
@token_required
def create_lab_sample_request(project_id):
    """
    Создает новый запрос на лабораторный анализ образца.

    Только инспекторы могут создавать запросы. Принимает название материала
    и опционально другие данные. Создает новую запись в базе данных.
    """
    try:
        user_role = request.current_user['role']
        if user_role != 'inspector':
            return jsonify({'message': 'Только инспекторы могут инициировать отбор проб'}), 403
        
        data = request.get_json()
        
        required_fields = ['material_name']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'message': f'Поле {field} обязательно для заполнения'}), 400
        
        valid_statuses = ['requested', 'sampled', 'testing', 'passed', 'failed']
        if data.get('status') and data['status'] not in valid_statuses:
            return jsonify({'message': f'Статус должен быть одним из: {", ".join(valid_statuses)}'}), 400
        
        new_request = LabSampleRequest(
            project_id=project_id,
            document_id=data.get('document_id'),
            initiator_id=request.current_user['id'],
            material_name=data['material_name'],
            status=data.get('status', 'requested'),
            notes=data.get('notes'),
            result_document_url=data.get('result_document_url')
        )
        
        db.session.add(new_request)
        db.session.commit()
        
        return jsonify({
            'message': 'Запрос на отбор проб успешно создан',
            'lab_sample_request': new_request.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Ошибка создания запроса на отбор проб', 'error': str(e)}), 500


@lab_sample_bp.route('/api/projects/<project_id>/lab-samples', methods=['GET'])
@token_required
def get_lab_sample_requests(project_id):
    """
    Возвращает все запросы на лабораторный анализ для проекта.
    """
    try:
        requests = LabSampleRequest.query.filter_by(project_id=project_id).all()
        
        return jsonify({
            'lab_sample_requests': [req.to_dict() for req in requests]
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Ошибка получения запросов на отбор проб', 'error': str(e)}), 500


@lab_sample_bp.route('/api/lab-samples/<sample_id>', methods=['GET'])
@token_required
def get_lab_sample_request(sample_id):
    """
    Возвращает детальную информацию о запросе на анализ.

    Проверяет права доступа пользователя: прорабы могут видеть
    только те запросы, которые они инициировали.
    """
    try:
        request_obj = db.session.get(LabSampleRequest, sample_id)
        
        if not request_obj:
            return jsonify({'message': 'Запрос на отбор проб не найден'}), 404
        
        user_role = request.current_user['role']
        user_id = request.current_user['id']
        
        if user_role in ['foreman'] and request_obj.initiator_id != user_id:
            return jsonify({'message': 'Недостаточно прав для просмотра этого запроса'}), 403
        
        return jsonify({
            'lab_sample_request': request_obj.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Ошибка получения запроса на отбор проб', 'error': str(e)}), 500


@lab_sample_bp.route('/api/lab-samples/<sample_id>', methods=['PUT'])
@token_required
def update_lab_sample_request(sample_id):
    """
    Обновляет информацию о запросе на лабораторный анализ.

    Только инспекторы и клиенты могут обновлять запрос. Позволяет
    изменять статус, заметки и URL документа с результатами.
    """
    try:
        request_obj = db.session.get(LabSampleRequest, sample_id)
        
        if not request_obj:
            return jsonify({'message': 'Запрос на отбор проб не найден'}), 404
        
        user_role = request.current_user['role']
        if user_role not in ['inspector', 'client']:
            return jsonify({'message': 'Недостаточно прав для обновления запроса на отбор проб'}), 403
        
        data = request.get_json()
        
        if 'status' in data:
            valid_statuses = ['requested', 'sampled', 'testing', 'passed', 'failed']
            if data['status'] not in valid_statuses:
                return jsonify({'message': f'Статус должен быть одним из: {", ".join(valid_statuses)}'}), 400
        
        updatable_fields = ['status', 'notes', 'result_document_url']
        for field in updatable_fields:
            if field in data:
                setattr(request_obj, field, data[field])
        
        request_obj.updated_at = datetime.now(timezone.utc)
        db.session.commit()
        
        return jsonify({
            'message': 'Запрос на отбор проб успешно обновлен',
            'lab_sample_request': request_obj.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Ошибка обновления запроса на отбор проб', 'error': str(e)}), 500


@lab_sample_bp.route('/api/lab-samples/<sample_id>', methods=['DELETE'])
@token_required
@role_required('client')
def delete_lab_sample_request(sample_id):
    """
    Удаляет запрос на лабораторный анализ.

    Только клиенты могут удалять запросы.
    """
    try:
        request_obj = db.session.get(LabSampleRequest, sample_id)
        
        if not request_obj:
            return jsonify({'message': 'Запрос на отбор проб не найден'}), 404
        
        db.session.delete(request_obj)
        db.session.commit()
        
        return jsonify({'message': 'Запрос на отбор проб успешно удален'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Ошибка удаления запроса на отбор проб', 'error': str(e)}), 500

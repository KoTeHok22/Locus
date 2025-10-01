
from flask import Blueprint, request, jsonify
from models import db, Task
from auth import token_required, role_required

task_bp = Blueprint('task_bp', __name__)

@task_bp.route('/api/tasks', methods=['GET'])
@token_required
def get_tasks():
    """
    Возвращает список задач с возможностью фильтрации.
    Поддерживает фильтры: `status`, `assignee_id`.
    """
    query = Task.query

    # Фильтр по статусу
    status = request.args.get('status')
    if status:
        query = query.filter(Task.status == status)

    # Фильтр по исполнителю (прорабу)
    # NOTE: В будущем можно добавить логику, чтобы прораб мог запрашивать только свои задачи без указания id
    assignee_id = request.args.get('assignee_id')
    if assignee_id:
        query = query.filter(Task.completed_by_id == assignee_id)

    tasks = query.order_by(Task.end_date).all()

    # NOTE: Здесь также нужно обогащать данные (имя проекта и т.д.), но пока оставим так для скорости
    tasks_list = [{
        'id': task.id,
        'project_id': task.project_id,
        'name': task.name,
        'status': task.status,
        'start_date': task.start_date.isoformat(),
        'end_date': task.end_date.isoformat(),
        'completed_at': task.completed_at.isoformat() if task.completed_at else None,
        # 'project_name': task.project.name, // Пример обогащения
    } for task in tasks]

    return jsonify(tasks_list), 200

@task_bp.route('/api/projects/<int:project_id>/tasks/<int:task_id>/verify', methods=['POST'])
@token_required
@role_required('client')
def verify_task(project_id, task_id):
    """
    Верифицирует выполненную задачу.
    Доступно для 'client' и 'inspector'.
    Принимает статус 'verified' или 'rejected'.
    """
    task = Task.query.filter_by(id=task_id, project_id=project_id).first_or_404()
    
    if task.status != 'completed':
        return jsonify({'message': 'Задачу можно верифицировать только в статусе completed'}), 409

    data = request.get_json()
    new_status = data.get('status')

    if new_status not in ['verified', 'rejected']:
        return jsonify({'message': 'Статус должен быть \'verified\' или \'rejected\''}), 400

    if new_status == 'verified':
        task.status = 'verified'
        task.verified_by_id = request.current_user['id']
    elif new_status == 'rejected':
        task.status = 'pending'
        task.completed_by_id = None
        task.completed_at = None

    db.session.commit()
    return jsonify({'message': f'Статус задачи обновлен на {task.status}'}), 200


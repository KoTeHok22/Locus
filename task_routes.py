from flask import Blueprint, request, jsonify
from datetime import datetime
from werkzeug.utils import secure_filename
import os
import uuid
from models import db, Task
from auth import token_required, role_required

task_bp = Blueprint('task_bp', __name__)

UPLOAD_FOLDER = 'uploads/task_photos'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@task_bp.route('/api/tasks', methods=['GET'])
@token_required
def get_tasks():
    """
    Возвращает список задач с возможностью фильтрации.
    Поддерживает фильтры: `status`, `assignee_id`, `project_id`.
    """
    query = Task.query

    project_id = request.args.get('project_id')
    if project_id:
        query = query.filter(Task.project_id == project_id)

    status = request.args.get('status')
    if status:
        query = query.filter(Task.status == status)

    assignee_id = request.args.get('assignee_id')
    if assignee_id:
        query = query.filter(Task.completed_by_id == assignee_id)

    tasks = query.order_by(Task.end_date).all()

    tasks_list = [{
        'id': task.id,
        'project_id': task.project_id,
        'name': task.name,
        'status': task.status,
        'start_date': task.start_date.isoformat(),
        'end_date': task.end_date.isoformat(),
        'completed_at': task.completed_at.isoformat() if task.completed_at else None,
        'completion_comment': task.completion_comment,
        'completion_photos': task.completion_photos or [],
    } for task in tasks]

    return jsonify(tasks_list), 200

@task_bp.route('/api/tasks', methods=['POST'])
@token_required
@role_required('client')
def create_task():
    """
    Создает новую плановую задачу.
    Доступно для роли 'client' (заказчик).
    """
    data = request.get_json()
    if not data:
        return jsonify({"message": "Пустое тело запроса"}), 400

    project_id = data.get('project_id')
    name = data.get('name')
    start_date_str = data.get('start_date')
    end_date_str = data.get('end_date')

    if not all([project_id, name, start_date_str, end_date_str]):
        return jsonify({"message": "Необходимые поля: project_id, name, start_date, end_date"}), 400

    try:
        start_date = datetime.fromisoformat(start_date_str.split('T')[0]).date()
        end_date = datetime.fromisoformat(end_date_str.split('T')[0]).date()
    except (ValueError, TypeError):
        return jsonify({"message": "Неверный формат даты. Ожидается ISO 8601 (YYYY-MM-DD)."}), 400

    new_task = Task(
        project_id=project_id,
        name=name,
        start_date=start_date,
        end_date=end_date,
        status='pending'
    )

    db.session.add(new_task)
    db.session.commit()
    
    # Возвращаем задачу в том же формате, что и get_tasks
    task_dict = {
        'id': new_task.id,
        'project_id': new_task.project_id,
        'name': new_task.name,
        'status': new_task.status,
        'start_date': new_task.start_date.isoformat(),
        'end_date': new_task.end_date.isoformat(),
        'completed_at': None,
        'completion_comment': None,
        'completion_photos': [],
    }

    return jsonify(task_dict), 201
@task_bp.route('/api/projects/<int:project_id>/tasks/<int:task_id>', methods=['PATCH'])
@token_required
def update_task_status(project_id, task_id):
    """
    Обновляет статус задачи (для прораба).
    Принимает статус 'completed' для отметки задачи как выполненной.
    Требует прикрепления минимум одного фото при завершении.
    """
    task = Task.query.filter_by(id=task_id, project_id=project_id).first_or_404()
    
    if 'status' not in request.form:
        return jsonify({'message': 'Статус не указан'}), 400

    new_status = request.form.get('status')
    
    if new_status == 'completed':
        photos = request.files.getlist('photos')
        if not photos or len(photos) == 0:
            return jsonify({'message': 'Необходимо прикрепить минимум одно фото'}), 400
        
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        
        photo_urls = []
        for photo in photos:
            if photo and allowed_file(photo.filename):
                ext = photo.filename.rsplit('.', 1)[1].lower()
                filename = f"{uuid.uuid4()}.{ext}"
                filepath = os.path.join(UPLOAD_FOLDER, filename)
                photo.save(filepath)
                photo_urls.append(f"/uploads/task_photos/{filename}")
        
        if not photo_urls:
            return jsonify({'message': 'Не удалось загрузить фотографии. Проверьте формат файлов.'}), 400
        
        task.status = 'completed'
        task.completed_by_id = request.current_user['id']
        task.completed_at = datetime.utcnow()
        task.completion_comment = request.form.get('comment', '')
        task.completion_photos = photo_urls
        task.completion_geolocation = request.form.get('geolocation')
    else:
        task.status = new_status

    db.session.commit()
    return jsonify({'message': f'Статус задачи обновлен на {task.status}'}), 200

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

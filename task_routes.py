from flask import Blueprint, request, jsonify
from datetime import datetime
from werkzeug.utils import secure_filename
import os
import uuid
from models import db, Task, WorkPlanItem, TaskMaterialUsage, Material, Project, ProjectUser
from auth import token_required, role_required
from project_access import require_project_access
from risk_calculator import recalculate_project_risk
from notification_service import create_notification

task_bp = Blueprint('task_bp', __name__)

UPLOAD_FOLDER = 'uploads/task_photos'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def _update_work_plan_item_progress(work_plan_item_id):
    work_plan_item = WorkPlanItem.query.get(work_plan_item_id)
    if work_plan_item:
        total_tasks = Task.query.filter_by(work_plan_item_id=work_plan_item.id).count()
        if total_tasks > 0:
            completed_tasks = Task.query.filter(
                Task.work_plan_item_id == work_plan_item.id,
                Task.status.in_(['completed', 'verified'])
            ).count()
            work_plan_item.progress = (completed_tasks / total_tasks) * 100
        else:
            work_plan_item.progress = 0
        db.session.commit()

@task_bp.route('/api/tasks', methods=['GET'])
@token_required
def get_tasks():
    """
    Возвращает список задач с возможностью фильтрации.
    Поддерживает фильтры: `status`, `assignee_id`, `project_id`.
    """
    current_user = request.current_user
    query = Task.query

    project_id = request.args.get('project_id')
    if project_id:
        access_error = require_project_access(int(project_id), current_user['id'], current_user['role'])
        if access_error:
            return access_error
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
        'work_plan_item_id': task.work_plan_item_id,
        'work_plan_item': task.work_plan_item.to_dict() if task.work_plan_item else None,
        'name': task.name,
        'status': task.status,
        'start_date': task.start_date.isoformat(),
        'end_date': task.end_date.isoformat(),
        'completed_at': task.completed_at.isoformat() if task.completed_at else None,
        'completion_comment': task.completion_comment,
        'completion_photos': task.completion_photos or [],
        'actual_quantity': task.actual_quantity,
        'material_usage': [mu.to_dict() for mu in task.material_usage] if hasattr(task, 'material_usage') else []
    } for task in tasks]

    return jsonify(tasks_list), 200

@task_bp.route('/api/tasks', methods=['POST'])
@token_required
@role_required('client')
def create_task():
    """
    Создает новую плановую задачу.
    Доступно для роли 'client' (служба строительного контроля/заказчик).
    Требует указания work_plan_item_id.
    """
    data = request.get_json()
    if not data:
        return jsonify({"message": "Пустое тело запроса"}), 400

    project_id = data.get('project_id')
    work_plan_item_id = data.get('work_plan_item_id')
    name = data.get('name')
    start_date_str = data.get('start_date')
    end_date_str = data.get('end_date')

    if not all([project_id, work_plan_item_id, name, start_date_str, end_date_str]):
        return jsonify({"message": "Необходимые поля: project_id, work_plan_item_id, name, start_date, end_date"}), 400

    try:
        project_id = int(project_id)
        work_plan_item_id = int(work_plan_item_id)
    except (ValueError, TypeError):
        return jsonify({"message": "project_id и work_plan_item_id должны быть числами"}), 400

    project = db.get_or_404(Project, project_id)
    if project.status != 'active':
        return jsonify({'message': 'Нельзя создавать задачи для неактивного проекта'}), 403

    work_plan_item = WorkPlanItem.query.get(work_plan_item_id)
    if not work_plan_item:
        return jsonify({"message": "Пункт плана работ не найден"}), 404
    
    if work_plan_item.work_plan.project_id != project_id:
        return jsonify({"message": "Пункт плана не принадлежит данному проекту"}), 400

    try:
        start_date = datetime.fromisoformat(start_date_str.split('T')[0]).date()
        end_date = datetime.fromisoformat(end_date_str.split('T')[0]).date()
    except (ValueError, TypeError):
        return jsonify({"message": "Неверный формат даты. Ожидается ISO 8601 (YYYY-MM-DD)."}), 400

    new_task = Task(
        project_id=project_id,
        work_plan_item_id=work_plan_item_id,
        name=name,
        start_date=start_date,
        end_date=end_date,
        status='pending'
    )

    db.session.add(new_task)
    db.session.commit()

    recalculate_project_risk(project_id, triggering_user_id=request.current_user['id'])
    
    task_dict = {
        'id': new_task.id,
        'project_id': new_task.project_id,
        'work_plan_item_id': new_task.work_plan_item_id,
        'work_plan_item': work_plan_item.to_dict(),
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
    Фото необязательны для демонстрации на хакатоне.
    Принимает материалы в формате: materials[0][material_id]=1&materials[0][quantity]=10
    """
    try:
        if request.current_user.get('role') != 'foreman':
            return jsonify({'message': 'Только прораб может отмечать выполнение задач'}), 403
        
        task = Task.query.filter_by(id=task_id, project_id=project_id).first_or_404()
        
        if 'status' not in request.form:
            return jsonify({'message': 'Статус не указан'}), 400

        new_status = request.form.get('status')
        
        if new_status == 'completed':
            photos = request.files.getlist('photos')
            
            os.makedirs(UPLOAD_FOLDER, exist_ok=True)
            
            photo_urls = []
            if photos and len(photos) > 0:
                for photo in photos:
                    if photo and allowed_file(photo.filename):
                        ext = photo.filename.rsplit('.', 1)[1].lower()
                        filename = f"{uuid.uuid4()}.{ext}"
                        filepath = os.path.join(UPLOAD_FOLDER, filename)
                        photo.save(filepath)
                        photo_urls.append(f"/uploads/task_photos/{filename}")
            
            task.status = 'completed'
            task.completed_by_id = request.current_user['id']
            task.completed_at = datetime.utcnow()
            task.completion_comment = request.form.get('comment', '')
            task.completion_photos = photo_urls
            task.completion_geolocation = request.form.get('geolocation')
            
            actual_quantity = request.form.get('actual_quantity')
            if actual_quantity:
                task.actual_quantity = float(actual_quantity)
            
            materials_data = request.form.get('materials')
            if materials_data:
                import json
                materials = json.loads(materials_data)
                for mat in materials:
                    material_id = mat.get('material_id')
                    quantity = mat.get('quantity')
                    if material_id and quantity:
                        usage = TaskMaterialUsage(
                            task_id=task.id,
                            material_id=material_id,
                            quantity_used=float(quantity),
                            recorded_by_id=request.current_user['id']
                        )
                        db.session.add(usage)
        else:
            task.status = new_status

        db.session.commit()
        db.session.refresh(task)

        _update_work_plan_item_progress(task.work_plan_item_id)
        
        recalculate_project_risk(task.project_id, triggering_user_id=request.current_user['id'])
        
        if new_status == 'completed':
            project = db.session.get(Project, task.project_id)
            client_assignment = db.session.query(ProjectUser).filter_by(
                project_id=task.project_id,
                role='client'
            ).first()
            
            if client_assignment:
                create_notification(
                    user_id=client_assignment.user_id,
                    message=f"Задача '{task.name}' выполнена и ожидает верификации в проекте '{project.name}'",
                    link=f"/projects/{task.project_id}"
                )
        
        return jsonify({
            'message': f'Статус задачи обновлен на {task.status}',
            'task': {
                'id': task.id,
                'work_plan_item': task.work_plan_item.to_dict() if task.work_plan_item else None,
                'material_usage': [mu.to_dict() for mu in task.material_usage]
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Внутренняя ошибка сервера при обновлении задачи', 'error': str(e)}), 500

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

    _update_work_plan_item_progress(task.work_plan_item_id)
    
    recalculate_project_risk(task.project_id, triggering_user_id=request.current_user['id'])
    
    if task.completed_by_id:
        project = db.session.get(Project, task.project_id)
        status_text = 'принята' if new_status == 'verified' else 'отклонена'
        
        foreman_assignment = db.session.query(ProjectUser).filter_by(
            project_id=task.project_id,
            role='foreman'
        ).first()
        
        if foreman_assignment:
            create_notification(
                user_id=foreman_assignment.user_id,
                message=f"Задача '{task.name}' в проекте '{project.name}' {status_text}",
                link=f"/projects/{task.project_id}"
            )
    
    return jsonify({'message': f'Статус задачи обновлен на {task.status}'}), 200

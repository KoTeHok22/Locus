
from flask import Blueprint, request, jsonify
from models import db, Project, Task, Material, TaskMaterial, task_dependencies
from auth import token_required, role_required
from datetime import datetime

schedule_bp = Blueprint('schedule_bp_v2', __name__)

# --- Управление задачами (Tasks) ---

@schedule_bp.route('/api/projects/<int:project_id>/tasks', methods=['POST'])
@token_required
@role_required('client')
def add_task_to_project(project_id):
    """Добавляет новую задачу в проект."""
    data = request.get_json()
    if not data or not data.get('name') or not data.get('start_date') or not data.get('end_date'):
        return jsonify({'message': 'Необходимы поля: name, start_date, end_date'}), 400

    project = Project.query.get_or_404(project_id)

    try:
        new_task = Task(
            project_id=project.id,
            name=data['name'],
            start_date=datetime.strptime(data['start_date'], '%Y-%m-%d').date(),
            end_date=datetime.strptime(data['end_date'], '%Y-%m-%d').date(),
        )
        db.session.add(new_task)
        db.session.commit()
        # Здесь можно будет вернуть to_dict(), когда он будет исправлен
        return jsonify({'message': 'Задача успешно создана', 'task_id': new_task.id}), 201
    except (ValueError, KeyError) as e:
        return jsonify({'message': f'Ошибка в данных: {e}'}), 400

@schedule_bp.route('/api/tasks/<int:task_id>', methods=['GET'])
@token_required
def get_task(task_id):
    """Возвращает информацию о конкретной задаче."""
    task = Task.query.get_or_404(task_id)
    # В будущем здесь будет полноценный to_dict
    task_data = {
        'id': task.id,
        'project_id': task.project_id,
        'name': task.name,
        'start_date': task.start_date.isoformat(),
        'end_date': task.end_date.isoformat(),
        'status': task.status
    }
    return jsonify(task_data), 200

@schedule_bp.route('/api/tasks/<int:task_id>', methods=['PUT'])
@token_required
@role_required('client')
def update_task(task_id):
    """Обновляет данные задачи (название, даты)."""
    task = Task.query.get_or_404(task_id)
    data = request.get_json()

    try:
        if 'name' in data: task.name = data['name']
        if 'start_date' in data: task.start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
        if 'end_date' in data: task.end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date()
        db.session.commit()
        return jsonify({'message': 'Задача успешно обновлена'}), 200
    except (ValueError) as e:
        return jsonify({'message': f'Ошибка в данных: {e}'}), 400

@schedule_bp.route('/api/tasks/<int:task_id>', methods=['DELETE'])
@token_required
@role_required('client')
def delete_task(task_id):
    """Удаляет задачу."""
    task = Task.query.get_or_404(task_id)
    db.session.delete(task)
    db.session.commit()
    return jsonify({'message': 'Задача удалена'}), 200

# --- Управление материалами для задач ---

@schedule_bp.route('/api/tasks/<int:task_id>/materials', methods=['POST'])
@token_required
@role_required('client')
def add_material_to_task(task_id):
    """Добавляет плановый материал к задаче."""
    data = request.get_json()
    if not data or not data.get('material_id') or not data.get('quantity'):
        return jsonify({'message': 'Необходимы поля: material_id, quantity'}), 400

    task = Task.query.get_or_404(task_id)
    material = Material.query.get_or_404(data['material_id'])

    # Проверяем, не добавлен ли уже такой материал
    existing_link = TaskMaterial.query.filter_by(task_id=task.id, material_id=material.id).first()
    if existing_link:
        return jsonify({'message': 'Этот материал уже добавлен к задаче'}), 409

    task_material = TaskMaterial(
        task_id=task.id,
        material_id=material.id,
        quantity=data['quantity']
    )
    db.session.add(task_material)
    db.session.commit()
    return jsonify({'message': 'Материал добавлен к задаче'}), 201

@schedule_bp.route('/api/tasks/<int:task_id>/materials/<int:material_id>', methods=['DELETE'])
@token_required
@role_required('client')
def remove_material_from_task(task_id, material_id):
    """Удаляет плановый материал из задачи."""
    link = TaskMaterial.query.filter_by(task_id=task_id, material_id=material_id).first_or_404()
    db.session.delete(link)
    db.session.commit()
    return jsonify({'message': 'Материал удален из задачи'}), 200

# --- Управление зависимостями задач ---

@schedule_bp.route('/api/tasks/<int:task_id>/dependencies', methods=['POST'])
@token_required
@role_required('client')
def add_task_dependency(task_id):
    """Добавляет зависимость к задаче (эта задача зависит от другой)."""
    data = request.get_json()
    if not data or not data.get('depends_on_id'):
        return jsonify({'message': 'Необходимо поле: depends_on_id'}), 400

    task = Task.query.get_or_404(task_id)
    dependency_task = Task.query.get_or_404(data['depends_on_id'])

    if task.id == dependency_task.id:
        return jsonify({'message': 'Задача не может зависеть от самой себя'}), 400
    
    # Проверка на циклическую зависимость (упрощенная)
    if dependency_task in task.dependents:
         return jsonify({'message': 'Обнаружена циклическая зависимость'}), 400

    task.dependencies.append(dependency_task)
    db.session.commit()
    return jsonify({'message': 'Зависимость добавлена'}), 201

@schedule_bp.route('/api/tasks/<int:task_id>/dependencies/<int:depends_on_id>', methods=['DELETE'])
@token_required
@role_required('client')
def remove_task_dependency(task_id, depends_on_id):
    """Удаляет зависимость из задачи."""
    task = Task.query.get_or_404(task_id)
    dependency_to_remove = Task.query.get_or_404(depends_on_id)

    if dependency_to_remove in task.dependencies:
        task.dependencies.remove(dependency_to_remove)
        db.session.commit()
        return jsonify({'message': 'Зависимость удалена'}), 200
    else:
        return jsonify({'message': 'Зависимость не найдена'}), 404

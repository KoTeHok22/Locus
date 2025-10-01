from flask import Blueprint, request, jsonify
from sqlalchemy import func
from sqlalchemy.orm import aliased
import os
from dotenv import load_dotenv
from geopy.geocoders import Yandex
from geopy.exc import GeocoderQueryError, GeocoderTimedOut, GeocoderUnavailable

from models import db, Project, User, ProjectUser, Task, Issue
from auth import token_required, role_required

project_bp_v2 = Blueprint('project_bp_v2', __name__)

load_dotenv()
api_key = os.getenv('YANDEX_GEOCODER_API_KEY') or os.getenv('VITE_YANDEX_MAPS_API_KEY')
geolocator = Yandex(api_key=api_key) if api_key else None

@project_bp_v2.route('/api/projects', methods=['GET'])
@token_required
def get_projects():
    """
    Возвращает список проектов с агрегированными данными (кол-во задач и нарушений).
    - Инспекторы видят все проекты.
    - Остальные роли видят только те проекты, в которых они состоят.
    """
    current_user = request.current_user
    
    tasks_count_query = db.session.query(Task.project_id, func.count(Task.id).label('tasks_count')) \
        .group_by(Task.project_id).subquery()
    
    issues_count_query = db.session.query(Issue.project_id, func.count(Issue.id).label('issues_count')) \
        .filter(Issue.status == 'open').group_by(Issue.project_id).subquery()

    query = db.session.query(
        Project,
        func.coalesce(tasks_count_query.c.tasks_count, 0).label('tasks_count'),
        func.coalesce(issues_count_query.c.issues_count, 0).label('issues_count')
    ).outerjoin(tasks_count_query, Project.id == tasks_count_query.c.project_id) \
     .outerjoin(issues_count_query, Project.id == issues_count_query.c.project_id)

    if current_user['role'] != 'inspector':
        query = query.join(ProjectUser, Project.id == ProjectUser.project_id) \
                     .filter(ProjectUser.user_id == current_user['id'])

    results = query.order_by(Project.name).all()

    projects_list = []
    for project, tasks_count, issues_count in results:
        project_dict = {
            'id': project.id,
            'name': project.name,
            'address': project.address,
            'latitude': project.latitude,
            'longitude': project.longitude,
            'status': project.status,
            'polygon': project.polygon,
            'created_at': project.created_at.isoformat(),
            'tasks_count': tasks_count,
            'issues_count': issues_count
        }
        projects_list.append(project_dict)

    return jsonify(projects_list), 200

@project_bp_v2.route('/api/projects', methods=['POST'])
@token_required
def create_project():
    """Создает новый проект с геокодированием адреса."""
    if request.current_user.get('role') in ['inspector', 'foreman']:
        return jsonify({'message': 'У вас недостаточно прав для выполнения этого действия.'}), 403

    data = request.get_json()
    if not data or not data.get('name') or not data.get('address'):
        return jsonify({'message': 'Требуются название и адрес проекта'}), 400

    existing_name = Project.query.filter(func.lower(Project.name) == func.lower(data['name'])).first()
    if existing_name:
        return jsonify({'message': f"Проект с названием '{data['name']}' уже существует."}), 409

    existing_address = Project.query.filter(func.lower(Project.address) == func.lower(data['address'])).first()
    if existing_address:
        return jsonify({'message': f"Проект с адресом '{data['address']}' уже существует."}), 409

    address = data.get('address')
    latitude, longitude = None, None

    if address:
        if not geolocator:
            return jsonify({'message': 'Сервис геокодирования не настроен. Проверьте API-ключ на сервере.'}), 503
        try:
            location = geolocator.geocode(address, timeout=10)
            if location:
                latitude = location.latitude
                longitude = location.longitude
            else:
                return jsonify({'message': f'Не удалось определить координаты для адреса: "{address}"'}), 400
        except (GeocoderQueryError, ValueError) as e:
            return jsonify({'message': f'Ошибка в запросе к сервису геокодирования: {e}'}), 400
        except (GeocoderTimedOut, GeocoderUnavailable) as e:
            return jsonify({'message': f'Сервис геокодирования временно недоступен: {e}'}), 503
        except Exception as e:
            return jsonify({'message': f'Внутренняя ошибка при геокодировании: {e}'}), 500

    new_project = Project(
        name=data['name'],
        address=address,
        latitude=latitude,
        longitude=longitude,
        polygon=data.get('polygon')
    )
    
    creator_id = request.current_user['id']
    project_user_link = ProjectUser(project=new_project, user_id=creator_id)
    
    db.session.add(new_project)
    db.session.add(project_user_link)
    db.session.commit()
    
    return jsonify({
        'id': new_project.id,
        'name': new_project.name,
        'address': new_project.address,
        'latitude': new_project.latitude,
        'longitude': new_project.longitude,
        'status': new_project.status,
        'polygon': new_project.polygon,
        'created_at': new_project.created_at.isoformat(),
        'tasks_count': 0,
        'issues_count': 0
    }), 201

@project_bp_v2.route('/api/projects/<int:project_id>', methods=['GET'])
@token_required
def get_project_details(project_id):
    """Возвращает детальную информацию о проекте (пока без изменений)."""
    project = db.get_or_404(Project, project_id)
    project_dict = {
        'id': project.id,
        'name': project.name,
        'address': project.address,
        'latitude': project.latitude,
        'longitude': project.longitude,
        'status': project.status,
        'polygon': project.polygon,
        'created_at': project.created_at.isoformat()
    }
    return jsonify(project_dict), 200


@project_bp_v2.route('/api/projects/<int:project_id>/members', methods=['POST'])
@token_required
@role_required('client')
def add_project_member(project_id):
    """Добавляет участника в проект."""
    project = db.get_or_404(Project, project_id)
    data = request.get_json()

    if not data or not data.get('email') or not data.get('role'):
        return jsonify({'message': 'Требуются email и role'}), 400

    email = data['email']

    user_to_add = User.query.filter_by(email=email).first()
    if not user_to_add:
        return jsonify({'message': f'Пользователь с email {email} не найден.'}), 404

    existing_link = ProjectUser.query.filter_by(project_id=project.id, user_id=user_to_add.id).first()
    if existing_link:
        return jsonify({'message': 'Пользователь уже является участником проекта'}), 409

    new_link = ProjectUser(project_id=project.id, user_id=user_to_add.id)
    db.session.add(new_link)
    db.session.commit()

    return jsonify({'message': f'Пользователь {email} успешно добавлен в проект.'}), 201

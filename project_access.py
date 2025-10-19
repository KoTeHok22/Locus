from flask import jsonify
from models import ProjectUser

def check_project_access(project_id, user_id, user_role):
    """
    Проверяет, имеет ли пользователь доступ к проекту.
    Инспекторы имеют доступ ко всем проектам.
    Служба строительного контроля (заказчики) и прорабы только к тем, к которым привязаны.
    """
    if user_role == 'inspector':
        return True
    
    if user_role in ['client', 'foreman']:
        has_access = ProjectUser.query.filter_by(
            project_id=project_id,
            user_id=user_id
        ).first()
        return bool(has_access)
    
    return False

def require_project_access(project_id, user_id, user_role):
    """
    Проверяет доступ и возвращает JSON-ответ с ошибкой, если доступа нет.
    Возвращает None, если доступ есть.
    """
    if not check_project_access(project_id, user_id, user_role):
        return jsonify({'message': 'У вас нет доступа к этому проекту'}), 403
    return None

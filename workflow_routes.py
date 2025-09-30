from flask import Blueprint, request, jsonify
from models import db, Project, Issue, User
from auth import token_required, role_required, geolocation_required
from datetime import datetime, timezone

workflow_bp = Blueprint('workflow', __name__)

@workflow_bp.route('/api/projects/<project_id>/activate', methods=['POST'])
@token_required
@role_required('client')
def activate_project(project_id):
    """
    Активирует проект.

    Требует роль 'client'. Устанавливает статус проекта на 'active'.
    В будущем здесь будет добавлена логика обработки чек-листа
    и назначения прораба.
    """
    project = db.get_or_404(Project, project_id)
    data = request.get_json()
    
    project.status = 'active'
    db.session.commit()
    
    return jsonify({'message': 'Проект активирован и ожидает согласования инспектора'}), 200

@workflow_bp.route('/api/projects/<project_id>/activation/approve', methods=['POST'])
@token_required
@role_required('inspector')
@geolocation_required
def approve_activation(project_id):
    """
    Согласовывает активацию проекта.

    Требует роль 'inspector' и наличие геолокации. Логирует факт
    согласования с указанием геолокации инспектора.
    """
    project = db.get_or_404(Project, project_id)
    
    print(f"Активация проекта {project_id} согласована инспектором {request.current_user['id']} с геопозиции {request.headers.get('X-User-Geolocation')}")
    
    return jsonify({'message': 'Активация проекта согласована'}), 200

@workflow_bp.route('/api/projects/<project_id>/issues', methods=['POST'])
@token_required
@geolocation_required
def create_issue(project_id):
    """
    Создает новое замечание или нарушение в проекте.

    Требует наличие геолокации. Проверяет, что 'client' может создавать
    только замечания ('remark'), а 'inspector' - только нарушения ('violation').
    Создает новую запись в базе данных.
    """
    user_role = request.current_user['role']
    data = request.get_json()
    
    if user_role == 'client' and data.get('type') != 'remark':
        return jsonify({'message': 'Клиент может создавать только замечания (remark)'}), 403
    if user_role == 'inspector' and data.get('type') != 'violation':
        return jsonify({'message': 'Инспектор может создавать только нарушения (violation)'}), 403

    if not data or not data.get('description') or not data.get('type'):
        return jsonify({'message': 'Требуются description и type'}), 400

    new_issue = Issue(
        project_id=project_id,
        author_id=request.current_user['id'],
        type=data['type'],
        classifier_id=data.get('classifier_id'),
        description=data['description'],
        document_ids=data.get('document_ids', []),
        due_date=datetime.strptime(data['due_date'], '%Y-%m-%d').date() if data.get('due_date') else None,
        task_id=data.get('task_id')
    )
    db.session.add(new_issue)
    db.session.commit()

    return jsonify(new_issue.to_dict()), 201

@workflow_bp.route('/api/issues/<issue_id>/resolve', methods=['POST'])
@token_required
@role_required('foreman')
def resolve_issue(issue_id):
    """
    Отмечает устранение замечания.

    Требует роль 'foreman'. Устанавливает статус замечания
    (например, 'fixing' или 'resolved'), добавляет комментарий
    и прикрепляет документы, подтверждающие устранение.
    """
    issue = db.get_or_404(Issue, issue_id)
    data = request.get_json()
    
    # Статус 'fixing' означает, что прораб отправил решение на проверку
    issue.status = 'fixing' 
    issue.resolution_comment = data.get('comment')
    issue.resolved_by_id = request.current_user['id']
    issue.resolved_at = datetime.now(timezone.utc)
    
    if 'document_ids' in data:
        existing_docs = issue.document_ids or []
        issue.document_ids = existing_docs + data['document_ids']

    db.session.commit()
    return jsonify({'message': 'Отмечено устранение замечания'}), 200

@workflow_bp.route('/api/issues/<issue_id>/review', methods=['POST'])
@token_required
@geolocation_required
def review_issue(issue_id):
    """
    Проверяет устраненное замечание.

    Требует наличие геолокации. Проверяет, что замечания ('remark')
    могут быть проверены только 'client', а нарушения ('violation') -
    только 'inspector'. Устанавливает статус 'approved' или 'rejected'
    и логирует геолокацию проверяющего.
    """
    issue = db.get_or_404(Issue, issue_id)
    data = request.get_json()
    status = data.get('status')
    user_role = request.current_user['role']

    if (issue.type == 'remark' and user_role != 'client') or \
       (issue.type == 'violation' and user_role != 'inspector'):
        return jsonify({'message': 'Недостаточно прав для проверки этого замечания'}), 403

    if status not in ['approved', 'rejected']:
        return jsonify({'message': 'Статус должен быть approved или rejected'}), 400

    issue.status = status
    print(f"Ревью замечания {issue_id} пользователем {request.current_user['id']} со статусом {status} с геопозиции {request.headers.get('X-User-Geolocation')}")

    db.session.commit()
    return jsonify({'message': f'Замечание проверено со статусом {status}'}), 200
from flask import Blueprint, request, jsonify, current_app
from models import db, Issue, Project, ProjectUser
from auth import token_required, role_required
from project_access import require_project_access
from datetime import datetime, timezone
from risk_calculator import recalculate_project_risk
from notification_service import create_notification
import os
import uuid

issue_bp = Blueprint('issue_bp', __name__)

UPLOAD_FOLDER = 'uploads/issue_photos'

def allowed_file(filename):
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@issue_bp.route('/api/issues', methods=['GET'])
@token_required
def get_issues():
    """
    Возвращает список нарушений с возможностью фильтрации.
    Поддерживает фильтры: `status`, `project_id`.
    Для прораба фильтрует только по его проектам.
    """
    query = db.session.query(Issue, Project).join(Project, Issue.project_id == Project.id)

    user_role = request.current_user['role']
    user_id = request.current_user['id']
    
    if user_role == 'foreman':
        foreman_projects = db.session.query(ProjectUser.project_id).filter(
            ProjectUser.user_id == user_id
        ).all()
        foreman_project_ids = [p.project_id for p in foreman_projects]
        
        if foreman_project_ids:
            query = query.filter(Issue.project_id.in_(foreman_project_ids))
        else:
            return jsonify([]), 200

    status = request.args.get('status')
    if status:
        query = query.filter(Issue.status == status)
    
    project_id = request.args.get('project_id')
    if project_id:
        access_error = require_project_access(int(project_id), user_id, user_role)
        if access_error:
            return access_error
        query = query.filter(Issue.project_id == project_id)

    results = query.order_by(Issue.due_date).all()
    
    issues_list = []
    for issue, project in results:
        issue_dict = issue.to_dict()
        issue_dict['project_name'] = project.name
        issues_list.append(issue_dict)

    return jsonify(issues_list), 200

@issue_bp.route('/api/issues/<int:issue_id>/resolve', methods=['POST'])
@token_required
@role_required('foreman')
def resolve_issue(issue_id):
    """
    Устранение нарушения прорабом с загрузкой фотографий.
    Требует минимум 1 фото подтверждения устранения.
    """
    issue = db.session.get(Issue, issue_id)
    
    if not issue:
        return jsonify({'message': 'Нарушение не найдено'}), 404
    
    if issue.status == 'resolved':
        return jsonify({'message': 'Нарушение уже устранено'}), 400
    
    photos = request.files.getlist('photos')
    if not photos or len(photos) == 0:
        return jsonify({'message': 'Необходимо прикрепить минимум одно фото устранения'}), 400
    
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    
    photo_urls = []
    for photo in photos:
        if photo and allowed_file(photo.filename):
            ext = photo.filename.rsplit('.', 1)[1].lower()
            filename = f"{uuid.uuid4()}.{ext}"
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            photo.save(filepath)
            photo_urls.append(f"/uploads/issue_photos/{filename}")
    
    if not photo_urls:
        return jsonify({'message': 'Не удалось загрузить фотографии. Проверьте формат файлов.'}), 400
    
    issue.status = 'pending_verification'
    issue.resolved_by_id = request.current_user['id']
    issue.resolved_at = datetime.now(timezone.utc)
    issue.resolution_comment = request.form.get('comment', '')
    issue.resolution_photos = photo_urls
    
    recalculate_project_risk(issue.project_id, triggering_user_id=request.current_user['id'])
    
    return jsonify({
        'message': 'Нарушение отмечено как устраненное и ожидает верификации',
        'status': 'pending_verification'
    }), 200


@issue_bp.route('/api/issues/<int:issue_id>/verify', methods=['POST'])
@token_required
def verify_resolution(issue_id):
    """
    Верификация устранения нарушения.
    - Inspector может верифицировать violations
    - Client может верифицировать remarks
    """
    user_role = request.current_user.get('role')
    issue = db.session.get(Issue, issue_id)
    
    if not issue:
        return jsonify({'message': 'Нарушение не найдено'}), 404
    
    if user_role == 'inspector' and issue.type != 'violation':
        return jsonify({'message': 'Инспектор может верифицировать только нарушения (violation)'}), 403
    
    if user_role == 'client' and issue.type != 'remark':
        return jsonify({'message': 'Служба контроля может верифицировать только замечания (remark)'}), 403
    
    if user_role == 'foreman':
        return jsonify({'message': 'Прораб не может верифицировать нарушения'}), 403
    
    if issue.status != 'pending_verification':
        return jsonify({'message': 'Нарушение не ожидает верификации'}), 400
    
    data = request.get_json()
    verification_status = data.get('status')
    
    if verification_status not in ['verified', 'rejected']:
        return jsonify({'message': 'Некорректный статус верификации. Используйте verified или rejected'}), 400
    
    issue.verification_status = verification_status
    issue.verified_by_id = request.current_user['id']
    issue.verified_at = datetime.now(timezone.utc)
    issue.verification_comment = data.get('comment', '')
    
    if verification_status == 'verified':
        issue.status = 'resolved'
    else:
        issue.status = 'open'
    
    db.session.commit()
    
    recalculate_project_risk(issue.project_id, triggering_user_id=request.current_user['id'])
    
    project = db.session.get(Project, issue.project_id)
    if issue.resolved_by_id:
        status_text = 'принято' if verification_status == 'verified' else 'отклонено'
        create_notification(
            user_id=issue.resolved_by_id,
            message=f"Устранение замечания по проекту '{project.name}' {status_text}",
            link=f"/projects/{issue.project_id}"
        )
    
    message_text = 'подтверждено' if verification_status == 'verified' else 'отклонено'
    return jsonify({
        'message': f'Устранение нарушения {message_text}',
        'status': issue.status
    }), 200


@issue_bp.route('/api/issues/<int:issue_id>', methods=['GET'])
@token_required
def get_issue_details(issue_id):
    """
    Возвращает детальную информацию о нарушении включая фото устранения.
    """
    issue = db.session.get(Issue, issue_id)
    
    if not issue:
        return jsonify({'message': 'Нарушение не найдено'}), 404
    
    issue_dict = issue.to_dict()
    issue_dict['resolution_photos'] = issue.resolution_photos
    issue_dict['verified_by_id'] = issue.verified_by_id
    issue_dict['verified_at'] = issue.verified_at.isoformat() if issue.verified_at else None
    issue_dict['verification_status'] = issue.verification_status
    issue_dict['verification_comment'] = issue.verification_comment
    issue_dict['geolocation'] = issue.geolocation
    
    if issue.author:
        author_name = f"{issue.author.first_name} {issue.author.last_name}".strip()
        if not author_name:
            author_name = issue.author.email
        issue_dict['created_by_username'] = author_name
        issue_dict['created_by_role'] = issue.author.role
    
    if issue.classifier:
        issue_dict['classifier_name'] = issue.classifier.title
    
    return jsonify(issue_dict), 200

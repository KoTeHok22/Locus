
from flask import Blueprint, request, jsonify
from models import db, Issue
from auth import token_required

issue_bp = Blueprint('issue_bp', __name__)

@issue_bp.route('/api/issues', methods=['GET'])
@token_required
def get_issues():
    """
    Возвращает список нарушений с возможностью фильтрации.
    Поддерживает фильтр: `status`.
    """
    query = Issue.query

    status = request.args.get('status')
    if status:
        query = query.filter(Issue.status == status)

    issues = query.order_by(Issue.due_date).all()
    
    # NOTE: Здесь также нужно обогащать данные (имя проекта, имя автора)
    issues_list = [{
        'id': issue.id,
        'project_id': issue.project_id,
        'description': issue.description,
        'status': issue.status,
        'due_date': issue.due_date.isoformat() if issue.due_date else None,
        # 'project_name': issue.project.name, // Пример обогащения
    } for issue in issues]

    return jsonify(issues_list), 200

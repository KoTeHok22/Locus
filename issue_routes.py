from flask import Blueprint, request, jsonify
from models import db, Issue, Project
from auth import token_required

issue_bp = Blueprint('issue_bp', __name__)

@issue_bp.route('/api/issues', methods=['GET'])
@token_required
def get_issues():
    """
    Возвращает список нарушений с возможностью фильтрации.
    Поддерживает фильтры: `status`, `project_id`.
    """
    query = db.session.query(Issue, Project).join(Project, Issue.project_id == Project.id)

    status = request.args.get('status')
    if status:
        query = query.filter(Issue.status == status)
    
    project_id = request.args.get('project_id')
    if project_id:
        query = query.filter(Issue.project_id == project_id)

    results = query.order_by(Issue.due_date).all()
    
    issues_list = []
    for issue, project in results:
        issue_dict = issue.to_dict()
        issue_dict['project_name'] = project.name
        issues_list.append(issue_dict)

    return jsonify(issues_list), 200
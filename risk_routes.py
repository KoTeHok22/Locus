from flask import Blueprint, jsonify
from auth import token_required
from models import db, Project, RiskEvent
from risk_calculator import recalculate_project_risk

risk_bp = Blueprint('risk_bp', __name__)

@risk_bp.route('/api/projects/<int:project_id>/risk', methods=['GET'])
@token_required
def get_project_risk(project_id):
    """Возвращает текущий риск проекта с детализацией факторов."""
    project = db.session.get(Project, project_id)
    
    if not project:
        return jsonify({'message': 'Проект не найден'}), 404
    
    return jsonify({
        'project_id': project.id,
        'project_name': project.name,
        'risk_score': project.risk_score,
        'risk_level': project.risk_level,
        'risk_breakdown': project.risk_breakdown or []
    }), 200

@risk_bp.route('/api/projects/<int:project_id>/risk/recalculate', methods=['POST'])
@token_required
def recalculate_risk(project_id):
    """Принудительно пересчитывает риск проекта."""
    project = db.session.get(Project, project_id)
    
    if not project:
        return jsonify({'message': 'Проект не найден'}), 404
    
    try:
        result = recalculate_project_risk(project_id)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'message': 'Ошибка пересчёта риска', 'error': str(e)}), 500

@risk_bp.route('/api/projects/high-risk', methods=['GET'])
@token_required
def get_high_risk_projects():
    """Возвращает список проектов с высоким или критическим уровнем риска."""
    high_risk_projects = Project.query.filter(
        Project.risk_level.in_(['HIGH', 'CRITICAL'])
    ).all()
    
    return jsonify([{
        'id': p.id,
        'name': p.name,
        'risk_score': p.risk_score,
        'risk_level': p.risk_level,
        'risk_factors': p.risk_factors or {}
    } for p in high_risk_projects]), 200


@risk_bp.route('/api/projects/<int:project_id>/risk/history', methods=['GET'])
@token_required
def get_risk_history(project_id):
    """Возвращает историю событий, повлиявших на риск проекта."""
    project = db.session.get(Project, project_id)
    if not project:
        return jsonify({'message': 'Проект не найден'}), 404

    history = RiskEvent.query.filter_by(project_id=project_id).order_by(RiskEvent.timestamp.desc()).all()
    
    result = []
    for event in history:
        event_dict = event.to_dict()
        initiator_name = "Система"
        if event.triggering_user:
            if event.triggering_user.first_name and event.triggering_user.last_name:
                initiator_name = f"{event.triggering_user.first_name} {event.triggering_user.last_name}"
            else:
                initiator_name = event.triggering_user.email
        elif event.triggering_user_id:
            initiator_name = f"Пользователь {event.triggering_user_id}"

        event_dict['initiator_name'] = initiator_name
        result.append(event_dict)
    
    return jsonify(result), 200

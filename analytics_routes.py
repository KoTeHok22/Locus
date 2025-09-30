from flask import Blueprint, jsonify
from models import db, Project, Task, Issue, Document
from auth import token_required
from datetime import date

analytics_bp = Blueprint('analytics_bp', __name__)

def calculate_project_risk(project_id):
    """Выполняет расчет рисков для указанного проекта."""
    score = 0
    factors = []
    recommendations = []

    # 1. Фактор: Срыв сроков (schedule_delay)
    today = date.today()
    overdue_tasks = Task.query.filter(
        Task.project_id == project_id,
        Task.end_date < today,
        Task.status.notin_(['verified', 'completed'])
    ).all()
    if overdue_tasks:
        impact = len(overdue_tasks) * 15
        score += impact
        task_ids = ", ".join([f"#{t.id}" for t in overdue_tasks])
        factors.append({
            "description": f"Просрочено задач: {len(overdue_tasks)} (влияние: +{impact} очков)",
            "type": "schedule_delay",
            "task_ids": [t.id for t in overdue_tasks]
        })
        recommendations.append(f"Срочно проверить задачи {task_ids}.")

    # 2. Фактор: Критические нарушения (critical_issues)
    critical_issues = Issue.query.filter(
        Issue.project_id == project_id,
        Issue.type == 'violation',
        Issue.status.notin_(['approved'])
    ).all()
    if critical_issues:
        impact = len(critical_issues) * 20
        score += impact
        issue_ids = ", ".join([f"#{i.id}" for i in critical_issues])
        factors.append({
            "description": f"Открытых нарушений с высоким приоритетом: {len(critical_issues)} (влияние: +{impact} очков)",
            "type": "critical_issues",
            "issue_ids": [i.id for i in critical_issues]
        })
        recommendations.append(f"Связаться с инспектором по нарушениям {issue_ids}.")

    # 3. Фактор: Несоответствие поставок (supply_mismatch)
    supply_mismatches = Document.query.filter(
        Document.project_id == project_id,
        Document.file_type == 'ttn',
        Document.validation_status['status'].as_string().in_(['validation_error', 'ok_with_warnings'])
    ).all()
    if supply_mismatches:
        impact = len(supply_mismatches) * 15
        score += impact
        doc_ids = ", ".join([f"(документ #{d.id})" for d in supply_mismatches])
        factors.append({
            "description": f"Поставка материалов не соответствует плану: {len(supply_mismatches)} (влияние: +{impact} очков)",
            "type": "supply_mismatch",
            "document_ids": [d.id for d in supply_mismatches]
        })
        recommendations.append(f"Проверить некорректные ТТН {doc_ids}.")

    # Определение уровня риска
    if score > 60:
        risk_level = "high"
    elif score > 30:
        risk_level = "medium"
    else:
        risk_level = "low"

    return {
        "risk_level": risk_level,
        "score": score,
        "factors": factors,
        "recommendation": " ".join(recommendations) if recommendations else "Риски не выявлены."
    }

@analytics_bp.route('/api/projects/<int:project_id>/risk_assessment', methods=['GET'])
@token_required
def get_risk_assessment(project_id):
    """
    Проводит оценку рисков для проекта в реальном времени.
    """
    db.get_or_404(Project, project_id)
    risk_data = calculate_project_risk(project_id)
    return jsonify(risk_data), 200
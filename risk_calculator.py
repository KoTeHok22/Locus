
from datetime import date, timedelta
from sqlalchemy import func
from models import db, Project, Task, Issue, DailyReport, MaterialDelivery, ChecklistCompletion, WorkPlan, RiskEvent, User

# --- CONFIGURATION ---

RISK_WEIGHTS = {
    'schedule_deviation': 200,
    'open_violations': 200,
    'reporting_discipline': 150,
    'task_completion_lag': 150,
    'material_supply': 100,
    'weather_conditions': 100,
    'checklist_approval': 50,
    'personnel_fluctuation': 50,
}

RISK_LEVELS = [
    (0, 100, 'LOW'),
    (101, 300, 'MEDIUM'),
    (301, 600, 'HIGH'),
    (601, 1000, 'CRITICAL'),
]

# --- HELPERS ---

def get_risk_level(score):
    """Determines the risk level string based on a numeric score."""
    for min_score, max_score, level in RISK_LEVELS:
        if min_score <= score <= max_score:
            return level
    return 'CRITICAL' if score > 1000 else 'LOW'

def create_risk_factor(name, score, details):
    """Factory function for creating a risk factor dictionary."""
    return {
        "name": name,
        "score": int(score),
        "max_score": RISK_WEIGHTS.get(name.lower().replace(' ', '_'), 0),
        "details": details
    }

# --- RISK FACTOR CALCULATORS ---

def calculate_schedule_deviation(project_id):
    work_plan = WorkPlan.query.filter_by(project_id=project_id).first()
    if not work_plan or not work_plan.items:
        return 0, "No work plan items found."

    today = date.today()
    overdue_items = [item for item in work_plan.items if item.end_date < today and item.status != 'completed']
    
    if not overdue_items:
        return 0, "No overdue work items."

    percentage_overdue = len(overdue_items) / len(work_plan.items)
    score = percentage_overdue * RISK_WEIGHTS['schedule_deviation']
    description = f"{len(overdue_items)} of {len(work_plan.items)} work items are overdue."
    return score, description

def calculate_open_violations(project_id):
    today = date.today()
    open_issues = Issue.query.filter(
        Issue.project_id == project_id,
        Issue.status.in_(['open', 'pending_verification'])
    ).all()

    if not open_issues:
        return 0, "No open violations or remarks."

    violation_count = sum(1 for i in open_issues if i.type == 'violation')
    overdue_count = sum(1 for i in open_issues if i.due_date and i.due_date < today)
    violation_ratio = violation_count / len(open_issues)
    overdue_ratio = overdue_count / len(open_issues)
    score = (violation_ratio * 0.6 + overdue_ratio * 0.4) * RISK_WEIGHTS['open_violations']
    description = f"{violation_count} open violations and {overdue_count} overdue issues."
    return score, description

# ... (other calculator functions would be similarly updated to return score and a string description)

def get_risk_calculators():
    """Returns a map of risk factor names to their calculation functions."""
    return {
        'Schedule Deviation': lambda p: calculate_schedule_deviation(p.id),
        'Open Violations': lambda p: calculate_open_violations(p.id),
        # Stubs for other calculators
        'Reporting Discipline': lambda p: (0, "Отчетность в актуальном состоянии."),
        'Task Completion Lag': lambda p: (0, "Значительных задержек в верификации задач нет."),
        'Material Supply': lambda p: (0, "Снабжение материалами стабильно."),
        'Weather Conditions': lambda p: (10, "Погодные условия (демо-риск)."),
        'Checklist Approval': lambda p: (0, "Проблем с утверждением чек-листов нет."),
        'Personnel Fluctuation': lambda p: (0, "Численность персонала стабильна."),
    }

# --- MAIN CALCULATOR ---

def recalculate_project_risk(project_id, triggering_user_id=None):
    project = db.session.get(Project, project_id)
    if not project:
        return None

    old_breakdown = {factor['name']: factor for factor in (project.risk_breakdown or [])}
    calculators = get_risk_calculators()
    new_breakdown_list = []
    new_total_score = 0

    for name, calculator in calculators.items():
        new_score, description = calculator(project)
        new_score = int(new_score)
        if new_score == 0 and name not in old_breakdown:
            continue

        old_factor = old_breakdown.get(name, {'score': 0})
        score_change = new_score - old_factor['score']

        if score_change != 0:
            event = RiskEvent(
                project_id=project_id,
                score_change=score_change,
                new_score=0, # Will be updated later
                event_type=name.upper().replace(' ', '_'),
                description=description,
                triggering_user_id=triggering_user_id
            )
            db.session.add(event)
        
        if new_score > 0:
            new_breakdown_list.append(create_risk_factor(name, new_score, {"description": description}))
        
        new_total_score += new_score

    # Update total score for new events
    for event in db.session.new:
        if isinstance(event, RiskEvent) and event.project_id == project_id:
            event.new_score = new_total_score

    project.risk_score = new_total_score
    project.risk_level = get_risk_level(new_total_score)
    project.risk_breakdown = new_breakdown_list
    
    db.session.commit()

    return {
        'project_id': project.id,
        'risk_score': project.risk_score,
        'risk_level': project.risk_level,
        'risk_breakdown': project.risk_breakdown
    }

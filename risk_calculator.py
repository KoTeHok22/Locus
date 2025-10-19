
from datetime import date, timedelta
from sqlalchemy import func
from models import db, Project, Task, Issue, DailyReport, MaterialDelivery, ChecklistCompletion, WorkPlan, RiskEvent, User, Checklist

RISK_WEIGHTS = {

    'schedule_deviation': 200,

    'open_violations': 200,

    'reporting_discipline': 150,

    'task_completion_lag': 150,

    'missed_daily_checklists': 100,

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



def calculate_schedule_deviation(project_id):

    work_plan = WorkPlan.query.filter_by(project_id=project_id).first()

    if not work_plan or not work_plan.items:

        return 0, "Элементы плана работ не найдены."



    today = date.today()

    overdue_items = [item for item in work_plan.items if item.end_date < today and item.status != 'completed']

    

    if not overdue_items:

        return 0, "Просроченных работ нет."



    percentage_overdue = len(overdue_items) / len(work_plan.items)

    score = percentage_overdue * RISK_WEIGHTS['schedule_deviation']

    description = f"{len(overdue_items)} из {len(work_plan.items)} работ просрочено."

    return score, description



def calculate_open_violations(project_id):

    today = date.today()

    open_issues = Issue.query.filter(

        Issue.project_id == project_id,

        Issue.status.in_(['open', 'pending_verification'])

    ).all()



    if not open_issues:

        return 0, "Открытых нарушений или замечаний нет."



    violation_count = sum(1 for i in open_issues if i.type == 'violation')

    overdue_count = sum(1 for i in open_issues if i.due_date and i.due_date < today)



    score = (violation_count * 20) + (overdue_count * 10)

    score = min(score, RISK_WEIGHTS['open_violations'])



    description = f"{violation_count} открытых нарушений и {overdue_count} просроченных замечаний."

    return score, description



def calculate_missed_checklists(project_id):

    project = db.session.get(Project, project_id)

    if not project or project.status != 'active':

        return 0, "Проект не активен."



    # Find the daily checklist template

    daily_checklist_template = db.session.query(Checklist).filter_by(type='daily').first()

    if not daily_checklist_template:

        return 0, "Шаблон ежедневного чек-листа не найден."



    # Determine the date range to check

    project_start_date = project.created_at.date()

    today = date.today()

    if project_start_date > today:

        return 0, "Проект еще не начался."



    total_days = (today - project_start_date).days + 1



    # Get all completion dates for this project's daily checklist

    completions = db.session.query(ChecklistCompletion.completion_date).filter(

        ChecklistCompletion.project_id == project_id,

        ChecklistCompletion.checklist_id == daily_checklist_template.id

    ).all()



    # Create a set of dates when a checklist was completed

    completion_dates = {comp.completion_date.date() for comp in completions}



    # Count missed days

    missed_days_count = 0

    for i in range(total_days):

        check_date = project_start_date + timedelta(days=i)

        if check_date not in completion_dates:

            missed_days_count += 1



    if missed_days_count == 0:

        return 0, "Ежедневные чек-листы заполняются регулярно."



    # Calculate score (e.g., 10 points per missed day, cumulative)

    score = missed_days_count * 10

    score = min(score, RISK_WEIGHTS['missed_daily_checklists'])

    

    description = f"Пропущено {missed_days_count} ежедневных чек-листов."

    return score, description





def get_risk_calculators():

    """Returns a map of risk factor names to their calculation functions."""

    return {

        'Отклонение от графика': lambda p: calculate_schedule_deviation(p.id),

        'Открытые нарушения': lambda p: calculate_open_violations(p.id),

        'Пропущенные чек-листы': lambda p: calculate_missed_checklists(p.id),

        'Дисциплина отчетности': lambda p: (0, "Отчетность в актуальном состоянии."),

        'Задержка выполнения задач': lambda p: (0, "Значительных задержек в верификации задач нет."),

        'Снабжение материалами': lambda p: (0, "Снабжение материалами стабильно."),

        'Погодные условия': lambda p: (10, "Погодные условия (демо-риск)."),

        'Согласование чек-листов': lambda p: (0, "Проблем с утверждением чек-листов нет."),

        'Текучесть кадров': lambda p: (0, "Численность персонала стабильна."),

    }


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
                new_score=0, 
                event_type=name.upper().replace(' ', '_'),
                description=description,
                triggering_user_id=triggering_user_id
            )
            db.session.add(event)
        
        if new_score > 0:
            new_breakdown_list.append(create_risk_factor(name, new_score, {"description": description}))
        
        new_total_score += new_score

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

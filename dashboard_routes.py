
from flask import Blueprint, request, jsonify
from models import Project, DailyReport, User, Task, Issue, db
from auth import token_required
from datetime import datetime, timedelta
from sqlalchemy import func
import uuid

dashboard_bp = Blueprint('dashboard', __name__)


@dashboard_bp.route('/api/dashboard/summary', methods=['GET'])
@token_required
def get_dashboard_summary():
    """
    Возвращает сводную информацию для панели управления пользователя.

    В зависимости от роли пользователя (прораб, инспектор или другая),
    собирает и возвращает общую статистику по проектам, активным проектам,
    проектам с просроченными задачами, общему количеству открытых вопросов
    и количеству открытых нарушений (незавершенных лабораторных проб).
    """
    try:
        user_id = request.current_user['id']
        user_role = request.current_user['role']
        
        project_query = Project.query
        if user_role in ['foreman', 'inspector']:
            project_query = project_query.filter_by(created_by=user_id)
        
        projects_total = project_query.distinct(Project.id).count()
        
        active_projects_count = project_query.filter(
            Project.status.notin_(['completed', 'cancelled'])
        ).distinct(Project.id).count()
        
        overdue_projects_count = 0
        
        base_report_query = DailyReport.query
        if user_role in ['foreman', 'inspector']:
            base_report_query = base_report_query.filter_by(author_id=user_id)
        
        open_issues_total = base_report_query.count()
        
        
        open_violations = 0
        
        return jsonify({
            'projects_total': projects_total,
            'projects_active': active_projects_count,
            'projects_with_overdue_tasks': overdue_projects_count,
            'open_issues_total': open_issues_total,
            'open_violations': open_violations
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Ошибка получения сводной информации', 'error': str(e)}), 500


@dashboard_bp.route('/api/projects/<project_id>/summary', methods=['GET'])
@token_required
def get_project_summary(project_id):
    """
    Возвращает аналитическую информацию по конкретному проекту.

    Принимает идентификатор проекта и возвращает данные, включая
    процент выполнения проекта (на основе статуса лабораторных проб),
    общее количество задач, количество выполненных и проверенных задач,
    количество просроченных задач (в данной реализации - заглушка),
    количество открытых вопросов (ежедневных отчетов),
    оставшееся время до дедлайна (в данной реализации - заглушка)
    и количество материалов, ожидающих лабораторного анализа.
    """
    try:
        user_id = request.current_user['id']
        user_role = request.current_user['role']
        
        base_report_query = DailyReport.query.filter_by(project_id=project_id)
        if user_role in ['foreman', 'inspector']:
            base_report_query = base_report_query.filter_by(author_id=user_id)
        
        daily_reports = base_report_query.all()
        open_issues_count = len(daily_reports)
        
        
        
        total_requests = 0
        completed_requests = 0
        progress_percentage = 0

        overdue_tasks = 0
        
        days_left = 30
        
        materials_pending_lab_test = 0
        
        return jsonify({
            'progress_percentage': progress_percentage,
            'tasks_total': total_requests,
            'tasks_completed': completed_requests,
            'tasks_verified': completed_requests,
            'tasks_overdue': overdue_tasks,
            'open_issues_count': open_issues_count,
            'days_left': days_left,
            'materials_pending_lab_test': materials_pending_lab_test
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Ошибка получения аналитики проекта', 'error': str(e)}), 500

@dashboard_bp.route('/api/dashboard/performance_rating', methods=['GET'])
@token_required
def get_performance_rating():
    """Возвращает рейтинг производительности прорабов."""
    foremen = User.query.filter_by(role='foreman').all()
    ratings = []

    for foreman in foremen:
        completed_tasks = Task.query.filter_by(completed_by=foreman.id).all()
        total_completed = len(completed_tasks)
        on_time_tasks = [t for t in completed_tasks if t.completed_at and t.completed_at.date() <= t.end_date]
        on_time_percentage = (len(on_time_tasks) / total_completed * 100) if total_completed > 0 else 100

        resolved_issues = Issue.query.filter_by(resolved_by_id=foreman.id).all()
        total_resolution_time = sum([(i.resolved_at - i.created_at).total_seconds() for i in resolved_issues if i.resolved_at])
        avg_resolution_days = (total_resolution_time / len(resolved_issues) / 86400) if resolved_issues else 0

        if total_completed > 0:
            task_ids = [t.id for t in completed_tasks]
            issues_on_tasks = Issue.query.filter(Issue.task_id.in_(task_ids)).count()
            issues_per_10_tasks = (issues_on_tasks / total_completed) * 10
        else:
            issues_per_10_tasks = 0

        score = (on_time_percentage * 0.5) + ((1 / (1 + avg_resolution_days)) * 30) + ((1 / (1 + issues_per_10_tasks)) * 20)

        ratings.append({
            'foreman_id': foreman.id,
            'full_name': foreman.full_name,
            'score': round(score, 2),
            'metrics': {
                'tasks_completed_on_time_percent': round(on_time_percentage, 2),
                'avg_issue_resolution_days': round(avg_resolution_days, 2),
                'issues_per_10_tasks': round(issues_per_10_tasks, 2)
            }
        })

    sorted_ratings = sorted(ratings, key=lambda x: x['score'], reverse=True)
    
    return jsonify(sorted_ratings), 200

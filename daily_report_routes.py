from flask import Blueprint, request, jsonify
from models import db, DailyReport, User, Project
from auth import token_required, role_required
from datetime import datetime, timedelta
from risk_calculator import recalculate_project_risk

daily_report_bp_v2 = Blueprint('daily_report_bp_v2', __name__)

@daily_report_bp_v2.route('/api/daily-reports', methods=['GET'])
@token_required
def get_daily_reports():
    """Возвращает список ежедневных отчетов с обогащенными данными."""
    query = db.session.query(DailyReport, User.first_name, User.last_name, Project.name).join(User, DailyReport.author_id == User.id).join(Project, DailyReport.project_id == Project.id)
    
    
    results = query.order_by(DailyReport.report_date.desc()).all()

    reports_list = []
    for report, author_first_name, author_last_name, project_name in results:
        reports_list.append({
            'id': report.id,
            'project_id': report.project_id,
            'report_date': report.report_date.isoformat(),
            'notes': report.notes,
            'equipment': report.equipment,
            'weather_conditions': report.weather_conditions,
            'workers_count': report.workers_count,
            'geolocation': report.geolocation,
            'project_name': project_name,
            'author_name': f'{author_first_name} {author_last_name}'.strip()
        })

    return jsonify(reports_list), 200

@daily_report_bp_v2.route('/api/daily-reports', methods=['POST'])
@token_required
@role_required('foreman')
def create_daily_report():
    """Создает новый ежедневный отчет. Доступно только для прораба."""
    data = request.get_json()
    required_fields = ['project_id', 'workers_count', 'weather_conditions']
    if not all(field in data for field in required_fields):
        return jsonify({'message': 'Требуются поля project_id, workers_count, weather_conditions'}), 400

    project_id = data['project_id']
    author_id = request.current_user['id']

    last_report = DailyReport.query.filter_by(
        project_id=project_id,
        author_id=author_id
    ).order_by(DailyReport.report_date.desc()).first()

    if last_report:
        time_since_last = datetime.utcnow() - last_report.report_date
        if time_since_last < timedelta(hours=12):
            hours_left = 12 - (time_since_last.total_seconds() / 3600)
            return jsonify({
                'message': f'Можно создать отчёт только через {int(hours_left)} часов',
                'next_available_at': (last_report.report_date + timedelta(hours=12)).isoformat()
            }), 429

    try:
        new_report = DailyReport(
            project_id=project_id,
            author_id=author_id,
            report_date=datetime.utcnow(),
            workers_count=data.get('workers_count'),
            equipment=data.get('equipment'),
            weather_conditions=data.get('weather_conditions'),
            notes=data.get('notes', ''),
            geolocation=data.get('geolocation')
        )
        db.session.add(new_report)
        db.session.commit()
        
        recalculate_project_risk(project_id, triggering_user_id=request.current_user['id'])
        
        return jsonify({
            'message': 'Ежедневный отчет успешно создан', 
            'id': new_report.id,
            'report_date': new_report.report_date.isoformat()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Ошибка создания отчета', 'error': str(e)}), 500

@daily_report_bp_v2.route('/api/daily-reports/<int:report_id>', methods=['GET'])
@token_required
def get_daily_report(report_id):
    """
    Возвращает детальную информацию о ежедневном отчете.

    Проверяет права доступа: инспекторы и прорабы могут видеть
    только свои отчеты.
    """
    try:
        report = db.session.get(DailyReport, report_id)
        
        if not report:
            return jsonify({'message': 'Ежедневный отчет не найден'}), 404
        
        user_role = request.current_user['role']
        user_id = request.current_user['id']

        if user_role == 'inspector':
            return jsonify({'message': 'Недостаточно прав для просмотра этого отчета'}), 403
        if user_role == 'foreman' and report.author_id != user_id:
            return jsonify({'message': 'Вы можете просматривать только свои отчеты'}), 403
        
        return jsonify({
            'id': report.id,
            'report_date': report.report_date.isoformat(),
            'notes': report.notes
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Ошибка получения ежедневного отчета', 'error': str(e)}), 500

@daily_report_bp_v2.route('/api/daily-reports/<int:report_id>', methods=['PUT'])
@token_required
def update_daily_report(report_id):
    """
    Обновляет существующий ежедневный отчет.

    Проверяет права доступа: инспекторы и прорабы могут обновлять
    только свои отчеты.
    """
    try:
        report = db.session.get(DailyReport, report_id)
        
        if not report:
            return jsonify({'message': 'Ежедневный отчет не найден'}), 404
        
        user_id = request.current_user['id']
        
        if report.author_id != user_id:
            return jsonify({'message': 'Вы можете обновлять только свои отчеты'}), 403
        
        data = request.get_json()
        
        updatable_fields = ['workers_count', 'equipment', 'weather_conditions', 'notes']
        for field in updatable_fields:
            if field in data:
                setattr(report, field, data[field])
        
        db.session.commit()
        
        return jsonify({'message': 'Ежедневный отчет успешно обновлен'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Ошибка обновления ежедневного отчета', 'error': str(e)}), 500

@daily_report_bp_v2.route('/api/daily-reports/<int:report_id>', methods=['DELETE'])
@token_required
def delete_daily_report(report_id):
    """
    Удаляет ежедневный отчет.

    Проверяет права доступа: инспекторы и прорабы могут удалять
    только свои отчеты.
    """
    try:
        report = db.session.get(DailyReport, report_id)
        
        if not report:
            return jsonify({'message': 'Ежедневный отчет не найден'}), 404
        
        user_id = request.current_user['id']
        
        if report.author_id != user_id:
            return jsonify({'message': 'Вы можете удалять только свои отчеты'}), 403
        
        db.session.delete(report)
        db.session.commit()
        
        return jsonify({'message': 'Ежедневный отчет успешно удален'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Ошибка удаления ежедневного отчета', 'error': str(e)}), 500
from flask import Blueprint, request, jsonify
from models import db, DailyReport, User, Project
from auth import token_required

daily_report_bp_v2 = Blueprint('daily_report_bp_v2', __name__)

@daily_report_bp_v2.route('/api/daily-reports', methods=['GET'])
@token_required
def get_daily_reports():
    """Возвращает список ежедневных отчетов с обогащенными данными."""
    query = db.session.query(DailyReport, User.first_name, User.last_name, Project.name).join(User, DailyReport.author_id == User.id).join(Project, DailyReport.project_id == Project.id)
    
    # NOTE: Здесь можно добавить фильтрацию по дате, проекту и т.д.
    
    results = query.order_by(DailyReport.report_date.desc()).all()

    reports_list = []
    for report, author_first_name, author_last_name, project_name in results:
        reports_list.append({
            'id': report.id,
            'report_date': report.report_date.isoformat(),
            'notes': report.notes,
            'weather_conditions': report.weather_conditions,
            'workers_count': report.workers_count,
            'project_name': project_name,
            'author_name': f'{author_first_name} {author_last_name}'.strip()
        })

    return jsonify(reports_list), 200

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
        
        if user_role in ['foreman', 'inspector'] and report.author_id != user_id:
            return jsonify({'message': 'Недостаточно прав для просмотра этого отчета'}), 403
        
        # Нужно будет обновить to_dict в модели или формировать словарь здесь
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
        
        user_role = request.current_user['role']
        user_id = request.current_user['id']
        
        if user_role in ['foreman', 'inspector'] and report.author_id != user_id:
            return jsonify({'message': 'Недостаточно прав для обновления этого отчета'}), 403
        
        data = request.get_json()
        
        updatable_fields = ['workers_count', 'equipment', 'weather_conditions', 'notes']
        for field in updatable_fields:
            if field in data:
                setattr(report, field, data[field])
        
        # report.updated_at = datetime.now(timezone.utc) # Поле updated_at нужно добавить в модель
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
        
        user_role = request.current_user['role']
        user_id = request.current_user['id']
        
        if user_role in ['foreman', 'inspector'] and report.author_id != user_id:
            return jsonify({'message': 'Недостаточно прав для удаления этого отчета'}), 403
        
        db.session.delete(report)
        db.session.commit()
        
        return jsonify({'message': 'Ежедневный отчет успешно удален'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Ошибка удаления ежедневного отчета', 'error': str(e)}), 500
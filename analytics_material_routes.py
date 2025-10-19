from flask import Blueprint, request, jsonify
from datetime import datetime, date

from models import (db, WorkPlan, WorkPlanItem, RequiredMaterial, Material, 
                   MaterialDelivery, MaterialDeliveryItem, ConsumptionLog, Project)
from auth import token_required
from project_access import require_project_access

analytics_material_bp = Blueprint('analytics_material_bp', __name__)


@analytics_material_bp.route('/api/projects/<int:project_id>/gantt-chart', methods=['GET'])
@token_required
def get_gantt_chart_data(project_id):
    """
    Получает данные для построения диаграммы Ганта.
    Возвращает список работ с датами, прогрессом и рисками.
    """
    current_user = request.current_user
    
    access_error = require_project_access(project_id, current_user['id'], current_user['role'])
    if access_error:
        return access_error
    
    work_plan = WorkPlan.query.filter_by(project_id=project_id).first()
    if not work_plan:
        return jsonify({'message': 'План работ для этого проекта не найден'}), 404
    
    tasks = []
    today = date.today()
    
    for item in work_plan.items:
        risk_level = calculate_work_item_risk(item, project_id)
        
        is_delayed = False
        if item.end_date < today and item.progress < 100:
            is_delayed = True
        
        tasks.append({
            'id': item.id,
            'name': item.name,
            'start_date': item.start_date.isoformat(),
            'end_date': item.end_date.isoformat(),
            'progress': item.progress,
            'status': item.status,
            'risk_level': risk_level,
            'is_delayed': is_delayed,
            'order': item.order
        })
    
    return jsonify({
        'project_id': project_id,
        'work_plan_id': work_plan.id,
        'plan_start_date': work_plan.start_date.isoformat(),
        'plan_end_date': work_plan.end_date.isoformat(),
        'tasks': tasks
    }), 200


@analytics_material_bp.route('/api/projects/<int:project_id>/material-plan-fact', methods=['GET'])
@token_required
def get_material_plan_fact_report(project_id):
    """
    Отчет План/Факт по материалам для проекта.
    Для каждого материала показывает: запланировано, поставлено, израсходовано, остаток, прогноз.
    """
    current_user = request.current_user
    
    access_error = require_project_access(project_id, current_user['id'], current_user['role'])
    if access_error:
        return access_error
    
    from sqlalchemy import func
    from collections import defaultdict
    
    work_plan = WorkPlan.query.filter_by(project_id=project_id).first()
    if not work_plan:
        return jsonify({'message': 'План работ для этого проекта не найден'}), 404
    
    planned_dict = defaultdict(float)
    work_item_ids = [item.id for item in work_plan.items]
    
    if work_item_ids:
        planned = db.session.query(
            RequiredMaterial.material_id,
            func.sum(RequiredMaterial.planned_quantity).label('total_planned')
        ).filter(
            RequiredMaterial.work_item_id.in_(work_item_ids)
        ).group_by(RequiredMaterial.material_id).all()
        
        for item in planned:
            planned_dict[item.material_id] = float(item.total_planned)
    
    delivered_dict = defaultdict(float)
    delivered = db.session.query(
        MaterialDeliveryItem.material_id,
        func.sum(MaterialDeliveryItem.quantity).label('total_delivered')
    ).join(MaterialDelivery).filter(
        MaterialDelivery.project_id == project_id
    ).group_by(MaterialDeliveryItem.material_id).all()
    
    for item in delivered:
        delivered_dict[item.material_id] = float(item.total_delivered)
    
    consumed_dict = defaultdict(float)
    if work_item_ids:
        consumed = db.session.query(
            ConsumptionLog.material_id,
            func.sum(ConsumptionLog.quantity_used).label('total_consumed')
        ).filter(
            ConsumptionLog.work_item_id.in_(work_item_ids)
        ).group_by(ConsumptionLog.material_id).all()
        
        for item in consumed:
            consumed_dict[item.material_id] = float(item.total_consumed)
    
    all_material_ids = set(planned_dict.keys()) | set(delivered_dict.keys()) | set(consumed_dict.keys())
    
    if not all_material_ids:
        return jsonify({
            'project_id': project_id,
            'materials': []
        }), 200
    
    materials = Material.query.filter(Material.id.in_(all_material_ids)).all()
    
    report = []
    for material in materials:
        total_planned = planned_dict.get(material.id, 0.0)
        total_delivered = delivered_dict.get(material.id, 0.0)
        total_consumed = consumed_dict.get(material.id, 0.0)
        remaining = total_delivered - total_consumed
        forecast_variance = total_delivered - total_planned
        
        status = 'ok'
        if total_planned > 0:
            if total_delivered < total_planned * 0.8:
                status = 'shortage_risk'
            elif remaining < total_planned * 0.2 and total_consumed > 0:
                status = 'running_low'
        
        if total_consumed > total_planned and total_planned > 0:
            status = 'overrun'
        
        report.append({
            'material_id': material.id,
            'material_name': material.name,
            'unit': material.unit,
            'planned': total_planned,
            'delivered': total_delivered,
            'consumed': total_consumed,
            'remaining': remaining,
            'forecast_variance': forecast_variance,
            'status': status
        })
    
    report.sort(key=lambda x: x['material_name'])
    
    return jsonify({
        'project_id': project_id,
        'materials': report
    }), 200


@analytics_material_bp.route('/api/projects/<int:project_id>/risk-analysis', methods=['GET'])
@token_required
def get_project_risk_analysis(project_id):
    """
    Комплексный анализ рисков проекта.
    Возвращает риски по материалам и по срокам выполнения работ.
    """
    current_user = request.current_user
    
    access_error = require_project_access(project_id, current_user['id'], current_user['role'])
    if access_error:
        return access_error
    
    work_plan = WorkPlan.query.filter_by(project_id=project_id).first()
    if not work_plan:
        return jsonify({'message': 'План работ для этого проекта не найден'}), 404
    
    db.session.refresh(work_plan)

    material_risks = []
    schedule_risks = []
    today = date.today()
    
    for item in work_plan.items:
        risk_info = analyze_work_item_risks(item, project_id)
        
        if risk_info['material_risks']:
            for risk in risk_info['material_risks']:
                material_risks.append({
                    'work_item_id': item.id,
                    'work_item_name': item.name,
                    **risk
                })
        
        if item.end_date < today and item.progress < 100:
            days_overdue = (today - item.end_date).days
            schedule_risks.append({
                'work_item_id': item.id,
                'work_item_name': item.name,
                'risk_type': 'schedule_delay',
                'severity': 'high' if days_overdue > 7 else 'medium',
                'description': f'Работа просрочена на {days_overdue} дней. Прогресс: {item.progress}%',
                'days_overdue': days_overdue,
                'progress': item.progress
            })
        
        if item.status == 'in_progress':
            expected_progress = calculate_expected_progress(item.start_date, item.end_date, today)
            if item.progress < expected_progress - 10:
                schedule_risks.append({
                    'work_item_id': item.id,
                    'work_item_name': item.name,
                    'risk_type': 'behind_schedule',
                    'severity': 'medium',
                    'description': f'Отставание от графика. Ожидается: {expected_progress:.1f}%, Факт: {item.progress}%',
                    'expected_progress': expected_progress,
                    'actual_progress': item.progress
                })
    
    overall_risk_level = 'low'
    if len(material_risks) > 0 or len(schedule_risks) > 0:
        overall_risk_level = 'medium'
    if len([r for r in material_risks if r.get('severity') == 'high']) > 0 or \
       len([r for r in schedule_risks if r.get('severity') == 'high']) > 0:
        overall_risk_level = 'high'
    
    return jsonify({
        'project_id': project_id,
        'overall_risk_level': overall_risk_level,
        'material_risks': material_risks,
        'schedule_risks': schedule_risks,
        'summary': {
            'total_material_risks': len(material_risks),
            'total_schedule_risks': len(schedule_risks),
            'high_severity_count': len([r for r in material_risks + schedule_risks if r.get('severity') == 'high'])
        }
    }), 200


def calculate_work_item_risk(item, project_id):
    """
    Вычисляет уровень риска для отдельной работы.
    Возвращает: 'low', 'medium', 'high'
    """
    risk_info = analyze_work_item_risks(item, project_id)
    
    if not risk_info['material_risks'] and not risk_info['is_delayed']:
        return 'low'
    
    high_risks = [r for r in risk_info['material_risks'] if r.get('severity') == 'high']
    if high_risks or risk_info['is_delayed']:
        return 'high'
    
    return 'medium'


def analyze_work_item_risks(item, project_id):
    """
    Детальный анализ рисков для работы.
    Проверяет риски перерасхода и нехватки материалов.
    """
    from sqlalchemy import func
    
    material_risks = []
    today = date.today()
    is_delayed = item.end_date < today and item.progress < 100
    
    required_materials = RequiredMaterial.query.filter_by(work_item_id=item.id).all()
    
    for req_mat in required_materials:
        consumed = db.session.query(
            func.sum(ConsumptionLog.quantity_used)
        ).filter(
            ConsumptionLog.work_item_id == item.id,
            ConsumptionLog.material_id == req_mat.material_id
        ).scalar() or 0.0
        
        consumed = float(consumed)
        planned = float(req_mat.planned_quantity)
        
        if item.progress > 0:
            expected_consumption = (planned * item.progress) / 100.0
            actual_rate = consumed / (item.progress / 100.0) if item.progress > 0 else 0
            
            if consumed > expected_consumption * 1.2:
                material_risks.append({
                    'material_id': req_mat.material_id,
                    'material_name': req_mat.material.name,
                    'risk_type': 'overrun',
                    'severity': 'high',
                    'description': f'Перерасход материала. Израсходовано: {consumed:.2f}, ожидалось: {expected_consumption:.2f}',
                    'consumed': consumed,
                    'expected': expected_consumption,
                    'planned': planned
                })
            
            if actual_rate > planned * 1.1 and item.progress < 80:
                material_risks.append({
                    'material_id': req_mat.material_id,
                    'material_name': req_mat.material.name,
                    'risk_type': 'overrun_forecast',
                    'severity': 'medium',
                    'description': f'Прогнозируется перерасход. Текущий темп: {actual_rate:.2f}/{planned:.2f}',
                    'consumption_rate': actual_rate,
                    'planned': planned
                })
        
        available = get_material_balance_on_project(project_id, req_mat.material_id)
        remaining_work = 100 - item.progress
        if remaining_work > 0:
            needed_to_complete = (planned * remaining_work) / 100.0
            
            if available < needed_to_complete * 0.5:
                material_risks.append({
                    'material_id': req_mat.material_id,
                    'material_name': req_mat.material.name,
                    'risk_type': 'shortage',
                    'severity': 'high',
                    'description': f'Недостаточно материала для завершения. Доступно: {available:.2f}, требуется: {needed_to_complete:.2f}',
                    'available': available,
                    'needed': needed_to_complete
                })
    
    return {
        'material_risks': material_risks,
        'is_delayed': is_delayed
    }


def get_material_balance_on_project(project_id, material_id):
    """Вспомогательная функция для расчета остатка материала на проекте."""
    from sqlalchemy import func
    
    delivered = db.session.query(
        func.sum(MaterialDeliveryItem.quantity)
    ).join(MaterialDelivery).filter(
        MaterialDelivery.project_id == project_id,
        MaterialDeliveryItem.material_id == material_id
    ).scalar() or 0.0
    
    work_plan = WorkPlan.query.filter_by(project_id=project_id).first()
    consumed = 0.0
    
    if work_plan:
        work_item_ids = [item.id for item in work_plan.items]
        if work_item_ids:
            consumed = db.session.query(
                func.sum(ConsumptionLog.quantity_used)
            ).filter(
                ConsumptionLog.work_item_id.in_(work_item_ids),
                ConsumptionLog.material_id == material_id
            ).scalar() or 0.0
    
    return float(delivered) - float(consumed)


def calculate_expected_progress(start_date, end_date, current_date):
    """
    Вычисляет ожидаемый прогресс работы на текущую дату.
    Предполагает линейное выполнение работы.
    """
    if current_date <= start_date:
        return 0.0
    if current_date >= end_date:
        return 100.0
    
    total_days = (end_date - start_date).days
    elapsed_days = (current_date - start_date).days
    
    if total_days == 0:
        return 100.0
    
    return (elapsed_days / total_days) * 100.0

from flask import Blueprint, request, jsonify
from datetime import datetime

from models import db, WorkPlanItem, WorkPlan, ConsumptionLog, Material, MaterialDelivery, MaterialDeliveryItem
from auth import token_required, role_required
from project_access import require_project_access

work_execution_bp = Blueprint('work_execution_bp', __name__)


@work_execution_bp.route('/api/projects/<int:project_id>/my-work-items', methods=['GET'])
@token_required
@role_required('foreman')
def get_foreman_work_items(project_id):
    """
    Получает список работ для прораба по проекту.
    Возвращает задачи плана работ с информацией о плановых материалах и прогрессе.
    """
    current_user = request.current_user
    
    access_error = require_project_access(project_id, current_user['id'], current_user['role'])
    if access_error:
        return access_error
    
    work_plan = WorkPlan.query.filter_by(project_id=project_id).first()
    if not work_plan:
        return jsonify({'message': 'План работ для этого проекта не найден'}), 404
    
    status_filter = request.args.get('status')
    
    items = work_plan.items
    if status_filter:
        items = [item for item in items if item.status == status_filter]
    
    result = []
    for item in items:
        item_dict = item.to_dict(include_materials=True)
        result.append(item_dict)
    
    return jsonify({
        'project_id': project_id,
        'work_plan_id': work_plan.id,
        'items': result
    }), 200


@work_execution_bp.route('/api/work-items/<int:item_id>/report-progress', methods=['POST'])
@token_required
@role_required('foreman')
def report_work_item_progress(item_id):
    """
    Прораб отчитывается о выполнении работы.
    Обновляет прогресс задачи и списывает материалы.
    """
    current_user = request.current_user
    
    item = db.get_or_404(WorkPlanItem, item_id)
    work_plan = db.get_or_404(WorkPlan, item.work_plan_id)
    
    access_error = require_project_access(work_plan.project_id, current_user['id'], current_user['role'])
    if access_error:
        return access_error
    
    data = request.get_json()
    if not data:
        return jsonify({'message': 'Отсутствуют данные для отчетности'}), 400
    
    if 'progress' in data:
        progress = float(data['progress'])
        if progress < 0 or progress > 100:
            return jsonify({'message': 'Прогресс должен быть в диапазоне 0-100'}), 400
        item.progress = progress
        
        if progress == 0:
            item.status = 'not_started'
        elif progress == 100:
            item.status = 'completed'
        else:
            item.status = 'in_progress'
    
    if 'materials_used' in data:
        materials_used = data['materials_used']
        if not isinstance(materials_used, list):
            return jsonify({'message': 'materials_used должен быть массивом'}), 400
        
        for material_data in materials_used:
            material_id = material_data.get('material_id')
            quantity_used = material_data.get('quantity_used')
            
            if not material_id or quantity_used is None:
                return jsonify({'message': 'Каждый материал должен содержать material_id и quantity_used'}), 400
            
            quantity_used = float(quantity_used)
            if quantity_used <= 0:
                return jsonify({'message': 'Количество использованного материала должно быть больше 0'}), 400
            
            material = db.get_or_404(Material, material_id)
            
            available = get_material_balance_on_project(work_plan.project_id, material_id)
            if available < quantity_used:
                return jsonify({
                    'message': f'Недостаточно материала "{material.name}" на складе. Доступно: {available} {material.unit}, требуется: {quantity_used} {material.unit}'
                }), 400
            
            consumption_log = ConsumptionLog(
                work_item_id=item_id,
                material_id=material_id,
                quantity_used=quantity_used,
                foreman_id=current_user['id'],
                consumption_date=datetime.now()
            )
            db.session.add(consumption_log)
    
    db.session.commit()
    
    result = item.to_dict(include_materials=True)
    result['consumption_logs'] = [log.to_dict() for log in item.consumption_logs]
    
    return jsonify({
        'message': 'Отчет о выполнении работы успешно сохранен',
        'work_item': result
    }), 200


@work_execution_bp.route('/api/work-items/<int:item_id>/consumption-logs', methods=['GET'])
@token_required
def get_work_item_consumption_logs(item_id):
    """Получает журнал расхода материалов для конкретной работы."""
    current_user = request.current_user
    
    item = db.get_or_404(WorkPlanItem, item_id)
    work_plan = db.get_or_404(WorkPlan, item.work_plan_id)
    
    access_error = require_project_access(work_plan.project_id, current_user['id'], current_user['role'])
    if access_error:
        return access_error
    
    logs = ConsumptionLog.query.filter_by(work_item_id=item_id).order_by(
        ConsumptionLog.consumption_date.desc()
    ).all()
    
    return jsonify({
        'work_item_id': item_id,
        'work_item_name': item.name,
        'logs': [log.to_dict() for log in logs]
    }), 200


@work_execution_bp.route('/api/projects/<int:project_id>/available-materials', methods=['GET'])
@token_required
def get_available_materials_for_project(project_id):
    """
    Получает список материалов, доступных на складе проекта для списания.
    Показывает только те материалы, у которых есть остаток.
    """
    current_user = request.current_user
    
    access_error = require_project_access(project_id, current_user['id'], current_user['role'])
    if access_error:
        return access_error
    
    from sqlalchemy import func
    from models import WorkPlan
    from collections import defaultdict
    
    delivered = db.session.query(
        MaterialDeliveryItem.material_id,
        func.sum(MaterialDeliveryItem.quantity).label('total_delivered')
    ).join(MaterialDelivery).filter(
        MaterialDelivery.project_id == project_id
    ).group_by(MaterialDeliveryItem.material_id).all()
    
    work_plan = WorkPlan.query.filter_by(project_id=project_id).first()
    consumed_dict = defaultdict(float)
    
    if work_plan:
        work_item_ids = [item.id for item in work_plan.items]
        if work_item_ids:
            consumed = db.session.query(
                ConsumptionLog.material_id,
                func.sum(ConsumptionLog.quantity_used).label('total_consumed')
            ).filter(
                ConsumptionLog.work_item_id.in_(work_item_ids)
            ).group_by(ConsumptionLog.material_id).all()
            
            for item in consumed:
                consumed_dict[item.material_id] = float(item.total_consumed)
    
    available_materials = []
    for item in delivered:
        material_id = item.material_id
        total_delivered = float(item.total_delivered)
        total_consumed = consumed_dict.get(material_id, 0.0)
        remaining = total_delivered - total_consumed
        
        if remaining > 0:
            material = Material.query.get(material_id)
            if material:
                available_materials.append({
                    'material_id': material.id,
                    'material_name': material.name,
                    'unit': material.unit,
                    'available_quantity': remaining
                })
    
    available_materials.sort(key=lambda x: x['material_name'])
    
    return jsonify({
        'project_id': project_id,
        'available_materials': available_materials
    }), 200


@work_execution_bp.route('/api/consumption-logs/<int:log_id>', methods=['DELETE'])
@token_required
def delete_consumption_log(log_id):
    """
    Удаляет запись о расходе материала.
    Доступно только для прораба, который создал запись, или для службы строительного контроля (заказчика).
    """
    current_user = request.current_user
    
    log = db.get_or_404(ConsumptionLog, log_id)
    work_item = db.get_or_404(WorkPlanItem, log.work_item_id)
    work_plan = db.get_or_404(WorkPlan, work_item.work_plan_id)
    
    access_error = require_project_access(work_plan.project_id, current_user['id'], current_user['role'])
    if access_error:
        return access_error
    
    if current_user['role'] == 'foreman' and log.foreman_id != current_user['id']:
        return jsonify({'message': 'Вы можете удалять только свои записи о расходе'}), 403
    
    if current_user['role'] not in ['foreman', 'client']:
        return jsonify({'message': 'Недостаточно прав для удаления записи'}), 403
    
    db.session.delete(log)
    db.session.commit()
    
    return jsonify({'message': 'Запись о расходе материала успешно удалена'}), 200


def get_material_balance_on_project(project_id, material_id):
    """
    Вспомогательная функция для расчета доступного остатка материала на проекте.
    """
    from sqlalchemy import func
    from models import WorkPlan
    
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

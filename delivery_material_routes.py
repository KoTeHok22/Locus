from flask import Blueprint, request, jsonify
from datetime import datetime

from models import db, MaterialDelivery, MaterialDeliveryItem, Material, Project, ConsumptionLog
from auth import token_required
from project_access import require_project_access

delivery_material_bp = Blueprint('delivery_material_bp', __name__)


@delivery_material_bp.route('/api/projects/<int:project_id>/material-deliveries', methods=['GET'])
@token_required
def get_project_material_deliveries(project_id):
    """Получает список всех поставок материалов по проекту."""
    current_user = request.current_user
    
    access_error = require_project_access(project_id, current_user['id'], current_user['role'])
    if access_error:
        return access_error
    
    deliveries = MaterialDelivery.query.filter_by(project_id=project_id).order_by(
        MaterialDelivery.delivery_date.desc()
    ).all()
    
    return jsonify([d.to_dict() for d in deliveries]), 200


@delivery_material_bp.route('/api/projects/<int:project_id>/material-balance', methods=['GET'])
@token_required
def get_project_material_balance(project_id):
    """
    Получает баланс материалов на объекте (складе проекта).
    Для каждого материала показывает: поставлено, израсходовано, остаток.
    """
    current_user = request.current_user
    
    access_error = require_project_access(project_id, current_user['id'], current_user['role'])
    if access_error:
        return access_error
    
    from sqlalchemy import func
    from models import WorkPlan, WorkPlanItem
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
    
    delivered_dict = defaultdict(float)
    for item in delivered:
        delivered_dict[item.material_id] = float(item.total_delivered)
    
    all_material_ids = set(delivered_dict.keys()) | set(consumed_dict.keys())
    
    if not all_material_ids:
        return jsonify({
            'project_id': project_id,
            'balance': []
        }), 200
    
    materials = Material.query.filter(Material.id.in_(all_material_ids)).all()
    
    balance = []
    for material in materials:
        total_delivered = delivered_dict.get(material.id, 0.0)
        total_consumed = consumed_dict.get(material.id, 0.0)
        remaining = total_delivered - total_consumed
        
        balance.append({
            'material_id': material.id,
            'material_name': material.name,
            'unit': material.unit,
            'total_delivered': total_delivered,
            'total_consumed': total_consumed,
            'remaining': remaining
        })
    
    balance.sort(key=lambda x: x['material_name'])
    
    return jsonify({
        'project_id': project_id,
        'balance': balance
    }), 200


@delivery_material_bp.route('/api/material-deliveries/<int:delivery_id>', methods=['GET'])
@token_required
def get_material_delivery(delivery_id):
    """Получает детальную информацию о поставке материалов."""
    current_user = request.current_user
    
    delivery = db.get_or_404(MaterialDelivery, delivery_id)
    
    access_error = require_project_access(delivery.project_id, current_user['id'], current_user['role'])
    if access_error:
        return access_error
    
    return jsonify(delivery.to_dict()), 200


@delivery_material_bp.route('/api/material-deliveries/<int:delivery_id>', methods=['DELETE'])
@token_required
def delete_material_delivery(delivery_id):
    """Удаляет поставку материалов (только для службы строительного контроля/заказчика)."""
    current_user = request.current_user
    
    if current_user.get('role') != 'client':
        return jsonify({'message': 'Только служба строительного контроля (заказчик) может удалять поставки'}), 403
    
    delivery = db.get_or_404(MaterialDelivery, delivery_id)
    
    access_error = require_project_access(delivery.project_id, current_user['id'], current_user['role'])
    if access_error:
        return access_error
    
    db.session.delete(delivery)
    db.session.commit()
    
    return jsonify({'message': 'Поставка материалов успешно удалена'}), 200

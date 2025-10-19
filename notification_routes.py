from flask import Blueprint, request, jsonify
from models import db, Notification
from auth import token_required

notification_bp = Blueprint('notification_bp', __name__)

@notification_bp.route('/api/notifications', methods=['GET'])
@token_required
def get_notifications():
    current_user = request.current_user
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    query = Notification.query.filter_by(user_id=current_user['id']).order_by(Notification.created_at.desc())
    
    paginated = query.paginate(page=page, per_page=per_page, error_out=False)
    
    notifications = [notification.to_dict() for notification in paginated.items]
    
    return jsonify({
        'notifications': notifications,
        'total': paginated.total,
        'page': page,
        'per_page': per_page,
        'pages': paginated.pages
    }), 200


@notification_bp.route('/api/notifications/unread-count', methods=['GET'])
@token_required
def get_unread_count():
    current_user = request.current_user
    count = Notification.query.filter_by(
        user_id=current_user['id'],
        is_read=False
    ).count()
    
    return jsonify({'count': count}), 200


@notification_bp.route('/api/notifications/mark-as-read', methods=['POST'])
@token_required
def mark_as_read():
    current_user = request.current_user
    data = request.get_json()
    
    if not data or 'ids' not in data:
        return jsonify({'message': 'Необходимо указать ids'}), 400
    
    ids = data['ids']
    
    if not isinstance(ids, list):
        return jsonify({'message': 'ids должен быть массивом'}), 400
    
    Notification.query.filter(
        Notification.id.in_(ids),
        Notification.user_id == current_user['id']
    ).update({'is_read': True}, synchronize_session=False)
    
    db.session.commit()
    
    return jsonify({'message': 'Уведомления помечены как прочитанные'}), 200

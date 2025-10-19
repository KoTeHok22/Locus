from models import db, Notification

def create_notification(user_id, message, link=None):
    notification = Notification(
        user_id=user_id,
        message=message,
        link=link
    )
    db.session.add(notification)
    db.session.commit()
    return notification

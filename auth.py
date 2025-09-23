import jwt
import bcrypt
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify
import os
import secrets
import re

from models import User, db

SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')

def hash_password(password):
    """
    Хеширование пароля с использованием bcrypt
    """
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def check_password(password, hashed):
    """
    Проверка пароля против его хеша
    """
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def generate_token(user_id, role):
    """
    Генерация JWT токена для пользователя
    """
    payload = {
        'user_id': user_id,
        'role': role,
        'exp': datetime.utcnow() + timedelta(hours=24)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

def verify_token(token):
    """
    Проверка JWT токена и возврат полезной нагрузки
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def token_required(f):
    """
    Декоратор для требования действительного JWT токена для маршрута
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                return jsonify({'message': 'Токен отсутствует'}), 401
        
        if not token:
            return jsonify({'message': 'Токен отсутствует'}), 401
        
        payload = verify_token(token)
        if not payload:
            return jsonify({'message': 'Токен недействителен или истек'}), 401
        
        request.current_user = {
            'id': payload['user_id'],
            'role': payload['role']
        }
        
        return f(*args, **kwargs)
    
    return decorated

def role_required(required_role):
    """
    Декоратор для требования определенной роли для маршрута
    """
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if not hasattr(request, 'current_user'):
                return jsonify({'message': 'Требуется аутентификация'}), 401
            
            user_role = request.current_user['role']
            
            if required_role == 'client' and user_role != 'client':
                return jsonify({'message': 'Недостаточно прав'}), 403
            
            if required_role == 'foreman' and user_role not in ['foreman', 'client']:
                return jsonify({'message': 'Недостаточно прав'}), 403
                
            if required_role == 'inspector' and user_role not in ['inspector', 'client']:
                return jsonify({'message': 'Недостаточно прав'}), 403
            
            return f(*args, **kwargs)
        return decorated
    return decorator

def validate_email(email):
    """
    Проверка формата электронной почты
    """
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    return re.match(pattern, email) is not None

def validate_password(password):
    """
    Проверка сложности пароля
    """
    if len(password) < 8:
        return False
    if not re.search(r'[A-Z]', password):
        return False
    if not re.search(r'[a-z]', password):
        return False
    if not re.search(r'[0-9]', password):
        return False
    return True

def generate_invitation_token():
    """
    Генерация безопасного токена приглашения
    """
    return secrets.token_urlsafe(32)
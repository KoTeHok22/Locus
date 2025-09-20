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

# Хеширование пароля с использованием bcrypt
def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

# Проверка пароля против его хеша
def check_password(password, hashed):
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

# Генерация JWT токена для пользователя
def generate_token(user_id, role):
    payload = {
        'user_id': user_id,
        'role': role,
        'exp': datetime.utcnow() + timedelta(hours=24)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

# Проверка JWT токена и возврат полезной нагрузки
def verify_token(token):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

# Декоратор для требования действительного JWT токена для маршрута
def token_required(f):
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

# Декоратор для требования определенной роли для маршрута
def role_required(required_role):
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

# Проверка формата электронной почты
def validate_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    return re.match(pattern, email) is not None

# Проверка сложности пароля
def validate_password(password):
    if len(password) < 8:
        return False
    if not re.search(r'[A-Z]', password):
        return False
    if not re.search(r'[a-z]', password):
        return False
    if not re.search(r'[0-9]', password):
        return False
    return True

# Генерация безопасного токена приглашения
def generate_invitation_token():
    return secrets.token_urlsafe(32)
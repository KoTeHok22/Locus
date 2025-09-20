from flask import Blueprint, request, jsonify
from models import User, db
from auth import hash_password, check_password, generate_token, token_required, role_required, validate_email, validate_password, generate_invitation_token
from datetime import datetime, timedelta
import os

auth_bp = Blueprint('auth', __name__)

# Регистрация нового клиента
@auth_bp.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'message': 'Требуются email и пароль'}), 400
        
        email = data['email']
        password = data['password']
        
        if not validate_email(email):
            return jsonify({'message': 'Неверный формат email'}), 400
        
        if not validate_password(password):
            return jsonify({'message': 'Пароль должен содержать не менее 8 символов, включая заглавные и строчные буквы и цифры'}), 400
        
        if User.query.filter_by(email=email).first():
            return jsonify({'message': 'Пользователь с таким email уже существует'}), 409
        
        password_hash = hash_password(password)
        
        new_user = User(
            email=email,
            password_hash=password_hash,
            role='client',
            is_active=True
        )
        
        db.session.add(new_user)
        db.session.commit()
        
        token = generate_token(new_user.id, new_user.role)
        
        return jsonify({
            'message': 'Пользователь успешно зарегистрирован',
            'user': new_user.to_dict(),
            'token': token
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Ошибка регистрации', 'error': str(e)}), 500

# Вход пользователя
@auth_bp.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'message': 'Требуются email и пароль'}), 400
        
        email = data['email']
        password = data['password']
        
        user = User.query.filter_by(email=email).first()
        
        if not user or not check_password(password, user.password_hash):
            return jsonify({'message': 'Неверный email или пароль'}), 401
        
        if not user.is_active:
            return jsonify({'message': 'Аккаунт деактивирован'}), 401
        
        token = generate_token(user.id, user.role)
        
        return jsonify({
            'message': 'Вход выполнен успешно',
            'user': user.to_dict(),
            'token': token
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Ошибка входа', 'error': str(e)}), 500

# Приглашение нового пользователя (только для клиентов)
@auth_bp.route('/api/invite-user', methods=['POST'])
@token_required
@role_required('client')
def invite_user():
    try:
        data = request.get_json()
        current_user_id = request.current_user['id']
        
        if not data or not data.get('email') or not data.get('role'):
            return jsonify({'message': 'Требуются email и роль'}), 400
        
        email = data['email']
        role = data['role']
        
        if role not in ['foreman', 'inspector']:
            return jsonify({'message': 'Роль должна быть "foreman" или "inspector"'}), 400
        
        if not validate_email(email):
            return jsonify({'message': 'Неверный формат email'}), 400
        
        if User.query.filter_by(email=email).first():
            return jsonify({'message': 'Пользователь с таким email уже существует'}), 409
        
        invitation_token = generate_invitation_token()
        expiration_time = datetime.utcnow() + timedelta(hours=48)
        
        new_user = User(
            email=email,
            password_hash='',
            role=role,
            is_active=False,
            is_invited=True,
            invitation_token=invitation_token,
            invitation_token_expires=expiration_time
        )
        
        db.session.add(new_user)
        db.session.commit()
        
        invitation_link = f"{request.host_url}set-password?token={invitation_token}"
        
        return jsonify({
            'message': 'Пользователь успешно приглашен',
            'invitation_link': invitation_link,
            'token': invitation_token
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Ошибка приглашения', 'error': str(e)}), 500

# Установка пароля для приглашенного пользователя
@auth_bp.route('/api/set-password', methods=['POST'])
def set_password():
    try:
        data = request.get_json()
        
        if not data or not data.get('token') or not data.get('password'):
            return jsonify({'message': 'Требуются токен и пароль'}), 400
        
        token = data['token']
        password = data['password']
        
        if not validate_password(password):
            return jsonify({'message': 'Пароль должен содержать не менее 8 символов, включая заглавные и строчные буквы и цифры'}), 400
        
        user = User.query.filter_by(invitation_token=token).first()
        
        if not user:
            return jsonify({'message': 'Неверный или истекший токен приглашения'}), 400
        
        if user.invitation_token_expires < datetime.utcnow():
            return jsonify({'message': 'Токен приглашения истек'}), 400
        
        password_hash = hash_password(password)
        
        user.password_hash = password_hash
        user.is_active = True
        user.is_invited = False
        user.invitation_token = None
        user.invitation_token_expires = None
        
        db.session.commit()
        
        token = generate_token(user.id, user.role)
        
        return jsonify({
            'message': 'Пароль успешно установлен',
            'user': user.to_dict(),
            'token': token
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Ошибка установки пароля', 'error': str(e)}), 500

# Получение профиля текущего пользователя
@auth_bp.route('/api/profile', methods=['GET'])
@token_required
def get_profile():
    try:
        user_id = request.current_user['id']
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'message': 'Пользователь не найден'}), 404
        
        return jsonify({
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Ошибка получения профиля', 'error': str(e)}), 500
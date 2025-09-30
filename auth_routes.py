from flask import Blueprint, request, jsonify
from models import User, db
from auth import hash_password, check_password, generate_token, token_required, role_required, validate_email, validate_password, generate_invitation_token
from datetime import datetime, timedelta, timezone
import os

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/api/register', methods=['POST'])
def register():
    """
    Регистрирует нового пользователя в системе.

    Принимает email, пароль и опциональную роль из тела JSON-запроса.
    Проверяет валидность данных, хэширует пароль и создает нового
    активного пользователя. Возвращает данные пользователя и JWT токен.
    """
    try: 
        data = request.get_json()
        
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'message': 'Требуются email и пароль'}), 400
        
        email = data['email']
        password = data['password']
        role = data.get('role', 'client')
        first_name = data.get('firstName')
        last_name = data.get('lastName')
        phone = data.get('phone')
        
        available_roles = ['client', 'foreman', 'inspector']
        if role not in available_roles:
            return jsonify({'message': f'Роль должна быть одной из: {", ".join(available_roles)}'}), 400
        
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
            role=role,
            first_name=first_name,
            last_name=last_name,
            phone=phone,
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

@auth_bp.route('/api/login', methods=['POST'])
def login():
    """
    Аутентифицирует пользователя и возвращает токен.

    Принимает email и пароль из тела JSON-запроса. Проверяет
    учетные данные, и в случае успеха возвращает данные пользователя
    и новый JWT токен.
    """
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

@auth_bp.route('/api/set-password', methods=['POST'])
def set_password():
    """
    Устанавливает пароль для приглашенного пользователя.

    Принимает токен приглашения и новый пароль. Проверяет валидность
    токена, устанавливает новый пароль, активирует пользователя
    и сбрасывает токен приглашения. Возвращает данные пользователя
    и новый JWT токен.
    """
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
        
        if user.invitation_token_expires < datetime.now(timezone.utc):
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

@auth_bp.route('/api/profile', methods=['GET'])
@token_required
def get_profile():
    """
    Возвращает профиль текущего аутентифицированного пользователя.

    Использует JWT токен для идентификации пользователя и возвращает
    его данные из базы данных.
    """
    try:
        user_id = request.current_user['id']
        user = db.session.get(User, user_id)
        if not user:
            return jsonify({'message': 'Пользователь не найден'}), 404
        
        return jsonify({
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Ошибка получения профиля', 'error': str(e)}), 500

@auth_bp.route('/api/verify-token', methods=['GET'])
@token_required
def verify_token():
    """
    Проверяет действительность JWT токена.

    Если токен действителен и пользователь активен, возвращает
    данные пользователя. В противном случае возвращает ошибку.
    """
    try:
        user_id = request.current_user['id']
        user = db.session.get(User, user_id)
        
        if not user or not user.is_active:
            return jsonify({'message': 'Неверный токен'}), 401
        
        return jsonify({
            'message': 'Токен действителен',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Ошибка проверки токена', 'error': str(e)}), 500

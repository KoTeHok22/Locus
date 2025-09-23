import os
import time
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from sqlalchemy.exc import OperationalError

load_dotenv()

from models import db
from auth_routes import auth_bp

def create_app(test_config=None):
    """Создание и настройка Flask приложения"""
    app = Flask(__name__)
    
    CORS(app)
    
    if test_config is None:
        app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///app.db')
        app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    else:
        app.config.update(test_config)
    
    db.init_app(app)
    
    def create_tables_with_retry(max_retries=5, delay=2):
        """
        Логика повторной попытки подключения к базе данных
        """
        for attempt in range(max_retries):
            try:
                with app.app_context():
                    db.create_all()
                print("Таблицы базы данных успешно созданы")
                return True
            except OperationalError as e:
                if attempt < max_retries - 1:
                    print(f"Не удалось подключиться к базе данных (попытка {attempt + 1}/{max_retries}): {e}")
                    time.sleep(delay)
                else:
                    print(f"Не удалось подключиться к базе данных после {max_retries} попыток: {e}")
                    raise
    
    if test_config is None:
        create_tables_with_retry()
    
    app.register_blueprint(auth_bp)
    
    return app

if __name__ == '__main__':
    """
    Создаем экземпляр приложения только если файл запущен напрямую
    """
    app = create_app()
    app.run(host='0.0.0.0', port=5000, debug=True)
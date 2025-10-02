
import os
import time
from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
from sqlalchemy.exc import OperationalError

load_dotenv()

from models import db
from tasks import make_celery

from auth_routes import auth_bp
from classifier_routes import classifier_bp
from project_routes import project_bp_v2
from daily_report_routes import daily_report_bp_v2
from task_routes import task_bp
from issue_routes import issue_bp
from dashboard_routes import dashboard_bp
from document_routes import document_bp
from workflow_routes import workflow_bp
from analytics_routes import analytics_bp
from map_routes import map_bp

from schedule_routes import schedule_bp
from ttn_routes import recognition_bp
from delivery_routes import delivery_bp


def create_app(test_config=None):
    """Создание и настройка Flask приложения."""
    app = Flask(__name__)
    CORS(app, origins="*", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"], allow_headers=["Authorization", "Content-Type", "X-User-Geolocation"])

    if test_config is None:
        app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///app.db')
        app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
        app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'fallback-secret-key-change-me')
        app.config['CELERY_BROKER_URL'] = os.environ.get('CELERY_BROKER_URL', 'redis://localhost:6379/0')
        app.config['CELERY_RESULT_BACKEND'] = os.environ.get('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')
    else:
        app.config.update(test_config)

    app.config.setdefault('JWT_HEADER_NAME', 'Authorization')
    app.config.setdefault('JWT_HEADER_TYPE', 'Bearer')

    db.init_app(app)
    jwt = JWTManager(app)
    celery = make_celery(app)

    def create_tables_with_retry(max_retries=5, delay=2):
        for attempt in range(max_retries):
            try:
                with app.app_context():
                    db.create_all()
                print("Таблицы базы данных успешно созданы.")
                return
            except OperationalError as e:
                if attempt < max_retries - 1:
                    print(f"Не удалось подключиться к БД (попытка {attempt + 1}/{max_retries}): {e}. Повтор через {delay} сек...")
                    time.sleep(delay)
                else:
                    print(f"Не удалось подключиться к БД после {max_retries} попыток.")
                    raise
    
    if test_config is None:
        create_tables_with_retry()

    app.register_blueprint(project_bp_v2)
    app.register_blueprint(daily_report_bp_v2)
    app.register_blueprint(task_bp)
    app.register_blueprint(issue_bp)
    app.register_blueprint(schedule_bp)

    app.register_blueprint(auth_bp)
    app.register_blueprint(classifier_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(document_bp)
    app.register_blueprint(workflow_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(map_bp)
    app.register_blueprint(recognition_bp)
    app.register_blueprint(delivery_bp)

    @app.route('/uploads/<path:filename>')
    def serve_upload(filename):
        return send_from_directory(os.path.join(app.root_path, 'uploads'), filename)
    
    return app, celery

if __name__ == '__main__':
    app, celery = create_app()
    app.run(host='0.0.0.0', port=8181, debug=True)

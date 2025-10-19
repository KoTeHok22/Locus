
import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv

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
from checklist_routes import checklist_bp
from risk_routes import risk_bp
from workplan_routes import workplan_bp
from delivery_material_routes import delivery_material_bp
from work_execution_routes import work_execution_bp
from analytics_material_routes import analytics_material_bp
from notification_routes import notification_bp


def create_app(test_config=None):
    """Создание и настройка Flask приложения."""
    app = Flask(__name__)
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    if test_config is None:
        db_url = os.environ.get('DATABASE_URL')
        if not db_url:
            pg_user = os.environ.get('POSTGRES_USER')
            pg_pass = os.environ.get('POSTGRES_PASSWORD')
            pg_host = os.environ.get('POSTGRES_HOST')
            pg_port = os.environ.get('POSTGRES_PORT')
            pg_db = os.environ.get('POSTGRES_DATABASE')
            if all([pg_user, pg_pass, pg_host, pg_port, pg_db]):
                db_url = f"postgresql://{pg_user}:{pg_pass}@{pg_host}:{pg_port}/{pg_db}"
            else:
                db_url = 'sqlite:///app.db'
        app.config['SQLALCHEMY_DATABASE_URI'] = db_url
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
    app.register_blueprint(checklist_bp)
    app.register_blueprint(risk_bp)
    app.register_blueprint(workplan_bp)
    app.register_blueprint(delivery_material_bp)
    app.register_blueprint(work_execution_bp)
    app.register_blueprint(analytics_material_bp)
    app.register_blueprint(notification_bp)

    @app.route('/uploads/<path:filename>')
    def serve_upload(filename):
        return send_from_directory(os.path.join(app.root_path, 'uploads'), filename)
    
    return app, celery

if __name__ == '__main__':
    app, celery = create_app()
    app.run(host='0.0.0.0', port=5000, debug=True)

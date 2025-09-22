import os
import time
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from sqlalchemy.exc import OperationalError

load_dotenv()

from models import db
from auth_routes import auth_bp

app = Flask(__name__)

CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///app.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

# Логика повторной попытки подключения к базе данных
def create_tables_with_retry(max_retries=5, delay=2):
    for attempt in range(max_retries):
        try:
            with app.app_context():
                db.create_all()
            print("Database tables created successfully")
            return True
        except OperationalError as e:
            if attempt < max_retries - 1:
                print(f"Database connection failed (attempt {attempt + 1}/{max_retries}): {e}")
                time.sleep(delay)
            else:
                print(f"Failed to connect to database after {max_retries} attempts: {e}")
                raise

# Создание таблиц с логикой повторных попыток
create_tables_with_retry()

app.register_blueprint(auth_bp)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
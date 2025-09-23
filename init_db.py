import os
import sys
from dotenv import load_dotenv

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

from models import db
from main import create_app

def init_db():
    """
    Инициализация базы данных с необходимыми таблицами
    """
    app = create_app()
    with app.app_context():
        print("Создание таблиц базы данных...")
        db.create_all()
        print("Таблицы базы данных успешно созданы!")

if __name__ == '__main__':
    init_db()
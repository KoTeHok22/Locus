#!/usr/bin/env python3

import os
import sys
from dotenv import load_dotenv

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

from models import db
from main import app

# Инициализация базы данных с необходимыми таблицами
def init_db():
    with app.app_context():
        print("Создание таблиц базы данных...")
        db.create_all()
        print("Таблицы базы данных успешно созданы!")

if __name__ == '__main__':
    init_db()
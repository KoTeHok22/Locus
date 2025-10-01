"""
Скрипт для добавления полей completion_comment и completion_photos в таблицу tasks
Запускать только если init_db.py еще не был выполнен
"""
import os
import sys
from dotenv import load_dotenv

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
load_dotenv()

from main import create_app
from models import db

def add_columns():
    """Добавляет новые колонки в существующую таблицу tasks"""
    app, _ = create_app()
    with app.app_context():
        try:
            # Для SQLite используем ALTER TABLE
            with db.engine.connect() as conn:
                # Проверяем, существуют ли уже колонки
                result = conn.execute(db.text("PRAGMA table_info(tasks)"))
                columns = [row[1] for row in result]
                
                if 'completion_comment' not in columns:
                    conn.execute(db.text("ALTER TABLE tasks ADD COLUMN completion_comment TEXT"))
                    conn.commit()
                    print("✓ Добавлена колонка completion_comment")
                else:
                    print("- Колонка completion_comment уже существует")
                
                if 'completion_photos' not in columns:
                    conn.execute(db.text("ALTER TABLE tasks ADD COLUMN completion_photos TEXT"))  # SQLite хранит JSON как TEXT
                    conn.commit()
                    print("✓ Добавлена колонка completion_photos")
                else:
                    print("- Колонка completion_photos уже существует")
                
                print("\n✓ Миграция успешно завершена!")
                
        except Exception as e:
            print(f"✗ Ошибка при миграции: {e}")
            print("\nЕсли ошибка связана с отсутствием таблицы, выполните: python init_db.py")
            sys.exit(1)

if __name__ == '__main__':
    add_columns()

"""
Скрипт миграции: добавление полей completion_comment и completion_photos в таблицу tasks
"""
import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'instance', 'app.db')

if not os.path.exists(db_path):
    # Если используется переменная окружения DATABASE_URL
    db_path = 'app.db'

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Проверяем, существуют ли уже столбцы
    cursor.execute("PRAGMA table_info(tasks)")
    columns = [column[1] for column in cursor.fetchall()]
    
    if 'completion_comment' not in columns:
        cursor.execute("ALTER TABLE tasks ADD COLUMN completion_comment TEXT")
        print("✓ Добавлен столбец completion_comment")
    else:
        print("- Столбец completion_comment уже существует")
    
    if 'completion_photos' not in columns:
        cursor.execute("ALTER TABLE tasks ADD COLUMN completion_photos TEXT")  # SQLite хранит JSON как TEXT
        print("✓ Добавлен столбец completion_photos")
    else:
        print("- Столбец completion_photos уже существует")
    
    conn.commit()
    print("\n✓ Миграция успешно завершена!")
    
except sqlite3.Error as e:
    print(f"✗ Ошибка при миграции БД: {e}")
    
finally:
    if conn:
        conn.close()

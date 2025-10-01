#!/bin/sh

# Выполняем скрипт инициализации базы данных
echo "--- Running Database Initialization ---"
python init_db.py
echo "--- Database Initialization Complete ---"

# Запускаем основное приложение Flask
echo "--- Starting Flask Application ---"
exec python main.py

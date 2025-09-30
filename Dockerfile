# Используем образ Python 3.9 slim в качестве базы
FROM python:3.9-slim

# Устанавливаем рабочую директорию
WORKDIR /app

# Устанавливаем переменные окружения
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Устанавливаем системные зависимости
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
        postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Копируем файл зависимостей
COPY requirements.txt .

# Устанавливаем зависимости Python
RUN pip install --no-cache-dir -r requirements.txt

# Устанавливаем системные зависимости для Playwright и сами браузеры
RUN playwright install-deps
RUN playwright install

# Копируем файлы проекта
COPY . .

# Копируем и делаем исполняемым wait-for-it.sh
COPY wait-for-it.sh .
RUN chmod +x ./wait-for-it.sh

# Открываем порт
EXPOSE 5000

# Запускаем приложение
CMD ["./wait-for-it.sh", "db", "python", "main.py"]
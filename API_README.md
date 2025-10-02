# API Quick Start Guide

## 🚀 Быстрый старт

### Базовая информация

- **URL:** `http://localhost:8501/api`
- **Авторизация:** Bearer Token (JWT)
- **Формат:** JSON

### Получение токена

```bash
curl -X POST http://localhost:8501/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

Ответ:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {...}
}
```

### Использование токена

```bash
curl http://localhost:8501/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📚 Основные эндпоинты

### Аутентификация
- `POST /auth/register` - Регистрация
- `POST /auth/login` - Вход
- `GET /auth/me` - Текущий пользователь

### Проекты
- `GET /projects` - Список проектов
- `POST /projects` - Создать проект
- `GET /projects/{id}` - Детали проекта
- `PUT /projects/{id}` - Обновить проект

### Задачи
- `GET /tasks` - Список задач
- `POST /tasks` - Создать задачу
- `PATCH /projects/{pid}/tasks/{tid}` - Завершить задачу 📍
- `POST /projects/{pid}/tasks/{tid}/verify` - Верифицировать

### Нарушения
- `GET /issues` - Список нарушений
- `POST /projects/{id}/issues` - Создать нарушение 📍
- `PATCH /issues/{id}` - Закрыть нарушение

### Документы
- `POST /documents/upload` - Загрузить документ 📍
- `POST /documents/recognize` - Распознать ТТН
- `PUT /documents/{id}/data` - Обновить данные
- `DELETE /documents/{id}` - Удалить документ

### Отчеты
- `GET /daily-reports` - Список отчетов
- `POST /daily-reports` - Создать отчет 📍

### Поставки
- `GET /projects/{id}/deliveries` - Список поставок
- `POST /deliveries` - Создать поставку
- `DELETE /deliveries/{id}` - Удалить поставку

### Дашборды и аналитика
- `GET /dashboard` - Данные дашборда
- `GET /map` - Данные для карты
- `GET /analytics/projects/{id}` - Аналитика проекта

📍 - Эндпоинты с автоматической фиксацией геолокации

---

## 🔐 Роли пользователей

| Роль | Описание | Ключевые права |
|------|----------|----------------|
| `client` | Заказчик | Управление проектами, верификация задач |
| `foreman` | Прораб | Выполнение задач, отчеты, документы |
| `inspector` | Инспектор | Регистрация нарушений, инспекции |

---

## 📍 Геолокация

Некоторые действия автоматически фиксируют местоположение пользователя:
- Завершение задачи
- Создание нарушения
- Загрузка документа
- Создание ежедневного отчета

Формат: `"latitude,longitude"` (например: `"55.751244,37.618423"`)

---

## 💡 Примеры запросов

### Создать проект

```bash
curl -X POST http://localhost:8501/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Строительство моста",
    "address": "г. Москва, ул. Ленина, 1",
    "polygon": {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[37.61, 55.75], [37.62, 55.75], [37.62, 55.76], [37.61, 55.76], [37.61, 55.75]]]
      }
    }
  }'
```

### Завершить задачу с фото

```bash
curl -X PATCH http://localhost:8501/api/projects/1/tasks/5 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "status=completed" \
  -F "comment=Работа выполнена" \
  -F "geolocation=55.751244,37.618423" \
  -F "photos=@/path/to/photo1.jpg" \
  -F "photos=@/path/to/photo2.jpg"
```

### Создать нарушение

```bash
curl -X POST http://localhost:8501/api/projects/1/issues \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "violation",
    "description": "Нарушение техники безопасности",
    "classifier_id": 5,
    "due_date": "2025-01-25",
    "geolocation": "55.751244,37.618423"
  }'
```

### Загрузить ТТН

```bash
curl -X POST http://localhost:8501/api/documents/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/ttn.pdf" \
  -F "project_id=1" \
  -F "file_type=ttn" \
  -F "geolocation=55.751244,37.618423"
```

---

## 🔄 Статусы

### Задачи
- `pending` - Ожидает выполнения
- `in_progress` - В работе
- `completed` - Выполнена
- `verified` - Верифицирована
- `rejected` - Отклонена

### Проекты
- `pending` - Не активен
- `active` - Активный
- `completed` - Завершен

### Нарушения
- `open` - Открыто
- `resolved` - Устранено

### Распознавание документов
- `pending` - Ожидает
- `processing` - В обработке
- `completed` - Завершено
- `failed` - Ошибка

---

## ⚠️ Коды ошибок

| Код | Значение |
|-----|----------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Server Error |

---

## 📖 Полная документация

Смотрите [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) для подробного описания всех эндпоинтов.

---

## 🛠️ Разработка

### Запуск сервера

```bash
docker-compose up -d
```

### Просмотр логов

```bash
docker-compose logs -f backend
```

### Тестирование API

```bash
# Установите HTTPie
pip install httpie

# Вход
http POST localhost:8501/api/auth/login email=user@example.com password=pass123

# Получение проектов
http GET localhost:8501/api/projects "Authorization:Bearer TOKEN"
```

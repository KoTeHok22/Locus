# API Документация - Система управления строительными проектами

## Общая информация

**Base URL:** `http://localhost:8501/api`

**Авторизация:** Bearer Token (JWT)

**Формат данных:** JSON

**Геолокация:** Некоторые эндпоинты автоматически фиксируют геолокацию пользователя

---

## Содержание

1. [Аутентификация](#1-аутентификация)
2. [Проекты](#2-проекты)
3. [Задачи](#3-задачи)
4. [Нарушения и замечания](#4-нарушения-и-замечания)
5. [Документы](#5-документы)
6. [Ежедневные отчеты](#6-ежедневные-отчеты)
7. [Поставки материалов](#7-поставки-материалов)
8. [Дашборды](#8-дашборды)
9. [Карта](#9-карта)
10. [Аналитика](#10-аналитика)
11. [Классификаторы](#11-классификаторы)
12. [График работ](#12-график-работ)

---

## 1. Аутентификация

### 1.1. Регистрация пользователя

**POST** `/auth/register`

Создает нового пользователя в системе.

**Требуется авторизация:** Нет

**Тело запроса:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "role": "client | foreman | inspector",
  "first_name": "Иван",
  "last_name": "Иванов",
  "phone": "+7(999)123-45-67"
}
```

**Ответ (201):**
```json
{
  "message": "Пользователь успешно зарегистрирован",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "client",
    "first_name": "Иван",
    "last_name": "Иванов"
  }
}
```

---

### 1.2. Вход в систему

**POST** `/auth/login`

Аутентификация пользователя и получение JWT токена.

**Требуется авторизация:** Нет

**Тело запроса:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Ответ (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "client",
    "first_name": "Иван",
    "last_name": "Иванов"
  }
}
```

---

### 1.3. Получение текущего пользователя

**GET** `/auth/me`

Возвращает информацию о текущем аутентифицированном пользователе.

**Требуется авторизация:** Да

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Ответ (200):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "role": "client",
  "first_name": "Иван",
  "last_name": "Иванов",
  "phone": "+7(999)123-45-67",
  "is_active": true,
  "created_at": "2025-01-15T10:30:00"
}
```

---

## 2. Проекты

### 2.1. Получить список проектов

**GET** `/projects`

Возвращает список проектов с фильтрацией.

**Требуется авторизация:** Да

**Query параметры:**
- `status` (optional): `pending | active | completed`
- `search` (optional): Поиск по названию

**Ответ (200):**
```json
[
  {
    "id": 1,
    "name": "Строительство моста",
    "address": "г. Москва, ул. Ленина, 1",
    "latitude": 55.751244,
    "longitude": 37.618423,
    "status": "active",
    "polygon": {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[37.61, 55.75], ...]]
      }
    },
    "created_at": "2025-01-01T00:00:00",
    "tasks_count": 25,
    "issues_count": 3
  }
]
```

---

### 2.2. Создать проект

**POST** `/projects`

Создает новый проект.

**Требуется авторизация:** Да

**Роль:** `client`

**Тело запроса:**
```json
{
  "name": "Строительство дороги",
  "address": "г. Москва, МКАД, км 42",
  "polygon": {
    "type": "Feature",
    "geometry": {
      "type": "Polygon",
      "coordinates": [[[37.61, 55.75], [37.62, 55.75], [37.62, 55.76], [37.61, 55.76], [37.61, 55.75]]]
    }
  }
}
```

**Ответ (201):**
```json
{
  "message": "Проект успешно создан",
  "id": 2
}
```

---

### 2.3. Получить детали проекта

**GET** `/projects/<project_id>`

Возвращает подробную информацию о проекте.

**Требуется авторизация:** Да

**Ответ (200):**
```json
{
  "id": 1,
  "name": "Строительство моста",
  "address": "г. Москва, ул. Ленина, 1",
  "latitude": 55.751244,
  "longitude": 37.618423,
  "status": "active",
  "polygon": {...},
  "created_at": "2025-01-01T00:00:00",
  "members": [
    {
      "user_id": 2,
      "role": "foreman",
      "user_name": "Петр Петров"
    }
  ],
  "tasks": [...],
  "documents": [...],
  "issues": [...]
}
```

---

### 2.4. Обновить проект

**PUT** `/projects/<project_id>`

Обновляет информацию о проекте.

**Требуется авторизация:** Да

**Роль:** `client`

**Тело запроса:**
```json
{
  "name": "Новое название",
  "address": "Новый адрес",
  "status": "active"
}
```

**Ответ (200):**
```json
{
  "message": "Проект успешно обновлен"
}
```

---

### 2.5. Активировать проект

**POST** `/projects/<project_id>/activate`

Переводит проект в статус "active".

**Требуется авторизация:** Да

**Роль:** `client`

**Ответ (200):**
```json
{
  "message": "Проект активирован"
}
```

---

## 3. Задачи

### 3.1. Получить список задач

**GET** `/tasks`

Возвращает список задач с фильтрацией.

**Требуется авторизация:** Да

**Query параметры:**
- `project_id` (optional): Фильтр по проекту
- `status` (optional): `pending | in_progress | completed | verified`

**Ответ (200):**
```json
[
  {
    "id": 1,
    "project_id": 1,
    "name": "Заливка фундамента",
    "start_date": "2025-01-10",
    "end_date": "2025-01-15",
    "status": "completed",
    "completed_by_id": 2,
    "completed_at": "2025-01-14T15:30:00",
    "completion_comment": "Работа выполнена согласно плану",
    "completion_photos": ["/uploads/task_photos/abc123.jpg"],
    "completion_geolocation": "55.751244,37.618423"
  }
]
```

---

### 3.2. Создать задачу

**POST** `/tasks`

Создает новую задачу в графике работ.

**Требуется авторизация:** Да

**Роль:** `client | foreman`

**Тело запроса:**
```json
{
  "project_id": 1,
  "name": "Устройство опалубки",
  "start_date": "2025-01-16",
  "end_date": "2025-01-20",
  "depends_on": [1, 2]
}
```

**Ответ (201):**
```json
{
  "message": "Задача успешно создана",
  "id": 3
}
```

---

### 3.3. Завершить задачу

**PATCH** `/projects/<project_id>/tasks/<task_id>`

Отмечает задачу как выполненную с прикреплением фотографий.

**Требуется авторизация:** Да

**Роль:** `foreman`

**📍 Фиксирует геолокацию**

**Тело запроса (multipart/form-data):**
- `status`: "completed"
- `comment`: "Работа выполнена"
- `photos`: Файлы изображений (минимум 1)
- `geolocation`: "55.751244,37.618423" (автоматически)

**Ответ (200):**
```json
{
  "message": "Статус задачи обновлен на completed"
}
```

---

### 3.4. Верифицировать задачу

**POST** `/projects/<project_id>/tasks/<task_id>/verify`

Подтверждает или отклоняет выполнение задачи.

**Требуется авторизация:** Да

**Роль:** `client`

**Тело запроса:**
```json
{
  "status": "verified | rejected"
}
```

**Ответ (200):**
```json
{
  "message": "Задача верифицирована"
}
```

---

## 4. Нарушения и замечания

### 4.1. Получить список нарушений

**GET** `/issues`

Возвращает список нарушений и замечаний.

**Требуется авторизация:** Да

**Query параметры:**
- `project_id` (optional): Фильтр по проекту
- `status` (optional): `open | resolved`
- `type` (optional): `violation | remark`

**Ответ (200):**
```json
[
  {
    "id": 1,
    "project_id": 1,
    "type": "violation",
    "author_id": 3,
    "status": "open",
    "description": "Нарушение техники безопасности",
    "classifier_id": 5,
    "due_date": "2025-01-20",
    "geolocation": "55.751244,37.618423",
    "created_at": "2025-01-15T10:00:00"
  }
]
```

---

### 4.2. Создать нарушение/замечание

**POST** `/projects/<project_id>/issues`

Регистрирует новое нарушение или замечание.

**Требуется авторизация:** Да

**Роль:** `client | foreman | inspector`

**📍 Фиксирует геолокацию**

**Тело запроса:**
```json
{
  "type": "violation",
  "description": "Отсутствуют защитные ограждения",
  "classifier_id": 5,
  "due_date": "2025-01-25",
  "geolocation": "55.751244,37.618423"
}
```

**Ответ (201):**
```json
{
  "message": "Нарушение успешно создано",
  "id": 2
}
```

---

### 4.3. Закрыть нарушение

**PATCH** `/issues/<issue_id>`

Закрывает нарушение с комментарием.

**Требуется авторизация:** Да

**Роль:** `foreman`

**Тело запроса:**
```json
{
  "status": "resolved",
  "resolution_comment": "Установлены защитные ограждения"
}
```

**Ответ (200):**
```json
{
  "message": "Нарушение закрыто"
}
```

---

## 5. Документы

### 5.1. Загрузить документ

**POST** `/documents/upload`

Загружает документ (ТТН, акт, и т.д.) в систему.

**Требуется авторизация:** Да

**📍 Фиксирует геолокацию**

**Тело запроса (multipart/form-data):**
- `file`: Файл документа (PDF, JPG, PNG)
- `project_id`: ID проекта
- `file_type`: "ttn | act | certificate | other"
- `geolocation`: "55.751244,37.618423" (автоматически)

**Ответ (201):**
```json
{
  "id": "uuid-123",
  "project_id": 1,
  "uploader_id": 2,
  "file_type": "ttn",
  "url": "/uploads/uuid-123.pdf",
  "recognition_status": "pending",
  "created_at": "2025-01-15T12:00:00"
}
```

---

### 5.2. Распознать документ

**POST** `/documents/recognize`

Запускает распознавание ТТН с помощью AI.

**Требуется авторизация:** Да

**Роль:** `foreman`

**Тело запроса:**
```json
{
  "document_id": "uuid-123"
}
```

**Ответ (200):**
```json
{
  "message": "Распознавание запущено",
  "task_id": "celery-task-id"
}
```

---

### 5.3. Обновить распознанные данные

**PUT** `/documents/<document_id>/data`

Обновляет распознанные данные документа после редактирования.

**Требуется авторизация:** Да

**Роль:** `foreman`

**Тело запроса:**
```json
[
  {
    "document_number": "18674/Б",
    "document_date": "2024-06-10",
    "sender": {
      "name": "ООО Стройматериалы",
      "inn": "7743553262"
    },
    "recipient": {
      "name": "ГБУ Автодороги",
      "inn": "7727656790"
    },
    "items": [
      {
        "name": "Бортовой камень",
        "quantity": 198,
        "unit": "шт"
      }
    ]
  }
]
```

**Ответ (200):**
```json
{
  "message": "Данные документа успешно обновлены"
}
```

---

### 5.4. Удалить документ

**DELETE** `/documents/<document_id>`

Удаляет документ и связанный файл.

**Требуется авторизация:** Да

**Роль:** `foreman | client`

**Ответ (200):**
```json
{
  "message": "Документ успешно удален"
}
```

---

## 6. Ежедневные отчеты

### 6.1. Получить список отчетов

**GET** `/daily-reports`

Возвращает список ежедневных отчетов.

**Требуется авторизация:** Да

**Ответ (200):**
```json
[
  {
    "id": 1,
    "project_id": 1,
    "project_name": "Строительство моста",
    "author_id": 2,
    "author_name": "Петр Петров",
    "report_date": "2025-01-15",
    "workers_count": 15,
    "equipment": "Экскаватор, бетономешалка",
    "weather_conditions": "Ясно, +5°C",
    "notes": "Работы выполнены в срок",
    "geolocation": "55.751244,37.618423",
    "created_at": "2025-01-15T18:00:00"
  }
]
```

---

### 6.2. Создать отчет

**POST** `/daily-reports`

Создает ежедневный отчет о работах.

**Требуется авторизация:** Да

**Роль:** `foreman`

**📍 Фиксирует геолокацию**

**Тело запроса:**
```json
{
  "project_id": 1,
  "report_date": "2025-01-15",
  "workers_count": 15,
  "equipment": "Экскаватор, бетономешалка",
  "weather_conditions": "Ясно, +5°C",
  "notes": "Работы выполнены в срок",
  "geolocation": "55.751244,37.618423"
}
```

**Ответ (201):**
```json
{
  "message": "Ежедневный отчет успешно создан",
  "id": 2
}
```

---

## 7. Поставки материалов

### 7.1. Получить поставки проекта

**GET** `/projects/<project_id>/deliveries`

Возвращает список поставок материалов для проекта.

**Требуется авторизация:** Да

**Ответ (200):**
```json
[
  {
    "id": 1,
    "project_id": 1,
    "document_id": "uuid-123",
    "delivery_date": "2025-01-15",
    "supplier": "ООО Стройматериалы",
    "status": "delivered",
    "items": [
      {
        "material_id": 5,
        "material_name": "Цемент М500",
        "quantity": 100,
        "unit": "т"
      }
    ],
    "created_at": "2025-01-15T10:00:00"
  }
]
```

---

### 7.2. Создать поставку

**POST** `/deliveries`

Регистрирует новую поставку материалов.

**Требуется авторизация:** Да

**Роль:** `foreman`

**Тело запроса:**
```json
{
  "project_id": 1,
  "document_id": "uuid-123",
  "delivery_date": "2025-01-16",
  "supplier": "ООО Бетон плюс",
  "items": [
    {
      "material_id": 3,
      "quantity": 50,
      "unit": "м³"
    }
  ]
}
```

**Ответ (201):**
```json
{
  "message": "Поставка создана",
  "id": 2
}
```

---

### 7.3. Удалить поставку

**DELETE** `/deliveries/<delivery_id>`

Удаляет поставку материалов.

**Требуется авторизация:** Да

**Роль:** `foreman`

**Ответ (200):**
```json
{
  "message": "Поставка успешно удалена"
}
```

---

## 8. Дашборды

### 8.1. Получить данные дашборда

**GET** `/dashboard`

Возвращает агрегированные данные для дашборда в зависимости от роли пользователя.

**Требуется авторизация:** Да

**Ответ (200) для client:**
```json
{
  "projects_count": 5,
  "active_projects": 3,
  "total_tasks": 125,
  "completed_tasks": 80,
  "open_issues": 12,
  "recent_activity": [...]
}
```

**Ответ (200) для foreman:**
```json
{
  "assigned_projects": 2,
  "my_tasks": 15,
  "pending_tasks": 5,
  "completed_today": 3,
  "open_issues": 4
}
```

**Ответ (200) для inspector:**
```json
{
  "inspections_count": 25,
  "violations_found": 8,
  "resolved_violations": 5,
  "pending_inspections": 3
}
```

---

## 9. Карта

### 9.1. Получить данные карты

**GET** `/map`

Возвращает данные всех проектов для отображения на карте.

**Требуется авторизация:** Да

**Ответ (200):**
```json
[
  {
    "id": 1,
    "name": "Строительство моста",
    "address": "г. Москва, ул. Ленина, 1",
    "latitude": 55.751244,
    "longitude": 37.618423,
    "status": "active",
    "polygon": {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [...]
      }
    },
    "tasks_count": 25,
    "issues_count": 3
  }
]
```

---

## 10. Аналитика

### 10.1. Получить статистику проекта

**GET** `/analytics/projects/<project_id>`

Возвращает детальную аналитику по проекту.

**Требуется авторизация:** Да

**Роль:** `client`

**Ответ (200):**
```json
{
  "project_id": 1,
  "tasks_stats": {
    "total": 100,
    "completed": 75,
    "in_progress": 15,
    "pending": 10,
    "completion_rate": 75.0
  },
  "issues_stats": {
    "total": 20,
    "open": 5,
    "resolved": 15,
    "by_type": {
      "violation": 12,
      "remark": 8
    }
  },
  "timeline": [
    {
      "date": "2025-01-01",
      "completed_tasks": 5,
      "new_issues": 2
    }
  ]
}
```

---

## 11. Классификаторы

### 11.1. Получить классификаторы

**GET** `/classifiers`

Возвращает список классификаторов нарушений.

**Требуется авторизация:** Да

**Query параметры:**
- `type` (optional): `violation | remark`

**Ответ (200):**
```json
[
  {
    "id": 1,
    "type": "violation",
    "code": "TB-001",
    "title": "Нарушение техники безопасности",
    "description": "Отсутствие защитных ограждений",
    "is_active": true
  }
]
```

---

### 11.2. Создать классификатор

**POST** `/classifiers`

Создает новый классификатор.

**Требуется авторизация:** Да

**Роль:** `client`

**Тело запроса:**
```json
{
  "type": "violation",
  "code": "KCH-002",
  "title": "Несоответствие качества материалов",
  "description": "Использование материалов, не соответствующих ГОСТ"
}
```

**Ответ (201):**
```json
{
  "message": "Классификатор создан",
  "id": 5
}
```

---

## 12. График работ

### 12.1. Получить график проекта

**GET** `/schedule/<project_id>`

Возвращает график работ проекта в формате временной шкалы.

**Требуется авторизация:** Да

**Ответ (200):**
```json
{
  "project_id": 1,
  "tasks": [
    {
      "id": 1,
      "name": "Земляные работы",
      "start_date": "2025-01-01",
      "end_date": "2025-01-10",
      "status": "completed",
      "dependencies": [],
      "progress": 100
    },
    {
      "id": 2,
      "name": "Заливка фундамента",
      "start_date": "2025-01-11",
      "end_date": "2025-01-20",
      "status": "in_progress",
      "dependencies": [1],
      "progress": 50
    }
  ]
}
```

---

## Коды ошибок

| Код | Описание |
|-----|----------|
| 200 | Успешный запрос |
| 201 | Ресурс успешно создан |
| 400 | Неверный запрос (ошибка валидации) |
| 401 | Не авторизован (отсутствует или неверный токен) |
| 403 | Доступ запрещен (недостаточно прав) |
| 404 | Ресурс не найден |
| 409 | Конфликт (например, дублирование данных) |
| 500 | Внутренняя ошибка сервера |

---

## Примеры использования

### Python (requests)

```python
import requests

BASE_URL = "http://localhost:8501/api"

# Вход
response = requests.post(f"{BASE_URL}/auth/login", json={
    "email": "user@example.com",
    "password": "password123"
})
token = response.json()["access_token"]

# Получение проектов
headers = {"Authorization": f"Bearer {token}"}
projects = requests.get(f"{BASE_URL}/projects", headers=headers).json()

# Создание задачи
task_data = {
    "project_id": 1,
    "name": "Новая задача",
    "start_date": "2025-01-20",
    "end_date": "2025-01-25"
}
response = requests.post(f"{BASE_URL}/tasks", json=task_data, headers=headers)
```

### JavaScript (Axios)

```javascript
import axios from 'axios';

const BASE_URL = 'http://localhost:8501/api';

// Вход
const { data } = await axios.post(`${BASE_URL}/auth/login`, {
  email: 'user@example.com',
  password: 'password123'
});
const token = data.access_token;

// Получение проектов
const projects = await axios.get(`${BASE_URL}/projects`, {
  headers: { Authorization: `Bearer ${token}` }
});

// Создание нарушения с геолокацией
await axios.post(`${BASE_URL}/projects/1/issues`, {
  type: 'violation',
  description: 'Нарушение обнаружено',
  classifier_id: 5,
  geolocation: '55.751244,37.618423'
}, {
  headers: { Authorization: `Bearer ${token}` }
});
```

---

## Особенности

### Геолокация 📍

Следующие эндпоинты автоматически фиксируют геолокацию пользователя:
- Завершение задачи (`PATCH /projects/<id>/tasks/<id>`)
- Создание нарушения (`POST /projects/<id>/issues`)
- Создание ежедневного отчета (`POST /daily-reports`)
- Загрузка документа (`POST /documents/upload`)

Геолокация передается в формате: `"latitude,longitude"` (например: `"55.751244,37.618423"`)

### Роли пользователей

- **client** (Заказчик): Полный доступ к управлению проектами, верификация задач
- **foreman** (Прораб): Управление задачами, создание отчетов, загрузка документов
- **inspector** (Инспектор): Создание нарушений, просмотр отчетов

---

**Версия документации:** 1.0

**Дата обновления:** 2025-01-15

**Контакт:** support@example.com

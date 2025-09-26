# Документация по API

Это подробная документация для API строительного контроля.

## 1. Аутентификация и Пользователи

Эндпоинты для регистрации, входа и управления профилями пользователей.

### `POST /api/register`
- **Описание:** Регистрирует нового пользователя в системе. Доступные роли: `client`, `foreman`, `inspector`.
- **Тело запроса (JSON):**
  ```json
  {
    "email": "foreman@example.com",
    "password": "Password123",
    "role": "foreman"
  }
  ```
- **Ответ (201):**
  ```json
  {
    "message": "Пользователь успешно зарегистрирован",
    "user": {
      "id": 1,
      "email": "foreman@example.com",
      "role": "foreman",
      "full_name": null,
      "is_active": true,
      "created_at": "2025-09-26T10:00:00.123456"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJyb2xlIjoiZm9yZW1hbiIsImV4cCI6MTc1OTA4ODgwMH0.abcdef123456"
  }
  ```

### `POST /api/login`
- **Описание:** Аутентифицирует пользователя и возвращает JWT токен.
- **Тело запроса (JSON):**
  ```json
  {
    "email": "foreman@example.com",
    "password": "Password123"
  }
  ```
- **Ответ (200):**
  ```json
  {
    "message": "Вход выполнен успешно",
    "user": {
      "id": 1,
      "email": "foreman@example.com",
      "role": "foreman",
      "full_name": "Иванов Иван Иванович",
      "is_active": true,
      "created_at": "2025-09-26T10:00:00.123456"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJyb2xlIjoiZm9yZW1hbiIsImV4cCI6MTc1OTA4ODgwMH0.abcdef123456"
  }
  ```

### `POST /api/set-password`
- **Описание:** Устанавливает пароль для пользователя, который был приглашен в систему и еще не имеет пароля.
- **Тело запроса (JSON):**
  ```json
  {
    "token": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "password": "NewSecurePassword123"
  }
  ```
- **Ответ (200):**
  ```json
  {
    "message": "Пароль успешно установлен",
    "user": {
      "id": 2,
      "email": "invited.user@example.com",
      "role": "inspector",
      "full_name": null,
      "is_active": true,
      "created_at": "2025-09-26T11:00:00.123456"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyLCJyb2xlIjoiaW5zcGVjdG9yIiwiZXhwIjoxNzU5MDkyNDAwfQ.fedcba654321"
  }
  ```

### `GET /api/profile`
- **Описание:** Возвращает профиль текущего аутентифицированного пользователя.
- **Заголовки:**
  - `Authorization: Bearer <token>`
- **Тело запроса:** отсутствует.
- **Ответ (200):**
  ```json
  {
    "user": {
      "id": 1,
      "email": "foreman@example.com",
      "role": "foreman",
      "full_name": "Иванов Иван Иванович",
      "is_active": true,
      "created_at": "2025-09-26T10:00:00.123456"
    }
  }
  ```

### `GET /api/verify-token`
- **Описание:** Проверяет валидность текущего JWT токена. Удобно для проверки сессии на стороне клиента.
- **Заголовки:**
  - `Authorization: Bearer <token>`
- **Тело запроса:** отсутствует.
- **Ответ (200):**
  ```json
  {
    "message": "Токен действителен",
    "user": {
      "id": 1,
      "email": "foreman@example.com",
      "role": "foreman",
      "full_name": "Иванов Иван Иванович",
      "is_active": true,
      "created_at": "2025-09-26T10:00:00.123456"
    }
  }
  ```

## 2. Проекты

Эндпоинты для управления строительными проектами.

### `POST /api/projects`
- **Описание:** Создает новый проект. (Требуется роль `client`).
- **Заголовки:**
  - `Authorization: Bearer <token>`
- **Тело запроса (JSON):**
  ```json
  {
    "name": "ЖК 'Солнечный город', Корпус 5",
    "address": "г. Москва, ул. Строителей, д. 12",
    "polygon": {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [37.61729, 55.75582],
            [37.62000, 55.75582],
            [37.62000, 55.75300],
            [37.61729, 55.75300],
            [37.61729, 55.75582]
          ]
        ]
      }
    }
  }
  ```
- **Ответ (201):**
  ```json
  {
    "id": 1,
    "name": "ЖК 'Солнечный город', Корпус 5",
    "address": "г. Москва, ул. Строителей, д. 12",
    "status": "pending",
    "polygon": {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [37.61729, 55.75582],
            [37.62000, 55.75582],
            [37.62000, 55.75300],
            [37.61729, 55.75300],
            [37.61729, 55.75582]
          ]
        ]
      }
    },
    "created_at": "2025-09-26T12:00:00.543210"
  }
  ```

### `GET /api/projects`
- **Описание:** Возвращает список проектов, доступных пользователю. `inspector` видит все проекты, остальные - только свои.
- **Заголовки:**
  - `Authorization: Bearer <token>`
- **Тело запроса:** отсутствует.
- **Ответ (200):**
  ```json
  [
    {
      "id": 1,
      "name": "ЖК 'Солнечный город', Корпус 5",
      "address": "г. Москва, ул. Строителей, д. 12",
      "status": "active",
      "polygon": { "...": "..." },
      "created_at": "2025-09-26T12:00:00.543210"
    },
    {
      "id": 2,
      "name": "Реконструкция школы №15",
      "address": "г. Москва, ул. Школьная, д. 1",
      "status": "pending",
      "polygon": { "...": "..." },
      "created_at": "2025-09-25T15:30:00.987654"
    }
  ]
  ```

### `GET /api/projects/{project_id}`
- **Описание:** Возвращает детальную информацию о проекте.
- **Заголовки:**
  - `Authorization: Bearer <token>`
- **Тело запроса:** отсутствует.
- **Ответ (200):**
  ```json
  {
    "id": 1,
    "name": "ЖК 'Солнечный город', Корпус 5",
    "address": "г. Москва, ул. Строителей, д. 12",
    "status": "active",
    "polygon": { "...": "..." },
    "created_at": "2025-09-26T12:00:00.543210"
  }
  ```

### `POST /api/projects/{project_id}/members`
- **Описание:** Добавляет участника в проект. Если пользователя нет, он создается и ему отправляется приглашение. (Требуется роль `client`).
- **Заголовки:**
  - `Authorization: Bearer <token>`
- **Тело запроса (JSON):**
  ```json
  {
    "email": "new.inspector@example.com",
    "role": "inspector"
  }
  ```
- **Ответ (201):**
  ```json
  {
    "message": "Пользователь создан и приглашен в проект"
  }
  ```

## 3. Рабочие процессы (Workflows)

Эндпоинты, управляющие жизненным циклом проекта и замечаний.

### `POST /api/projects/{project_id}/activate`
- **Описание:** Активирует проект (инициируется `client`-ом).
- **Заголовки:**
  - `Authorization: Bearer <token>`
- **Тело запроса (JSON):** (Может содержать данные чек-листа в будущем)
  ```json
  {}
  ```
- **Ответ (200):**
  ```json
  {
    "message": "Проект активирован и ожидает согласования инспектора"
  }
  ```

### `POST /api/projects/{project_id}/activation/approve`
- **Описание:** Согласовывает активацию проекта (выполняется `inspector`-ом на объекте).
- **Заголовки:**
  - `Authorization: Bearer <token>`
  - `X-User-Geolocation: 55.75582, 37.61729`
- **Тело запроса:** отсутствует.
- **Ответ (200):**
  ```json
  {
    "message": "Активация проекта согласована"
  }
  ```

### `POST /api/projects/{project_id}/issues`
- **Описание:** Создает новое замечание (`remark` от `client`) или нарушение (`violation` от `inspector`).
- **Заголовки:**
  - `Authorization: Bearer <token>`
  - `X-User-Geolocation: 55.75582, 37.61729`
- **Тело запроса (JSON):**
  ```json
  {
    "type": "violation",
    "classifier_id": 101,
    "description": "Отсутствуют ограждения на краю монолитной плиты перекрытия 3-го этажа.",
    "due_date": "2025-10-03",
    "document_ids": [15, 16]
  }
  ```
- **Ответ (201):**
  ```json
  {
    "id": 42,
    "project_id": 1,
    "task_id": null,
    "classifier_id": 101,
    "type": "violation",
    "author_id": 2,
    "status": "open",
    "description": "Отсутствуют ограждения на краю монолитной плиты перекрытия 3-го этажа.",
    "due_date": "2025-10-03",
    "resolution_comment": null,
    "document_ids": [15, 16],
    "created_at": "2025-09-26T14:05:00.123123"
  }
  ```

### `POST /api/issues/{issue_id}/resolve`
- **Описание:** Прораб (`foreman`) отмечает замечание/нарушение как устраненное.
- **Заголовки:**
  - `Authorization: Bearer <token>`
- **Тело запроса (JSON):**
  ```json
  {
    "comment": "Ограждения установлены по всему периметру.",
    "document_ids": [17, 18]
  }
  ```
- **Ответ (200):**
  ```json
  {
    "message": "Отмечено устранение замечания"
  }
  ```

### `POST /api/issues/{issue_id}/review`
- **Описание:** `client` или `inspector` проверяет устраненное замечание.
- **Заголовки:**
  - `Authorization: Bearer <token>`
  - `X-User-Geolocation: 55.75583, 37.61730`
- **Тело запроса (JSON):**
  ```json
  {
    "status": "approved"
  }
  ```
- **Ответ (200):**
  ```json
  {
    "message": "Замечание проверено со статусом approved"
  }
  ```

## 4. График работ

Эндпоинты для управления задачами и графиком проекта.

### `POST /api/projects/{project_id}/schedule`
- **Описание:** Создает или полностью обновляет график работ по проекту (Требуется роль `client`).
- **Заголовки:**
  - `Authorization: Bearer <token>`
- **Тело запроса (JSON):**
  ```json
  [
    {
      "name": "Устройство фундамента",
      "start_date": "2025-10-01",
      "end_date": "2025-10-15",
      "dependencies": []
    },
    {
      "name": "Возведение стен 1-го этажа",
      "start_date": "2025-10-16",
      "end_date": "2025-10-30",
      "dependencies": [1]
    }
  ]
  ```
- **Ответ (201):**
  ```json
  {
    "message": "График работ успешно обновлен"
  }
  ```

### `GET /api/projects/{project_id}/schedule`
- **Описание:** Возвращает график работ (список задач) по проекту.
- **Заголовки:**
  - `Authorization: Bearer <token>`
- **Тело запроса:** отсутствует.
- **Ответ (200):**
  ```json
  [
    {
      "id": 1,
      "project_id": 1,
      "name": "Устройство фундамента",
      "start_date": "2025-10-01",
      "end_date": "2025-10-15",
      "status": "pending",
      "dependencies": [],
      "completed_by": null,
      "verified_by": null,
      "completed_at": null
    },
    {
      "id": 2,
      "project_id": 1,
      "name": "Возведение стен 1-го этажа",
      "start_date": "2025-10-16",
      "end_date": "2025-10-30",
      "status": "pending",
      "dependencies": [1],
      "completed_by": null,
      "verified_by": null,
      "completed_at": null
    }
  ]
  ```

## 5. Ежедневные отчеты

Эндпоинты для создания и получения ежедневных отчетов от прораба/инспектора.

### `POST /api/projects/{project_id}/daily-reports`
- **Описание:** Создает новый ежедневный отчет (роли `inspector`, `foreman`).
- **Заголовки:**
  - `Authorization: Bearer <token>`
- **Тело запроса (JSON):**
  ```json
  {
    "report_date": "2025-09-26",
    "workers_count": 25,
    "equipment": ["Башенный кран", "Бетононасос"],
    "weather_conditions": "Ясно, +15°C, ветер 3 м/с",
    "notes": "Залита плита перекрытия 4-го этажа. Начата кладка наружных стен 2-го этажа."
  }
  ```
- **Ответ (201):**
  ```json
  {
    "message": "Ежедневный отчет успешно создан",
    "daily_report": {
      "id": 1,
      "project_id": 1,
      "author_id": 1,
      "report_date": "2025-09-26",
      "workers_count": 25,
      "equipment": ["Башенный кран", "Бетононасос"],
      "weather_conditions": "Ясно, +15°C, ветер 3 м/с",
      "notes": "Залита плита перекрытия 4-го этажа. Начата кладка наружных стен 2-го этажа.",
      "created_at": "2025-09-26T18:00:00.111222"
    }
  }
  ```

### `GET /api/projects/{project_id}/daily-reports`
- **Описание:** Возвращает список ежедневных отчетов для проекта. Возможна фильтрация по `start_date` и `end_date`.
- **Заголовки:**
  - `Authorization: Bearer <token>`
- **Query параметры:**
  - `start_date=2025-09-01`
  - `end_date=2025-09-30`
- **Тело запроса:** отсутствует.
- **Ответ (200):**
  ```json
  {
    "daily_reports": [
      {
        "id": 1,
        "project_id": 1,
        "author_id": 1,
        "report_date": "2025-09-26",
        "workers_count": 25,
        "equipment": ["Башенный кран", "Бетононасос"],
        "weather_conditions": "Ясно, +15°C, ветер 3 м/с",
        "notes": "Залита плита перекрытия 4-го этажа.",
        "created_at": "2025-09-26T18:00:00.111222"
      }
    ]
  }
  ```

## 6. Лабораторные анализы

Эндпоинты для управления запросами на лабораторный анализ образцов.

### `POST /api/projects/{project_id}/lab-samples`
- **Описание:** Создает новый запрос на лабораторный анализ (роль `inspector`).
- **Заголовки:**
  - `Authorization: Bearer <token>`
- **Тело запроса (JSON):**
  ```json
  {
    "material_name": "Бетон B25, партия 112-А",
    "document_id": 205,
    "notes": "Образец взят из колонны К-12 на 3-м этаже."
  }
  ```
- **Ответ (201):**
  ```json
  {
    "message": "Запрос на отбор проб успешно создан",
    "lab_sample_request": {
      "id": 1,
      "project_id": 1,
      "document_id": 205,
      "initiator_id": 2,
      "material_name": "Бетон B25, партия 112-А",
      "status": "requested",
      "notes": "Образец взят из колонны К-12 на 3-м этаже.",
      "result_document_url": null,
      "created_at": "2025-09-26T15:10:00.334455"
    }
  }
  ```

### `PUT /api/lab-samples/{sample_id}`
- **Описание:** Обновляет статус и данные запроса на анализ (роли `inspector`, `client`).
- **Заголовки:**
  - `Authorization: Bearer <token>`
- **Тело запроса (JSON):**
  ```json
  {
    "status": "passed",
    "result_document_url": "https://storage.example.com/results/lab_result_1.pdf"
  }
  ```
- **Ответ (200):**
  ```json
  {
    "message": "Запрос на отбор проб успешно обновлен",
    "lab_sample_request": {
      "id": 1,
      "project_id": 1,
      "document_id": 205,
      "initiator_id": 2,
      "material_name": "Бетон B25, партия 112-А",
      "status": "passed",
      "notes": "Образец взят из колонны К-12 на 3-м этаже.",
      "result_document_url": "https://storage.example.com/results/lab_result_1.pdf",
      "created_at": "2025-09-26T15:10:00.334455"
    }
  }
  ```

## 7. Распознавание документов (ТТН)

Эндпоинты для автоматического извлечения данных из документов.

### `POST /api/ttn/recognize`
- **Описание:** Распознает данные из файла товарно-транспортной накладной (ТТН).
- **Тело запроса:** `multipart/form-data` с ключом `file`.
- **Ответ (200):**
  ```json
  [
    {
      "document_number": "12345",
      "document_date": "2025-09-26",
      "sender": "ООО 'СтройМатериалПоставка'",
      "recipient": "ООО 'ГлавСтрой'",
      "carrier": "ИП Петров А.А.",
      "shipping_address": "г. Подольск, ул. Заводская, 1",
      "delivery_address": "г. Москва, ул. Строителей, д. 12",
      "driver": {
        "full_name": "Сидоров В.В."
      },
      "vehicle": {
        "registration_plate": "А123БВ777"
      },
      "items": [
        {
          "name": "Блок керамзитобетонный",
          "quantity": 2000,
          "unit": "шт",
          "total_weight_net_kg": 19000,
          "total_weight_gross_kg": 19000,
          "volume_m3": 25
        }
      ]
    }
  ]
  ```

## 8. Панель управления (Dashboard)

Эндпоинты для получения сводной аналитической информации.

### `GET /api/dashboard/summary`
- **Описание:** Возвращает общую сводку для главного дашборда пользователя.
- **Заголовки:**
  - `Authorization: Bearer <token>`
- **Тело запроса:** отсутствует.
- **Ответ (200):**
  ```json
  {
    "projects_total": 10,
    "projects_active": 8,
    "projects_with_overdue_tasks": 2,
    "open_issues_total": 15,
    "open_violations": 4
  }
  ```

### `GET /api/projects/{project_id}/summary`
- **Описание:** Возвращает сводку по конкретному проекту.
- **Заголовки:**
  - `Authorization: Bearer <token>`
- **Тело запроса:** отсутствует.
- **Ответ (200):**
  ```json
  {
    "progress_percentage": 75,
    "tasks_total": 100,
    "tasks_completed": 80,
    "tasks_verified": 75,
    "tasks_overdue": 5,
    "open_issues_count": 3,
    "days_left": 30,
    "materials_pending_lab_test": 2
  }
  ```

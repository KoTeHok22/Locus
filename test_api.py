import requests
import json
import os
import uuid
import time
import random
from pathlib import Path

# --- КОНФИГУРАЦИЯ ---
# Замените на URL вашего запущенного API
BASE_URL = "http://127.0.0.1:5000/api"
# Папка для сохранения результатов
OUTPUT_DIR = Path("api_responses")

# --- Глобальная сессия и хранилище данных ---
session = requests.Session()

# Отключаем использование системных прокси, которые могут мешать
# подключению к локальному серверу и вызывать ошибку "502 Bad Gateway".
session.trust_env = False

# Словарь для хранения данных, полученных в ходе выполнения скрипта
# (токены, ID проектов, задач и т.д.)
test_data_storage = {}

# --- Вспомогательные функции ---

def generate_unique_email(role: str) -> str:
    """Генерирует уникальный email, чтобы избежать конфликтов при повторных запусках."""
    return f"{role}.{uuid.uuid4().hex[:8]}@test.com"

def save_response(response: requests.Response, step_name: str, description: str):
    """
    Сохраняет тело и метаданные ответа API в указанную папку.

    Args:
        response: Объект ответа от requests.
        step_name: Имя папки для сохранения (например, "01_register_client").
        description: Краткое описание шага для файла README.md.
    """
    step_path = OUTPUT_DIR / step_name
    step_path.mkdir(parents=True, exist_ok=True)
    
    # Сохраняем метаданные
    with open(step_path / "metadata.txt", "w", encoding="utf-8") as f:
        f.write(f"URL: {response.request.url}\n")
        f.write(f"Method: {response.request.method}\n")
        f.write(f"Status Code: {response.status_code}\n\n")
        f.write("Headers:\n")
        for key, value in response.headers.items():
            f.write(f"  {key}: {value}\n")

    # Сохраняем тело ответа
    try:
        response_json = response.json()
        with open(step_path / "response.json", "w", encoding="utf-8") as f:
            json.dump(response_json, f, indent=2, ensure_ascii=False)
        print(f"  [ OK ] Ответ сохранен в {step_path}/response.json")
    except json.JSONDecodeError:
        with open(step_path / "response.txt", "w", encoding="utf-8") as f:
            f.write(response.text)
        print(f"  [ OK ] Ответ (не JSON) сохранен в {step_path}/response.txt")
        
    # Создаем README
    with open(step_path / "README.md", "w", encoding="utf-8") as f:
        f.write(f"# Шаг: {step_name}\n\n")
        f.write(f"{description}\n")

def run_test_step(step_number: int, name: str, description: str, method: str, endpoint: str, **kwargs):
    """
    Выполняет один шаг теста: отправляет запрос и сохраняет результат.

    Args:
        step_number: Порядковый номер шага.
        name: Короткое имя шага для папки.
        description: Описание шага.
        method: HTTP метод ('get', 'post', 'patch' и т.д.).
        endpoint: Путь API (например, "/register").
        **kwargs: Дополнительные аргументы для функции requests (json, headers, files).
    """
    step_name = f"{step_number:02d}_{name}"
    print(f"\n--- Шаг {step_number}: {description} ---")
    
    url = f"{BASE_URL}{endpoint}"
    
    try:
        response = session.request(method, url, **kwargs, timeout=10)
        response.raise_for_status()  # Вызовет исключение для кодов 4xx/5xx
        
        save_response(response, step_name, description)
        return response.json()
        
    except requests.exceptions.RequestException as e:
        print(f"  [FAIL] Ошибка на шаге '{step_name}': {e}")
        if e.response is not None:
            save_response(e.response, step_name, f"ОШИБКА: {description}")
        return None

def set_auth_token(token: str):
    """Устанавливает токен авторизации для последующих запросов."""
    if token:
        session.headers.update({"Authorization": f"Bearer {token}"})
        print("  [INFO] Установлен токен авторизации.")
    else:
        if "Authorization" in session.headers:
            del session.headers["Authorization"]
        print("  [INFO] Токен авторизации удален.")

# --- Основной сценарий ---

def main():
    """Главная функция, запускающая тестовый сценарий."""
    if OUTPUT_DIR.exists():
        import shutil
        print(f"Очистка старой папки с результатами: {OUTPUT_DIR}")
        shutil.rmtree(OUTPUT_DIR)
    OUTPUT_DIR.mkdir()

    # 1. Регистрация пользователей
    client_data = {"email": generate_unique_email("client"), "password": "Password123", "role": "client"}
    foreman_data = {"email": generate_unique_email("foreman"), "password": "Password123", "role": "foreman"}
    inspector_data = {"email": generate_unique_email("inspector"), "password": "Password123", "role": "inspector"}

    client_resp = run_test_step(1, "register_client", "Регистрация заказчика (client)", "post", "/register", json=client_data)
    if client_resp: test_data_storage['client'] = client_resp['user']

    foreman_resp = run_test_step(2, "register_foreman", "Регистрация прораба (foreman)", "post", "/register", json=foreman_data)
    if foreman_resp: test_data_storage['foreman'] = foreman_resp['user']
    
    inspector_resp = run_test_step(3, "register_inspector", "Регистрация инспектора (inspector)", "post", "/register", json=inspector_data)
    if inspector_resp: test_data_storage['inspector'] = inspector_resp['user']

    # 2. Вход и создание проекта
    login_resp = run_test_step(4, "login_client", "Вход от имени заказчика", "post", "/login", json={"email": client_data['email'], "password": client_data['password']})
    if not login_resp: return
    
    set_auth_token(login_resp.get("token"))
    
    project_payload = {
        "name": f"Новый ЖК 'Центральный' {uuid.uuid4().hex[:4]}",
        "address": "г. Москва, ул. Тестовая, д. 1",
        "polygon": {"type": "Polygon", "coordinates": [[[37.6, 55.7], [37.7, 55.7], [37.7, 55.6], [37.6, 55.6], [37.6, 55.7]]]}
    }
    project_resp = run_test_step(5, "create_project", "Создание нового проекта", "post", "/projects", json=project_payload)
    if not project_resp: return
    test_data_storage['project_id'] = project_resp['id']
    project_id = test_data_storage['project_id']

    # 3. Добавление участников в проект
    run_test_step(6, "add_foreman_to_project", "Добавление прораба в проект", "post", f"/projects/{project_id}/members", json={"email": foreman_data['email'], "role": "foreman"})
    run_test_step(7, "add_inspector_to_project", "Добавление инспектора в проект", "post", f"/projects/{project_id}/members", json={"email": inspector_data['email'], "role": "inspector"})

    # 4. Создание графика работ
    schedule_payload = [{
        "name": "Устройство фундамента", "start_date": "2025-10-01", "end_date": "2025-10-15",
        "materials": [{"name": "Бетон М300", "quantity": 50, "unit": "м³"}]
    }]
    run_test_step(8, "create_schedule", "Создание графика работ", "post", f"/projects/{project_id}/schedule", json=schedule_payload)

    # Получаем ID созданной задачи
    schedule_list_resp = run_test_step(9, "get_schedule", "Получение списка задач", "get", f"/projects/{project_id}/schedule")
    if not schedule_list_resp or not schedule_list_resp: return
    test_data_storage['task_id'] = schedule_list_resp[0]['id']
    task_id = test_data_storage['task_id']

    # 5. Распознавание ТТН (от имени прораба)
    login_resp_foreman = run_test_step(10, "login_foreman", "Вход от имени прораба", "post", "/login", json={"email": foreman_data['email'], "password": foreman_data['password']})
    if not login_resp_foreman: return
    set_auth_token(login_resp_foreman.get("token"))

    # --- Выбор файла ТТН ---
    ttn_dir = Path("ТТН")
    ttn_files = [f for f in ttn_dir.iterdir() if f.is_file()]
    if not ttn_files:
        print("  [FAIL] Не найдены файлы ТТН в папке 'ТТН'")
        return

    print("  [INFO] Доступные файлы ТТН:")
    for i, f in enumerate(ttn_files):
        print(f"    {i+1}: {f.name}")

    while True:
        try:
            choice = int(input(f"  Введите номер файла для отправки (1-{len(ttn_files)}): "))
            if 1 <= choice <= len(ttn_files):
                selected_ttn_path = ttn_files[choice - 1]
                break
            else:
                print(f"  [ERROR] Неверный номер. Введите число от 1 до {len(ttn_files)}.")
        except ValueError:
            print("  [ERROR] Введите число.")

    print(f"  [INFO] Выбран файл ТТН: {selected_ttn_path.name}")
    
    # Открываем файл и передаем его
    with open(selected_ttn_path, 'rb') as f:
        files = {'file': (selected_ttn_path.name, f.read(), 'application/pdf')}
        form_data = {'project_id': str(project_id), 'task_id': str(task_id)}
        
        run_test_step(11, "recognize_ttn", "Распознавание ТТН", "post", "/ttn/recognize", data=form_data, files=files)

    # # 6. Создание нарушения (от имени инспектора)
    # login_resp_inspector = run_test_step(12, "login_inspector", "Вход от имени инспектора", "post", "/login", json={"email": inspector_data['email'], "password": inspector_data['password']})
    # if not login_resp_inspector: return
    # set_auth_token(login_resp_inspector.get("token"))

    # issue_payload = {"type": "violation", "description": "Отсутствуют защитные каски у рабочих", "task_id": task_id}
    # issue_headers = {"X-User-Geolocation": "55.75,37.61"}
    
    # issue_resp = run_test_step(13, "create_issue", "Создание нарушения инспектором", "post", f"/projects/{project_id}/issues", json=issue_payload, headers=issue_headers)
    # if not issue_resp: return
    # test_data_storage['issue_id'] = issue_resp['id']
    # issue_id = test_data_storage['issue_id']

    # # 7. Попытка закрыть задачу с открытым нарушением (от прораба) -> Ожидаем ошибку
    # set_auth_token(login_resp_foreman.get("token"))
    # print("\n--- Шаг 14: Попытка закрыть задачу с нарушением (ожидается ошибка) ---")
    # try:
    #     url = f"{BASE_URL}/projects/{project_id}/tasks/{task_id}"
    #     response = session.patch(url, json={"status": "completed"}, timeout=10)
    #     # Мы НЕ вызываем raise_for_status, так как ожидаем код 4xx
    #     save_response(response, "14_fail_close_task", "Попытка закрыть задачу с активным нарушением")
    #     if response.status_code == 400:
    #         print("  [ OK ] Сервер вернул ошибку 400, как и ожидалось.")
    #     else:
    #         print(f"  [FAIL] Сервер вернул код {response.status_code}, хотя ожидался 400.")
    # except requests.exceptions.RequestException as e:
    #     print(f"  [FAIL] Ошибка на шаге 14: {e}")

    # # 8. Устранение и проверка нарушения
    # run_test_step(15, "resolve_issue", "Прораб устраняет нарушение", "post", f"/issues/{issue_id}/resolve", json={"comment": "Каски выданы"})
    
    # set_auth_token(login_resp_inspector.get("token")) # Снова инспектор
    # run_test_step(16, "review_issue", "Инспектор проверяет устранение", "post", f"/issues/{issue_id}/review", json={"status": "approved"}, headers=issue_headers)

    # # 9. Успешное закрытие задачи (от прораба)
    # set_auth_token(login_resp_foreman.get("token")) # Снова прораб
    # run_test_step(17, "close_task_success", "Успешное закрытие задачи", "patch", f"/projects/{project_id}/tasks/{task_id}", json={"status": "completed"})

    # # 10. Получение аналитики (от заказчика)
    # set_auth_token(login_resp.get("token")) # Снова заказчик
    # run_test_step(18, "get_project_summary", "Получение сводки по проекту", "get", f"/projects/{project_id}/summary")
    # run_test_step(19, "get_risk_assessment", "Получение оценки рисков проекта", "get", f"/projects/{project_id}/risk_assessment")
    # run_test_step(20, "get_dashboard_summary", "Получение сводки для дашборда", "get", "/dashboard/summary")
    
    print("\n--- Тестовый прогон завершен! ---")
    print(f"Все ответы сохранены в папку: {OUTPUT_DIR.absolute()}")

if __name__ == "__main__":
    main()


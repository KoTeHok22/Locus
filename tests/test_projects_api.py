
import pytest
from main import create_app
from models import db, User, Project, ProjectUser

# --- Фикстура для создания тестового приложения и клиента ---
@pytest.fixture(scope='module')
def test_client():
    """Создает тестовый клиент Flask для каждого модуля тестов."""
    app, _ = create_app({
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
        'JWT_SECRET_KEY': 'test-secret-key'
    })

    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            # Создаем пользователей и проекты для тестов
            setup_database()
        yield client

# --- Вспомогательная функция для наполнения БД ---
def setup_database():
    """Создает начальные данные в тестовой БД."""
    # Пользователи
    client_user = User(id=1, email='client@test.com', role='client', password_hash='...')
    foreman_user = User(id=2, email='foreman@test.com', role='foreman', password_hash='...')
    inspector_user = User(id=3, email='inspector@test.com', role='inspector', password_hash='...')
    
    # Проекты
    project1 = Project(id=1, name='Project Alpha')
    project2 = Project(id=2, name='Project Beta')
    project3 = Project(id=3, name='Project Gamma')

    # Связи пользователей с проектами
    # client_user состоит в проекте 1
    # foreman_user состоит в проекте 2
    link1 = ProjectUser(user_id=1, project_id=1)
    link2 = ProjectUser(user_id=2, project_id=2)

    db.session.add_all([client_user, foreman_user, inspector_user, project1, project2, project3, link1, link2])
    db.session.commit()

# --- Вспомогательная функция для получения токена ---
# NOTE: В реальном проекте здесь будет вызов auth.login, но для простоты мы мокаем генерацию токена
from flask_jwt_extended import create_access_token

def get_auth_headers(user_id, role):
    """Создает заголовок авторизации для указанного пользователя."""
    identity = {'id': user_id, 'role': role}
    token = create_access_token(identity=identity)
    return {'Authorization': f'Bearer {token}'}

# --- Тесты для API проектов ---

def test_get_projects_as_inspector(test_client):
    """Тест: Инспектор должен видеть ВСЕ проекты."""
    headers = get_auth_headers(user_id=3, role='inspector')
    response = test_client.get('/api/projects', headers=headers)
    assert response.status_code == 200
    data = response.get_json()
    assert len(data) == 3 # Инспектор видит все 3 проекта
    assert {p['name'] for p in data} == {'Project Alpha', 'Project Beta', 'Project Gamma'}

def test_get_projects_as_client(test_client):
    """Тест: Заказчик (client) должен видеть ТОЛЬКО СВОИ проекты."""
    headers = get_auth_headers(user_id=1, role='client')
    response = test_client.get('/api/projects', headers=headers)
    assert response.status_code == 200
    data = response.get_json()
    assert len(data) == 1 # Заказчик видит только 1 свой проект
    assert data[0]['name'] == 'Project Alpha'

def test_get_projects_as_foreman(test_client):
    """Тест: Прораб (foreman) должен видеть ТОЛЬКО СВОИ проекты."""
    headers = get_auth_headers(user_id=2, role='foreman')
    response = test_client.get('/api/projects', headers=headers)
    assert response.status_code == 200
    data = response.get_json()
    assert len(data) == 1 # Прораб видит только 1 свой проект
    assert data[0]['name'] == 'Project Beta'

def test_get_projects_unauthorized(test_client):
    """Тест: Неавторизованный пользователь не должен видеть проекты."""
    response = test_client.get('/api/projects')
    assert response.status_code == 401 # Unauthorized

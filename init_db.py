import os
import sys
from datetime import date, timedelta
from dotenv import load_dotenv

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

from main import create_app
from models import db, User, Project, ProjectUser, Classifier, Task, Issue
from auth import hash_password

def create_fixtures():
    """
    Удаляет все данные из БД, создает таблицы и наполняет их
    тестовыми данными (пользователи, проекты, классификаторы, задачи, нарушения).
    """
    app, _ = create_app()
    with app.app_context():
        print("Удаление старых таблиц...")
        db.drop_all()
        print("Создание новых таблиц...")
        db.create_all()
        print("Таблицы успешно созданы.")

        print("Создание тестовых пользователей...")
        try:
            hashed_password = hash_password('Password123')

            client = User(
                email='client@example.com',
                password_hash=hashed_password,
                role='client',
                first_name='Петр',
                last_name='Заказчиков',
                is_active=True
            )
            foreman = User(
                email='foreman@example.com',
                password_hash=hashed_password,
                role='foreman',
                first_name='Иван',
                last_name='Прорабов',
                is_active=True
            )
            inspector = User(
                email='inspector@example.com',
                password_hash=hashed_password,
                role='inspector',
                first_name='Сергей',
                last_name='Инспекторов',
                is_active=True
            )
            db.session.add_all([client, foreman, inspector])
            db.session.flush()
            print("Пользователи созданы.")

            print("Создание классификаторов нарушений...")
            violation_classifiers = [
                Classifier(type='violation', code='TB-01', title='Нарушение техники безопасности'),
                Classifier(type='violation', code='PR-01', title='Отклонение от проектной документации'),
                Classifier(type='violation', code='QL-01', title='Неудовлетворительное качество работ'),
                Classifier(type='violation', code='ST-01', title='Неправильное складирование материалов'),
                Classifier(type='violation', code='DC-01', title='Отсутствие исполнительной документации')
            ]
            db.session.add_all(violation_classifiers)
            db.session.flush()
            tb_classifier_id = violation_classifiers[0].id
            print("Классификаторы созданы.")

            print("Создание тестовых проектов...")
            project1 = Project(
                name="ЖК 'Солнечный город', Корпус 5",
                address="г. Москва, ул. Строителей, д. 12",
                status="active",
                latitude=55.689486,
                longitude=37.531523
            )
            project2 = Project(
                name="Реконструкция школы №15",
                address="г. Москва, ул. Школьная, д. 1",
                status="pending",
                latitude=55.745656,
                longitude=37.670672
            )
            db.session.add_all([project1, project2])
            db.session.flush()
            print("Проекты созданы.")

            print("Привязка пользователей к проектам...")
            db.session.add_all([
                ProjectUser(project_id=project1.id, user_id=client.id),
                ProjectUser(project_id=project2.id, user_id=client.id),
                ProjectUser(project_id=project1.id, user_id=inspector.id),
                ProjectUser(project_id=project2.id, user_id=inspector.id),
                ProjectUser(project_id=project1.id, user_id=foreman.id)
            ])
            print("Пользователи привязаны к проектам.")

            print("Создание демонстрационных задач...")
            today = date.today()
            tasks = [
                Task(
                    project_id=project1.id, 
                    name="Устройство фундамента", 
                    start_date=today - timedelta(days=20), 
                    end_date=today - timedelta(days=5), 
                    status='verified', 
                    completed_by_id=foreman.id, 
                    verified_by_id=inspector.id,
                    completion_comment="Фундамент залит согласно проектной документации. Бетон марки М300.",
                    completion_photos=[]
                ),
                Task(
                    project_id=project1.id, 
                    name="Возведение стен 1-го этажа", 
                    start_date=today - timedelta(days=4), 
                    end_date=today + timedelta(days=10), 
                    status='completed', 
                    completed_by_id=foreman.id,
                    completion_comment="Стены первого этажа возведены. Использовался кирпич керамический полнотелый М150.",
                    completion_photos=[]
                ),
                Task(
                    project_id=project1.id, 
                    name="Монтаж окон", 
                    start_date=today, 
                    end_date=today + timedelta(days=15), 
                    status='pending'
                )
            ]
            db.session.add_all(tasks)
            print("Задачи созданы.")

            print("Создание демонстрационных нарушений...")
            issues = [
                # Открытое нарушение - требует устранения прорабом
                Issue(
                    project_id=project1.id, 
                    author_id=inspector.id, 
                    type='violation', 
                    classifier_id=tb_classifier_id, 
                    description="Отсутствуют ограждения на краю монолитной плиты перекрытия 3-го этажа.", 
                    status='open', 
                    due_date=today + timedelta(days=3)
                ),
                # Замечание от заказчика
                Issue(
                    project_id=project2.id, 
                    author_id=client.id, 
                    type='remark', 
                    description="Необходимо ускорить темпы работ по благоустройству.", 
                    status='open'
                ),
                # Нарушение устранено прорабом, ожидает верификации инспектором
                Issue(
                    project_id=project1.id,
                    author_id=inspector.id,
                    type='violation',
                    classifier_id=violation_classifiers[2].id,  # Качество работ
                    description="Обнаружены трещины в штукатурке на стене в помещении 205",
                    status='pending_verification',
                    due_date=today + timedelta(days=5),
                    resolved_by_id=foreman.id,
                    resolution_comment="Трещины заделаны, штукатурка восстановлена. Использована цементно-песчаная смесь М150.",
                    resolution_photos=["/uploads/issue_photos/example_resolution_1.jpg", "/uploads/issue_photos/example_resolution_2.jpg"]
                ),
                # Устраненное и подтвержденное нарушение
                Issue(
                    project_id=project1.id,
                    author_id=inspector.id,
                    type='violation',
                    classifier_id=violation_classifiers[3].id,  # Складирование материалов
                    description="Материалы складированы с нарушением требований ТБ, перекрыт проход",
                    status='resolved',
                    due_date=today - timedelta(days=1),
                    resolved_by_id=foreman.id,
                    resolution_comment="Материалы перемещены в специально отведенное место. Проход освобожден.",
                    resolution_photos=["/uploads/issue_photos/example_storage_fixed.jpg"],
                    verified_by_id=inspector.id,
                    verification_status='verified',
                    verification_comment="Устранение подтверждено. Материалы размещены правильно."
                ),
                # Нарушение с отклоненной верификацией
                Issue(
                    project_id=project1.id,
                    author_id=inspector.id,
                    type='violation',
                    classifier_id=violation_classifiers[4].id,  # Документация
                    description="Не предоставлены акты скрытых работ по устройству фундамента",
                    status='open',
                    due_date=today + timedelta(days=2)
                )
            ]
            db.session.add_all(issues)
            print("Нарушения созданы (включая примеры устранения и верификации).")

            db.session.commit()
            print("Фикстуры успешно созданы!")

        except Exception as e:
            print(f"Произошла ошибка при создании фикстур: {e}")
            db.session.rollback()

if __name__ == '__main__':
    create_fixtures()

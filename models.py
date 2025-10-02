from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timezone

db = SQLAlchemy()


class Material(db.Model):
    """Справочник строительных материалов."""
    __tablename__ = 'materials'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False, unique=True)
    unit = db.Column(db.String(50), nullable=False)

class Classifier(db.Model):
    """Модель классификатора для замечаний и нарушений."""
    __tablename__ = 'classifiers'
    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(20), nullable=False)
    code = db.Column(db.String(50), nullable=False, unique=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'type': self.type,
            'code': self.code,
            'title': self.title,
            'description': self.description,
            'is_active': self.is_active
        }

class Checklist(db.Model):
    """Модель чек-листа для задач или инспекций."""
    __tablename__ = 'checklists'
    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(50), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    items = db.relationship('ChecklistItem', back_populates='checklist', cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'type': self.type,
            'name': self.name,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'items': [item.to_dict() for item in self.items]
        }

class ChecklistItem(db.Model):
    """Элемент чек-листа."""
    __tablename__ = 'checklist_items'
    id = db.Column(db.Integer, primary_key=True)
    checklist_id = db.Column(db.Integer, db.ForeignKey('checklists.id'), nullable=False)
    text = db.Column(db.Text, nullable=False)
    is_required = db.Column(db.Boolean, default=True, nullable=False)
    order = db.Column(db.Integer, default=0, nullable=False)
    
    checklist = db.relationship('Checklist', back_populates='items')

    def to_dict(self):
        return {
            'id': self.id,
            'checklist_id': self.checklist_id,
            'text': self.text,
            'is_required': self.is_required,
            'order': self.order
        }


class User(db.Model):
    """Модель пользователя системы."""
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=True)
    role = db.Column(db.String(20), nullable=False)
    first_name = db.Column(db.String(100), nullable=True)
    last_name = db.Column(db.String(100), nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    is_active = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    
    invitation_token = db.Column(db.String(255), unique=True, nullable=True)
    invitation_token_expires = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'role': self.role,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'phone': self.phone,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat()
        }

class Project(db.Model):
    """Модель строительного проекта."""
    __tablename__ = 'projects'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    address = db.Column(db.String(500), nullable=True)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    status = db.Column(db.String(50), nullable=False, default='pending')
    polygon = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    
    members = db.relationship('ProjectUser', back_populates='project', cascade="all, delete-orphan")
    tasks = db.relationship('Task', back_populates='project', cascade="all, delete-orphan")
    documents = db.relationship('Document', back_populates='project', cascade="all, delete-orphan")
    issues = db.relationship('Issue', back_populates='project', cascade="all, delete-orphan")
    daily_reports = db.relationship('DailyReport', back_populates='project', cascade="all, delete-orphan")
    material_deliveries = db.relationship('MaterialDelivery', back_populates='project', cascade="all, delete-orphan")

class Task(db.Model):
    """Модель задачи в графике работ проекта."""
    __tablename__ = 'tasks'
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(50), nullable=False, default='pending')
    
    completed_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    verified_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    completed_at = db.Column(db.DateTime, nullable=True)
    completion_comment = db.Column(db.Text, nullable=True)
    completion_photos = db.Column(db.JSON, nullable=True)
    completion_geolocation = db.Column(db.String(100), nullable=True)
    
    project = db.relationship('Project', back_populates='tasks')
    completed_by = db.relationship('User', foreign_keys=[completed_by_id])
    verified_by = db.relationship('User', foreign_keys=[verified_by_id])
    
    dependencies = db.relationship('Task',
                               secondary='task_dependencies',
                               primaryjoin='Task.id==task_dependencies.c.task_id',
                               secondaryjoin='Task.id==task_dependencies.c.depends_on_id',
                               backref='dependents')

class Document(db.Model):
    """Модель документа, прикрепленного к проекту или другой сущности."""
    __tablename__ = 'documents'
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    uploader_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    file_type = db.Column(db.String(50), nullable=False)
    url = db.Column(db.String(500), nullable=False)
    
    recognized_data = db.Column(db.JSON, nullable=True)
    recognition_status = db.Column(db.String(50), nullable=False, default='pending')
    upload_geolocation = db.Column(db.String(100), nullable=True)
    
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    project = db.relationship('Project', back_populates='documents')
    uploader = db.relationship('User')

    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'uploader_id': self.uploader_id,
            'file_type': self.file_type,
            'url': self.url,
            'recognized_data': self.recognized_data,
            'recognition_status': self.recognition_status,
            'created_at': self.created_at.isoformat()
        }

class Issue(db.Model):
    """Модель замечания или нарушения."""
    __tablename__ = 'issues'
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    task_id = db.Column(db.Integer, db.ForeignKey('tasks.id'), nullable=True)
    classifier_id = db.Column(db.Integer, db.ForeignKey('classifiers.id'), nullable=True)
    type = db.Column(db.String(50), nullable=False)
    author_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    status = db.Column(db.String(50), default='open')
    description = db.Column(db.Text, nullable=False)
    due_date = db.Column(db.Date, nullable=True)
    
    resolution_comment = db.Column(db.Text, nullable=True)
    resolved_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    resolved_at = db.Column(db.DateTime, nullable=True)
    geolocation = db.Column(db.String(100), nullable=True)
    
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    project = db.relationship('Project', back_populates='issues')
    task = db.relationship('Task', backref='issues')
    author = db.relationship('User', foreign_keys=[author_id])
    resolved_by = db.relationship('User', foreign_keys=[resolved_by_id])
    classifier = db.relationship('Classifier')
    
    documents = db.relationship('Document', secondary='issue_documents', backref='issues')

    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'task_id': self.task_id,
            'classifier_id': self.classifier_id,
            'type': self.type,
            'author_id': self.author_id,
            'status': self.status,
            'description': self.description,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'resolution_comment': self.resolution_comment,
            'resolved_by_id': self.resolved_by_id,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
            'created_at': self.created_at.isoformat()
        }

class DailyReport(db.Model):
    """Модель ежедневного отчета."""
    __tablename__ = 'daily_reports'
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    author_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    report_date = db.Column(db.Date, nullable=False)
    workers_count = db.Column(db.Integer, nullable=True)
    equipment = db.Column(db.Text, nullable=True)
    weather_conditions = db.Column(db.Text, nullable=True)
    notes = db.Column(db.Text, nullable=True)
    geolocation = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    
    author = db.relationship('User', backref='daily_reports')
    project = db.relationship('Project', back_populates='daily_reports')

class MaterialDelivery(db.Model):
    """Модель факта поставки материалов на объект."""
    __tablename__ = 'material_deliveries'
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    document_id = db.Column(db.Integer, db.ForeignKey('documents.id'), nullable=True)
    foreman_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    delivery_date = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    
    project = db.relationship('Project', back_populates='material_deliveries')
    document = db.relationship('Document')
    foreman = db.relationship('User')
    items = db.relationship('MaterialDeliveryItem', back_populates='delivery', cascade="all, delete-orphan")

class MaterialDeliveryItem(db.Model):
    """Позиция в поставке материалов."""
    __tablename__ = 'material_delivery_items'
    id = db.Column(db.Integer, primary_key=True)
    delivery_id = db.Column(db.Integer, db.ForeignKey('material_deliveries.id'), nullable=False)
    material_id = db.Column(db.Integer, db.ForeignKey('materials.id'), nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    
    delivery = db.relationship('MaterialDelivery', back_populates='items')
    material = db.relationship('Material')


class ProjectUser(db.Model):
    """Связь: Пользователь <-> Проект."""
    __tablename__ = 'project_users'
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), primary_key=True)
    
    project = db.relationship('Project', back_populates='members')
    user = db.relationship('User', backref='projects')

task_dependencies = db.Table('task_dependencies', db.metadata,
    db.Column('task_id', db.Integer, db.ForeignKey('tasks.id'), primary_key=True),
    db.Column('depends_on_id', db.Integer, db.ForeignKey('tasks.id'), primary_key=True)
)

class TaskMaterial(db.Model):
    """Связь: Задача <-> Материал (плановые материалы для задачи)."""
    __tablename__ = 'task_materials'
    task_id = db.Column(db.Integer, db.ForeignKey('tasks.id'), primary_key=True)
    material_id = db.Column(db.Integer, db.ForeignKey('materials.id'), primary_key=True)
    quantity = db.Column(db.Float, nullable=False)
    
    task = db.relationship('Task', backref=db.backref('planned_materials', cascade="all, delete-orphan"))
    material = db.relationship('Material')

issue_documents = db.Table('issue_documents', db.metadata,
    db.Column('issue_id', db.Integer, db.ForeignKey('issues.id'), primary_key=True),
    db.Column('document_id', db.Integer, db.ForeignKey('documents.id'), primary_key=True)
)


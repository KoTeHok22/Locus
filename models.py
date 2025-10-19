from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timezone

db = SQLAlchemy()


class Material(db.Model):
    """Справочник строительных материалов."""
    __tablename__ = 'materials'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False, unique=True)
    unit = db.Column(db.String(50), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'unit': self.unit
        }

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
    description = db.Column(db.Text, nullable=True)
    requires_approval = db.Column(db.Boolean, default=False, nullable=False)
    requires_initialization = db.Column(db.Boolean, default=False, nullable=False)
    allows_partial_completion = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    items = db.relationship('ChecklistItem', back_populates='checklist', cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'type': self.type,
            'name': self.name,
            'description': self.description,
            'requires_approval': self.requires_approval,
            'requires_initialization': self.requires_initialization,
            'allows_partial_completion': self.allows_partial_completion,
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
    category = db.Column(db.String(100), nullable=True)
    is_required = db.Column(db.Boolean, default=True, nullable=False)
    allows_not_applicable = db.Column(db.Boolean, default=True, nullable=False)
    order = db.Column(db.Integer, default=0, nullable=False)
    
    checklist = db.relationship('Checklist', back_populates='items')

    def to_dict(self):
        return {
            'id': self.id,
            'checklist_id': self.checklist_id,
            'text': self.text,
            'category': self.category,
            'is_required': self.is_required,
            'allows_not_applicable': self.allows_not_applicable,
            'order': self.order
        }


class ChecklistItemResponse(db.Model):
    """Ответ на пункт чек-листа: ДА, НЕТ, Не требуется."""
    __tablename__ = 'checklist_item_responses'
    id = db.Column(db.Integer, primary_key=True)
    completion_id = db.Column(db.Integer, db.ForeignKey('checklist_completions.id'), nullable=False)
    item_id = db.Column(db.Integer, db.ForeignKey('checklist_items.id'), nullable=False)
    response = db.Column(db.String(20), nullable=False)
    issue_id = db.Column(db.Integer, db.ForeignKey('issues.id'), nullable=True)
    photos = db.Column(db.JSON, nullable=True)
    comment = db.Column(db.Text, nullable=True)
    geolocation = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    
    completion = db.relationship('ChecklistCompletion', back_populates='item_responses')
    item = db.relationship('ChecklistItem')
    issue = db.relationship('Issue')

    def to_dict(self):
        return {
            'id': self.id,
            'completion_id': self.completion_id,
            'item_id': self.item_id,
            'response': self.response,
            'issue_id': self.issue_id,
            'photos': self.photos or [],
            'comment': self.comment,
            'geolocation': self.geolocation,
            'created_at': self.created_at.isoformat()
        }


class ChecklistCompletion(db.Model):
    """Модель для сохранения заполненных чек-листов."""
    __tablename__ = 'checklist_completions'
    id = db.Column(db.Integer, primary_key=True)
    checklist_id = db.Column(db.Integer, db.ForeignKey('checklists.id'), nullable=False)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    completed_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    completion_date = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    items_data = db.Column(db.JSON, nullable=False)
    photos = db.Column(db.JSON, nullable=True)
    geolocation = db.Column(db.String(100), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    
    approval_status = db.Column(db.String(50), default='pending', nullable=False)
    approved_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    approved_at = db.Column(db.DateTime, nullable=True)
    rejection_reason = db.Column(db.Text, nullable=True)
    attached_document = db.Column(db.String(500), nullable=True)
    
    initialization_required = db.Column(db.Boolean, default=False, nullable=False)
    initialized_at = db.Column(db.DateTime, nullable=True)
    initialization_geolocation = db.Column(db.String(100), nullable=True)
    
    checklist = db.relationship('Checklist')
    project = db.relationship('Project')
    completed_by = db.relationship('User', foreign_keys=[completed_by_id])
    approved_by = db.relationship('User', foreign_keys=[approved_by_id])
    item_responses = db.relationship('ChecklistItemResponse', back_populates='completion', cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'checklist_id': self.checklist_id,
            'project_id': self.project_id,
            'completed_by_id': self.completed_by_id,
            'completion_date': self.completion_date.isoformat(),
            'items_data': self.items_data,
            'photos': self.photos or [],
            'geolocation': self.geolocation,
            'notes': self.notes,
            'approval_status': self.approval_status,
            'approved_by_id': self.approved_by_id,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'rejection_reason': self.rejection_reason,
            'attached_document': self.attached_document,
            'initialization_required': self.initialization_required,
            'initialized_at': self.initialized_at.isoformat() if self.initialized_at else None,
            'initialization_geolocation': self.initialization_geolocation
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


class Notification(db.Model):
    __tablename__ = 'notifications'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    message = db.Column(db.Text, nullable=False)
    link = db.Column(db.String(500), nullable=True)
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    
    user = db.relationship('User', backref='notifications')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'message': self.message,
            'link': self.link,
            'is_read': self.is_read,
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
    risk_score = db.Column(db.Integer, nullable=False, default=0)
    risk_level = db.Column(db.String(20), nullable=False, default='LOW')
    risk_breakdown = db.Column(db.JSON, nullable=True, default=dict)
    
    members = db.relationship('ProjectUser', back_populates='project', cascade="all, delete-orphan")
    tasks = db.relationship('Task', back_populates='project', cascade="all, delete-orphan")
    documents = db.relationship('Document', back_populates='project', cascade="all, delete-orphan")
    issues = db.relationship('Issue', back_populates='project', cascade="all, delete-orphan")
    daily_reports = db.relationship('DailyReport', back_populates='project', cascade="all, delete-orphan")
    material_deliveries = db.relationship('MaterialDelivery', back_populates='project', cascade="all, delete-orphan")
    work_plan = db.relationship('WorkPlan', back_populates='project', uselist=False, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'address': self.address,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'status': self.status,
            'polygon': self.polygon,
            'created_at': self.created_at.isoformat(),
            'risk_score': self.risk_score,
            'risk_level': self.risk_level,
            'risk_factors': self.risk_factors
        }

class Task(db.Model):
    """Модель задачи в графике работ проекта."""
    __tablename__ = 'tasks'
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    work_plan_item_id = db.Column(db.Integer, db.ForeignKey('work_plan_items.id'), nullable=False)
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
    actual_quantity = db.Column(db.Float, nullable=True)
    
    project = db.relationship('Project', back_populates='tasks')
    work_plan_item = db.relationship('WorkPlanItem')
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
    resolution_photos = db.Column(db.JSON, nullable=True)
    resolved_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    resolved_at = db.Column(db.DateTime, nullable=True)
    geolocation = db.Column(db.String(100), nullable=True)
    
    verified_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    verified_at = db.Column(db.DateTime, nullable=True)
    verification_status = db.Column(db.String(50), nullable=True)
    verification_comment = db.Column(db.Text, nullable=True)
    
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    project = db.relationship('Project', back_populates='issues')
    task = db.relationship('Task', backref='issues')
    author = db.relationship('User', foreign_keys=[author_id])
    resolved_by = db.relationship('User', foreign_keys=[resolved_by_id])
    verified_by = db.relationship('User', foreign_keys=[verified_by_id])
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
    report_date = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
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
    validation_status = db.Column(db.String(50), nullable=True, default='pending')
    
    project = db.relationship('Project', back_populates='material_deliveries')
    document = db.relationship('Document')
    foreman = db.relationship('User')
    items = db.relationship('MaterialDeliveryItem', back_populates='delivery', cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'document_id': self.document_id,
            'foreman_id': self.foreman_id,
            'delivery_date': self.delivery_date.isoformat(),
            'items': [item.to_dict() for item in self.items]
        }

class MaterialDeliveryItem(db.Model):
    """Позиция в поставке материалов."""
    __tablename__ = 'material_delivery_items'
    id = db.Column(db.Integer, primary_key=True)
    delivery_id = db.Column(db.Integer, db.ForeignKey('material_deliveries.id'), nullable=False)
    material_id = db.Column(db.Integer, db.ForeignKey('materials.id'), nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    
    delivery = db.relationship('MaterialDelivery', back_populates='items')
    material = db.relationship('Material')

    def to_dict(self):
        return {
            'id': self.id,
            'delivery_id': self.delivery_id,
            'material_id': self.material_id,
            'material_name': self.material.name if self.material else None,
            'quantity': self.quantity
        }


class WorkPlan(db.Model):
    """Модель плана работ по проекту."""
    __tablename__ = 'work_plans'
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False, unique=True)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    editing_status = db.Column(db.String(50), nullable=False, default='original')
    
    project = db.relationship('Project', back_populates='work_plan')
    items = db.relationship('WorkPlanItem', back_populates='work_plan', cascade="all, delete-orphan", order_by='WorkPlanItem.order')

    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'start_date': self.start_date.isoformat(),
            'end_date': self.end_date.isoformat(),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'editing_status': self.editing_status,
            'items': [item.to_dict() for item in self.items]
        }


class WorkPlanItem(db.Model):
    """Элемент плана работ (конкретная работа)."""
    __tablename__ = 'work_plan_items'
    id = db.Column(db.Integer, primary_key=True)
    work_plan_id = db.Column(db.Integer, db.ForeignKey('work_plans.id'), nullable=False)
    name = db.Column(db.String(500), nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(50), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    order = db.Column(db.Integer, default=0, nullable=False)
    status = db.Column(db.String(50), nullable=False, default='not_started')
    progress = db.Column(db.Float, nullable=False, default=0.0)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    work_plan = db.relationship('WorkPlan', back_populates='items')
    required_materials = db.relationship('RequiredMaterial', back_populates='work_item', cascade="all, delete-orphan")
    consumption_logs = db.relationship('ConsumptionLog', back_populates='work_item', cascade="all, delete-orphan")

    def to_dict(self, include_materials=False):
        actual_quantity = 0.0
        tasks = Task.query.filter_by(work_plan_item_id=self.id).all()
        for task in tasks:
            if task.actual_quantity:
                actual_quantity += task.actual_quantity
        
        result = {
            'id': self.id,
            'work_plan_id': self.work_plan_id,
            'name': self.name,
            'quantity': self.quantity,
            'unit': self.unit,
            'start_date': self.start_date.isoformat(),
            'end_date': self.end_date.isoformat(),
            'order': self.order,
            'status': self.status,
            'progress': self.progress,
            'actual_quantity': actual_quantity,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        if include_materials:
            result['required_materials'] = [rm.to_dict() for rm in self.required_materials]
        return result


class RequiredMaterial(db.Model):
    """Плановая потребность в материалах для задачи плана работ."""
    __tablename__ = 'required_materials'
    id = db.Column(db.Integer, primary_key=True)
    work_item_id = db.Column(db.Integer, db.ForeignKey('work_plan_items.id'), nullable=False)
    material_id = db.Column(db.Integer, db.ForeignKey('materials.id'), nullable=False)
    planned_quantity = db.Column(db.Float, nullable=False)
    
    work_item = db.relationship('WorkPlanItem', back_populates='required_materials')
    material = db.relationship('Material')

    def to_dict(self):
        return {
            'id': self.id,
            'work_item_id': self.work_item_id,
            'material_id': self.material_id,
            'material_name': self.material.name if self.material else None,
            'material_unit': self.material.unit if self.material else None,
            'planned_quantity': self.planned_quantity
        }


class ConsumptionLog(db.Model):
    """Журнал расхода материалов при выполнении работ."""
    __tablename__ = 'consumption_logs'
    id = db.Column(db.Integer, primary_key=True)
    work_item_id = db.Column(db.Integer, db.ForeignKey('work_plan_items.id'), nullable=False)
    material_id = db.Column(db.Integer, db.ForeignKey('materials.id'), nullable=False)
    quantity_used = db.Column(db.Float, nullable=False)
    consumption_date = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    foreman_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    work_item = db.relationship('WorkPlanItem', back_populates='consumption_logs')
    material = db.relationship('Material')
    foreman = db.relationship('User')

    def to_dict(self):
        return {
            'id': self.id,
            'work_item_id': self.work_item_id,
            'material_id': self.material_id,
            'material_name': self.material.name if self.material else None,
            'quantity_used': self.quantity_used,
            'consumption_date': self.consumption_date.isoformat(),
            'foreman_id': self.foreman_id
        }


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


class TaskMaterialUsage(db.Model):
    """Фактическое использование материалов при выполнении задачи."""
    __tablename__ = 'task_material_usage'
    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey('tasks.id'), nullable=False)
    material_id = db.Column(db.Integer, db.ForeignKey('materials.id'), nullable=False)
    quantity_used = db.Column(db.Float, nullable=False)
    recorded_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    recorded_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    task = db.relationship('Task', backref=db.backref('material_usage', cascade="all, delete-orphan"))
    material = db.relationship('Material')
    recorded_by = db.relationship('User')

    def to_dict(self):
        return {
            'id': self.id,
            'task_id': self.task_id,
            'material_id': self.material_id,
            'material_name': self.material.name if self.material else None,
            'material_unit': self.material.unit if self.material else None,
            'quantity_used': self.quantity_used,
            'recorded_at': self.recorded_at.isoformat(),
            'recorded_by_id': self.recorded_by_id
        }


issue_documents = db.Table('issue_documents', db.metadata,
    db.Column('issue_id', db.Integer, db.ForeignKey('issues.id'), primary_key=True),
    db.Column('document_id', db.Integer, db.ForeignKey('documents.id'), primary_key=True)
)

class RiskEvent(db.Model):
    """Модель для логирования исторических событий изменения риска."""
    __tablename__ = 'risk_events'
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    score_change = db.Column(db.Integer, nullable=False)
    new_score = db.Column(db.Integer, nullable=False)
    event_type = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    triggering_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)

    project = db.relationship('Project', backref='risk_events')
    triggering_user = db.relationship('User')

    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'timestamp': self.timestamp.isoformat(),
            'score_change': self.score_change,
            'new_score': self.new_score,
            'event_type': self.event_type,
            'description': self.description,
            'triggering_user_id': self.triggering_user_id
        }


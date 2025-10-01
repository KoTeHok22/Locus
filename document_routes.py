from flask import Blueprint, request, jsonify
from models import db, Document, Project
from auth import token_required, role_required
import uuid

document_bp = Blueprint('document', __name__)

@document_bp.route('/api/projects/<int:project_id>/documents', methods=['GET'])
@token_required
def get_project_documents(project_id):
    """Возвращает все документы, связанные с проектом."""
    # Убедимся, что проект существует, чтобы не запрашивать документы для несуществующего проекта
    db.get_or_404(Project, project_id)

    documents = Document.query.filter_by(project_id=project_id).order_by(Document.created_at.desc()).all()
    
    # У модели Document должен быть метод to_dict()
    docs_list = [doc.to_dict() for doc in documents]
    
    return jsonify(docs_list)

@document_bp.route('/api/documents/<int:document_id>', methods=['PUT'])
@token_required
@role_required('foreman')
def update_document(document_id):
    """Обновляет распознанные данные документа. Доступно только для прораба."""
    doc = db.get_or_404(Document, document_id)
    data = request.get_json()

    if 'recognized_data' not in data:
        return jsonify({'message': 'Отсутствует поле recognized_data'}), 400

    doc.recognized_data = data['recognized_data']
    # Можно добавить флаг, что данные были отредактированы вручную
    # doc.is_manually_edited = True 
    db.session.commit()

    return jsonify(doc.to_dict())


@document_bp.route('/api/documents/upload', methods=['POST'])
@token_required
def upload_document():
    """
    Загружает документ в систему.

    Принимает файл и метаданные (project_id, file_type, linked_entity_id)
    из multipart/form-data запроса. Генерирует уникальный идентификатор для файла,
    сохраняет информацию о документе в базе данных и возвращает
    словарь с данными нового документа.
    """
    if 'file' not in request.files:
        return jsonify({'message': 'Файл не найден в запросе'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'message': 'Имя файла не может быть пустым'}), 400

    project_id = request.form.get('project_id')
    file_type = request.form.get('file_type')
    linked_entity_id = request.form.get('linked_entity_id')

    if not project_id or not file_type:
        return jsonify({'message': 'Требуются поля формы project_id и file_type'}), 400

    file_extension = file.filename.rsplit('.', 1)[1].lower()
    file_id = uuid.uuid4()
    file_url = f"https://example.storage.com/{file_id}.{file_extension}"

    try:
        new_doc = Document(
            id=str(file_id),
            project_id=project_id,
            uploader_id=request.current_user['id'],
            file_type=file_type,
            url=file_url,
            linked_entity_id=linked_entity_id
        )
        db.session.add(new_doc)
        db.session.commit()
        
        return jsonify(new_doc.to_dict()), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Ошибка сохранения документа', 'error': str(e)}), 500

@document_bp.route('/api/documents/recognize', methods=['POST'])
@token_required
def recognize_document():
    """
    Инициирует асинхронную задачу распознавания документа.

    Принимает document_id в теле JSON-запроса и возвращает
    идентификатор запущенной задачи распознавания.
    """
    data = request.get_json()
    if not data or not data.get('document_id'):
        return jsonify({'message': 'Требуется document_id'}), 400

    recognition_task_id = str(uuid.uuid4())
    
    return jsonify({'recognition_task_id': recognition_task_id}), 202

@document_bp.route('/api/documents/recognize/<task_id>', methods=['GET'])
@token_required
def get_recognition_result(task_id):
    """
    Возвращает результат распознавания документа.

    Принимает идентификатор задачи распознавания и возвращает
    статус задачи и распознанные данные (в данной реализации - заглушка).
    """
    return jsonify({
        'task_id': task_id,
        'status': 'processed',
        'recognized_data': {
            'supplier': 'ООО Рога и Копыта',
            'date': '2025-09-24',
            'items': [
                {'name': 'Бетон B25', 'quantity': 10, 'unit': 'м3'}
            ]
        }
    }), 200

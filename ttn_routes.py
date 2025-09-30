import os
import json
import threading
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from auth import token_required
from models import db, Document
from qwen_api import QwenAPIClient, AccountManager, CookieManager # Предполагается, что этот модуль существует и настроен
from datetime import datetime

recognition_bp = Blueprint('recognition_bp', __name__)

UPLOAD_FOLDER = 'uploads'
AI_RESPONSES_FOLDER = 'ai_responses'

# --- Вспомогательные функции ---

def run_recognition_in_background(document_id, app):
    """Выполняет распознавание документа в фоновом потоке."""
    with app.app_context():
        document = Document.query.get(document_id)
        if not document:
            print(f"[Recognition] Ошибка: Документ с id {document_id} не найден.")
            return

        chat_session = None
        try:
            # Настройки клиента API (должны быть вынесены в конфигурацию)
            ACCOUNTS_FILE = "accounts.json"
            COOKIES_FILE = "shared_cookies.json"
            account_manager = AccountManager(accounts_file_path=ACCOUNTS_FILE)
            cookie_manager = CookieManager(cookie_file_path=COOKIES_FILE)
            api_client = QwenAPIClient(account_manager, cookie_manager)

            chat_session = api_client.create_chat(title=f"Doc Recognition - {document.id}")
            
            # Промпт для ИИ остается тот же, он хорошо описывает задачу извлечения данных
            prompt = '''# ROLE...
# TASK...
# ... (полный текст промпта из предыдущей версии)
''' # Примечание: здесь должен быть полный текст вашего промпта

            stream = api_client.send_message(chat_session, prompt, file_paths=[document.url])

            full_response = ""
            for event in stream:
                if 'choices' in event and event['choices']:
                    content = event['choices'][0].get('delta', {}).get('content', '')
                    if content:
                        full_response += content
            
            if not full_response.strip():
                raise ValueError("Получен пустой ответ от API распознавания")

            # Сохранение ответа от ИИ для отладки
            try:
                timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S-%f")
                filename = f"ai_response_{timestamp}.json"
                os.makedirs(AI_RESPONSES_FOLDER, exist_ok=True)
                filepath = os.path.join(AI_RESPONSES_FOLDER, filename)
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(full_response)
            except Exception as e:
                print(f"[Recognition] Не удалось сохранить ответ ИИ: {e}")

            # Извлечение чистого JSON из ответа
            json_response_str = full_response.strip().replace("```json", "").replace("```", "").strip()
            recognized_data = json.loads(json_response_str)

            document.recognized_data = recognized_data
            document.recognition_status = 'completed'
            db.session.commit()

        except Exception as e:
            print(f"[Recognition] Ошибка во время распознавания для документа {document.id}: {e}")
            document.recognition_status = 'failed'
            db.session.commit()
        finally:
            if chat_session:
                api_client.delete_chat(chat_session)

# --- Эндпоинты ---

@recognition_bp.route('/api/recognize/document', methods=['POST'])
@token_required
def recognize_document():
    """
    Запускает асинхронную задачу по распознаванию данных из файла.
    Принимает файл (PDF, JPG, PNG) и ID проекта.
    """
    if 'file' not in request.files:
        return jsonify({"message": "Файл не найден в запросе"}), 400
    
    project_id = request.form.get('project_id')
    if not project_id:
        return jsonify({"message": "Необходимо указать project_id"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"message": "Пустое имя файла"}), 400

    filename = secure_filename(file.filename)
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(file_path)

    document = None
    try:
        current_user_id = request.current_user['id']
        document = Document(
            project_id=project_id,
            uploader_id=current_user_id,
            file_type=file.content_type, # или более сложная логика определения типа
            url=file_path, 
            recognition_status='processing'
        )
        db.session.add(document)
        db.session.commit()

        app = current_app._get_current_object()
        recognition_thread = threading.Thread(
            target=run_recognition_in_background,
            args=(document.id, app)
        )
        recognition_thread.start()

        return jsonify({
            "message": "Распознавание запущено. Статус можно проверить по ID документа.",
            "document_id": document.id
        }), 202

    except Exception as e:
        if document and document.id:
            document.recognition_status = 'failed'
            db.session.commit()
        return jsonify({"message": f"Ошибка при запуске распознавания: {e}"}), 500

@recognition_bp.route('/api/recognize/status/<int:document_id>', methods=['GET'])
@token_required
def get_recognition_status(document_id):
    """Проверяет статус задачи распознавания документа."""
    document = Document.query.get_or_404(document_id)

    response = {
        "document_id": document.id,
        "recognition_status": document.recognition_status
    }

    if document.recognition_status == 'completed':
        response["recognized_data"] = document.recognized_data
        response["message"] = "Распознавание успешно завершено"
    elif document.recognition_status == 'failed':
        response["message"] = "Ошибка во время распознавания."
    else: # processing or pending
        response["message"] = "Распознавание еще в процессе."

    return jsonify(response), 200
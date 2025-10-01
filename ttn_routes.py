import os
import json
import threading
from flask import Blueprint, request, jsonify, current_app, send_file
from werkzeug.utils import secure_filename
from auth import token_required
from models import db, Document, ProjectUser
from qwen_api import QwenAPIClient, AccountManager, CookieManager
from datetime import datetime

recognition_bp = Blueprint('recognition_bp', __name__)

UPLOAD_FOLDER = 'uploads'
AI_RESPONSES_FOLDER = 'ai_responses'

def run_recognition_in_background(document_id, app):
    """Выполняет распознавание документа в фоновом потоке."""
    with app.app_context():
        document = Document.query.get(document_id)
        if not document:
            print(f"[Recognition] Ошибка: Документ с id {document_id} не найден.")
            return

        chat_session = None
        try:
            ACCOUNTS_FILE = "accounts.json"
            COOKIES_FILE = "shared_cookies.json"
            account_manager = AccountManager(accounts_file_path=ACCOUNTS_FILE)
            cookie_manager = CookieManager(cookie_file_path=COOKIES_FILE)
            api_client = QwenAPIClient(account_manager, cookie_manager)

            chat_session = api_client.create_chat(title=f"Doc Recognition - {document.id}")
            
            prompt = '''# ROLE
You are an expert AI system specializing in the automated processing and data extraction from Russian shipping and transport documents. Your function is to meticulously analyze scanned documents and convert unstructured information into a structured JSON format with perfect accuracy.

# CONTEXT
The user will provide a file containing one or more scanned Russian transport documents (Транспортная накладная - ТН). These documents detail cargo shipments. Your task is to identify each individual document within the file, process it, and extract key information. The documents might have slight variations in layout, stamps, or handwritten notes.

# TASK
Analyze the provided file step-by-step. For EACH transport document you identify, perform the following actions:
1.  **Isolate the Document**: Clearly define the boundaries of a single transport document before extracting its data. A document typically consists of the main "ТРАНСПОРТНАЯ НАКЛАДНАЯ" form and may have an associated "ДОКУМЕНТ О КАЧЕСТВЕ" page.
2.  **Extract Data**: Meticulously extract the specific fields listed below for that single document.
3.  **Format Output**: Structure the extracted information into a JSON object according to the specified schema and example.
4.  **Aggregate Results**: Compile the JSON objects for all processed documents into a single JSON array.

# EXTRACTION SCHEMA & INSTRUCTIONS
For each document, create a JSON object with the following keys. If a specific piece of information cannot be found, the value for that key must be `null`.

-   `"document_number"`: The number of the transport note (Транспортная накладная №).
-   `"document_date"`: The date of the transport note. Format as "YYYY-MM-DD".
-   `"sender"`: The name of the consignor (Грузоотправитель).
-   `"recipient"`: The name of the consignee (Грузополучатель).
-   `"carrier"`: The name of the carrier (Перевозчик).
-   `"shipping_address"`: The full address of the loading point (адрес места погрузки).
-   `"delivery_address"`: The full address of the destination (адрес места доставки груза).
-   `"driver"`: An object containing the driver's details:
    -   `"full_name"`: The full name of the driver (ФИО водителя).
-   `"vehicle"`: An object containing the vehicle's details:
    -   `"registration_plate"`: The state registration number (регистрационный номер транспортного средства).
-   `"items"`: An array of objects, with one object per line item in the cargo section (Груз). Each object should contain:
    -   `"name"`: The name of the item (Наименование).
    -   `"quantity"`: The quantity of the item (Количество). Convert to a number.
    -   `"unit"`: The unit of measurement (e.g., "шт", "п.м.").
    -   `"total_weight_net_kg"`: The net weight in kilograms (Масса нетто). Extract the numeric value only.
    -   `"total_weight_gross_kg"`: The gross weight in kilograms (Масса брутто). Extract the numeric value only.
    -   `"volume_m3"`: The volume in cubic meters (Объем). Extract the numeric value only.

# EXAMPLE JSON OUTPUT TEMPLATE
Use the following structure as a strict template for each JSON object you generate. The final output must be an array of objects structured exactly like this example.

```json
[
  {
    "document_number": "31795/Б",
    "document_date": "2024-08-06",
    "sender": "ООО \"Бекам\"",
    "recipient": "ГБУ города Москвы \"Автомобильные дороги\"",
    "carrier": "ООО \"Автопрофит\"",
    "shipping_address": "г. Москва, Походный проезд, вл.2 стр.1-1 / обл. Московская, г. Химки, д. Подолино, тер. Промышленная зона, стр. 1",
    "delivery_address": "г. Москва, поселок Некрасовка, пр-зд Проектируемый 4296",
    "driver": {
      "full_name": "Александров А.А."
    },
    "vehicle": {
      "registration_plate": "О 942 АЕ 797"
    },
    "items": [
      {
        "name": "Бортовой камень 1000х300х150",
        "quantity": 198,
        "unit": "шт",
        "total_weight_net_kg": 19463,
        "total_weight_gross_kg": 19694,
        "volume_m3": 8.91
      }
    ]
  }
]
```

# FINAL OUTPUT INSTRUCTIONS

Your final output must be a single, valid JSON array containing one object for each transport document found in the file, matching the example template perfectly. Do NOT include any text, explanations, or markdown formatting outside of the JSON array.
'''

            stream = api_client.send_message(chat_session, prompt, file_paths=[document.url])

            full_response = ""
            for event in stream:
                if 'choices' in event and event['choices']:
                    content = event['choices'][0].get('delta', {}).get('content', '')
                    if content:
                        full_response += content
            
            if not full_response.strip():
                raise ValueError("Получен пустой ответ от API распознавания")

            try:
                timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S-%f")
                filename = f"ai_response_{timestamp}.json"
                os.makedirs(AI_RESPONSES_FOLDER, exist_ok=True)
                filepath = os.path.join(AI_RESPONSES_FOLDER, filename)
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(full_response)
            except Exception as e:
                print(f"[Recognition] Не удалось сохранить ответ ИИ: {e}")

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
            file_type=file.content_type,
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
    else:
        response["message"] = "Распознавание еще в процессе."

    return jsonify(response), 200
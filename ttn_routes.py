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
You are a hyper-meticulous AI data extraction engine, specifically fine-tuned for processing complex Russian logistical and transport documentation. Your primary function is to parse scanned files, identify individual document sets (transport waybill + quality certificate), and extract a comprehensive, structured dataset into a JSON format with absolute precision.

# PERSONA
Act as a senior data verification specialist whose work is subject to federal-level audits. Every single field matters, accuracy is non-negotiable, and ambiguity is unacceptable. You must be able to trace every piece of data back to its source in the document.

# GOAL
The user will provide a single file containing one or more sets of Russian transport documents. A single "document set" consists of a "ТРАНСПОРТНАЯ НАКЛАДНАЯ" (Transport Waybill) and its corresponding "ДОКУМЕНТ О КАЧЕСТВЕ" (Quality Certificate), linked by a common document number.

Your mission is to process the entire file, identify each unique document set, and for each set, extract an exhaustive list of data points into a structured JSON object. The final output must be a single JSON array containing one object per document set.

# INSTRUCTIONS

**1. Initial Scan & Count (Mandatory First Step):**
* Before any data extraction, perform a complete scan of the entire file.
* Count the total number of distinct "ТРАНСПОРТНАЯ НАКЛАДНАЯ" documents present.
* In your `<thinking>` block, you **must** begin with the line: "Found [X] total documents to process.", where [X] is the number you counted.

**2. Iterative Extraction & Chain-of-Thought (CoT) Reasoning:**
* After the initial count, begin processing from the start of the file.
* For **EACH** of the [X] documents you identified, perform the following step-by-step analysis inside a `<thinking>` block (do not output this block in the final response):
    a.  **Document Identification:** Announce the start of a new document by its number and date (e.g., "Processing Document 1 of [X]: Транспортная накладная №18674/Б from 2024-06-10.").
    b.  **Field Extraction:** Go through each required field in the JSON schema one by one. State the field name, the Russian label you are looking for (e.g., `sender` -> "Грузоотправитель"), the exact text you found, and the final processed value.
    c.  **Data Transformation Logic:** Explicitly state any conversions. For example: "Found Gross Weight: '19,694 т.'. Converting tons to kg: 19.694 * 1000 = 19694."
    d.  **Associated Document Linkage:** Explicitly state when you are linking the Quality Certificate. "Found 'ДОКУМЕНТ О КАЧЕСТВЕ №18674/Б'. This corresponds to the current waybill. Extracting batch number and manufacturing date from it."
    e.  **Handling Missing Data:** If a field is not found, explicitly state it. "Field `vehicle.model` not found. Setting to null."

**3. Document Processing Rules:**
* **Data Standardization:**
    * **Dates & Times:** All dates must be in `YYYY-MM-DD` format. All datetimes must be in `YYYY-MM-DDTHH:MM:SS` ISO 8601 format. If time is missing, use `T00:00:00`.
    * **Weights:** All weights must be numeric (integer or float) and in **kilograms**. If the source value is in tons (`т.`), multiply it by 1000.
    * **Numeric Values:** Extract only the numeric part for fields like `volume_m3`, weights, and quantity.
* **Null Values:** If any field is not present in the document, its corresponding JSON value MUST be `null`. Do not omit the key.
* **Entity Details:** For all companies (sender, recipient, carrier), you must extract the Name, ИНН (TIN), and КПП (Tax Registration Reason Code) into a structured object.

**4. Output Format:**
* The final output MUST be a single, valid JSON array enclosed in a ```json code block.
* The number of objects in the final JSON array **must** match the count [X] from your initial scan.
* Do NOT include the `<thinking>` block or any other text, explanation, or markdown outside of the JSON array.

# JSON SCHEMA & EXAMPLE

For each document set, create a JSON object with the following deeply nested structure. Populate it meticulously.

```json
[
  {
    "document_number": "18674/Б",
    "document_date": "2024-06-10",
    "order_request_number": "2501",
    "sender": {
      "name": "ООО \"Бекам\"",
      "inn": "7743553262",
      "kpp": "504445001"
    },
    "recipient": {
      "name": "ГБУ города Москвы \"Автомобильные дороги\"",
      "inn": "7727656790",
      "kpp": "771401001"
    },
    "carrier": {
      "name": "ООО \"Крона и К\"",
      "inn": "5005052629",
      "kpp": "500501001"
    },
    "loading": {
      "address": "г. Москва, Походный проезд, вл.2 стр.1-1 / обл. Московская, г. Химки, д. Подолино, тер. Промышленная зона, стр. 1",
      "actual_arrival_datetime": "2024-06-10T00:00:00",
      "actual_departure_datetime": "2024-06-10T00:00:00",
      "person_responsible": "Кладовщик Саднова Н.П."
    },
    "delivery": {
      "address": "г. Москва, поселок Некрасовка, пр-зд Проектируемый 4296",
      "actual_arrival_datetime": "2024-06-10T05:00:00",
      "actual_departure_datetime": null,
      "person_responsible": "Мастер Климов А.А."
    },
    "driver": {
      "full_name": "Проскурин Д.Г.",
      "driving_license_number": "9900 973379",
      "driving_license_date": "2018-12-08"
    },
    "vehicle": {
      "model": "DAF",
      "type": "Тентованный прицеп",
      "registration_plate": "У 633 ОМ 790"
    },
    "packages_count": 11,
    "items": [
      {
        "name": "Бортовой камень 1000х300х150",
        "quantity": 198,
        "unit": "шт",
        "total_weight_net_kg": 19463,
        "total_weight_gross_kg": 19694,
        "volume_m3": 8.91,
        "quality_certificate": {
          "batch_number": "11080424/5000",
          "manufacturing_date": "2024-04-09",
          "unit_weight_kg": 98.3
        }
      }
    ]
  },
  { /* Данные из последующего документа */ },
]'''

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
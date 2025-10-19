
import os
import json
from datetime import datetime
from celery import Celery
from flask import Flask

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///app.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['CELERY_BROKER_URL'] = os.environ.get('CELERY_BROKER_URL', 'redis://localhost:6379/0')
app.config['CELERY_RESULT_BACKEND'] = os.environ.get('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')

from models import db, Document
db.init_app(app)

celery = Celery(
    app.import_name,
    backend=app.config['CELERY_RESULT_BACKEND'],
    broker=app.config['CELERY_BROKER_URL']
)
celery.conf.update(app.config)

class ContextTask(celery.Task):
    def __call__(self, *args, **kwargs):
        with app.app_context():
            return self.run(*args, **kwargs)

celery.Task = ContextTask

def make_celery(flask_app):
    """Для обратной совместимости с main.py"""
    return celery

@celery.task(bind=True, max_retries=3)
def recognize_document_task(self, document_id):
    """
    Асинхронная задача для распознавания документа через Qwen API.
    Полностью изолирована от основного приложения.
    """
    from qwen_api import QwenAPIClient, AccountManager, CookieManager
    
    AI_RESPONSES_FOLDER = 'ai_responses'
    
    document = Document.query.get(document_id)
    if not document:
        print(f"[Celery] Документ {document_id} не найден")
        return {'status': 'error', 'message': 'Document not found'}

    chat_session = None
    try:
        document.recognition_status = 'processing'
        db.session.commit()
        
        print(f"[Celery] Начало распознавания документа {document_id}")

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

**1. Chain-of-Thought (CoT) Reasoning:**
Before generating any JSON, you MUST perform a step-by-step analysis inside a `<thinking>` block. For EACH document set you identify, follow this internal monologue:
    a.  **Document Identification:** Announce the start of a new document by its number and date (e.g., "Processing Транспортная накладная №18674/Б from 2024-06-10.").
    b.  **Field Extraction:** Go through each required field in the JSON schema one by one. State the field name, the Russian label you are looking for (e.g., `sender` -> "Грузоотправитель"), the exact text you found, and the final processed value.
    c.  **Data Transformation Logic:** Explicitly state any conversions. For example: "Found Gross Weight: '19,694 т.'. Converting tons to kg: 19.694 * 1000 = 19694." or "Found Document Date: '10.06.2024'. Formatting to YYYY-MM-DD: '2024-06-10'."
    d.  **Associated Document Linkage:** Explicitly state when you are linking the Quality Certificate. "Found 'ДОКУМЕНТ О КАЧЕСТВЕ №18674/Б'. This corresponds to the current waybill. Extracting batch number and manufacturing date from it."
    e.  **Handling Missing Data:** If a field is not found, explicitly state it. "Field `vehicle.model` not found. Setting to null."
This thinking process is mandatory and improves accuracy. Do not output the `<thinking>` block in the final JSON response.

**2. Document Processing Rules:**
* **Iteration:** Process the file sequentially. When a new "ТРАНСПОРТНАЯ НАКЛАДНАЯ" header with a new number is detected, begin a new JSON object.
* **Data Standardization:**
    * **Dates & Times:** All dates must be in `YYYY-MM-DD` format. All datetimes must be in `YYYY-MM-DDTHH:MM:SS` ISO 8601 format. If time is missing, use `T00:00:00`.
    * **Weights:** All weights must be numeric (integer or float) and in **kilograms**. If the source value is in tons (`т.`), multiply it by 1000.
    * **Numeric Values:** Extract only the numeric part for fields like `volume_m3`, weights, and quantity.
* **Null Values:** If any field is not present in the document, its corresponding JSON value MUST be `null`. Do not omit the key.
* **Entity Details:** For all companies (sender, recipient, carrier), you must extract the Name, ИНН (TIN), and КПП (Tax Registration Reason Code) into a structured object.

**3. Output Format:**
* The final output MUST be a single, valid JSON array enclosed in a ```json code block.
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
  }
]
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
            print(f"[Celery] AI ответ сохранен: {filepath}")
        except Exception as e:
            print(f"[Celery] Не удалось сохранить ответ ИИ: {e}")

        json_response_str = full_response.strip().replace("```json", "").replace("```", "").strip()
        recognized_data = json.loads(json_response_str)

        document.recognized_data = recognized_data
        document.recognition_status = 'completed'
        db.session.commit()
        
        print(f"[Celery] Распознавание документа {document_id} завершено успешно")
        
        return {
            'status': 'completed',
            'document_id': document_id,
            'recognized_data': recognized_data
        }

    except Exception as e:
        print(f"[Celery] Ошибка распознавания документа {document_id}: {str(e)}")
        document.recognition_status = 'failed'
        db.session.commit()
        
        if self.request.retries < self.max_retries:
            raise self.retry(exc=e, countdown=60)
        
        return {
            'status': 'failed',
            'document_id': document_id,
            'error': str(e)
        }
    finally:
        if chat_session:
            try:
                api_client.delete_chat(chat_session)
            except Exception as e:
                print(f"[Celery] Ошибка при удалении чата: {e}")

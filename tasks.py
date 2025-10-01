
import os
import json
from celery import Celery
from models import db, Task, Document
from qwen_api import QwenAPIClient, AccountManager, CookieManager, QwenAPIError

def make_celery(app):
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
    return celery

celery = Celery('tasks', broker='redis://localhost:6379/0', backend='redis://localhost:6379/0')


def validate_ttn_data(recognized_items, planned_materials):
    """
    Сравнивает распознанные данные из ТТН с плановыми материалами задачи.
    """
    if not planned_materials:
        return {
            "status": "warning",
            "message": "Для данной задачи не заданы плановые материалы. Проверка не выполнялась."
        }

    errors = []
    warnings = []
    
    planned_map = {item['name'].lower(): item for item in planned_materials}
    recognized_map = {item['name'].lower(): item for item in recognized_items}

    for name, planned_item in planned_map.items():
        if name not in recognized_map:
            warnings.append(f"Материал '{planned_item['name']}' был запланирован, но отсутствует в ТТН.")
        else:
            recognized_item = recognized_map[name]
            planned_quantity = planned_item.get('quantity')
            recognized_quantity = recognized_item.get('quantity')
            
            if planned_quantity is not None and recognized_quantity is not None:
                if float(recognized_quantity) > float(planned_quantity):
                    errors.append(f"Объем '{recognized_item['name']}' ({recognized_quantity}) превышает плановый ({planned_quantity}).")
                elif float(recognized_quantity) < float(planned_quantity):
                    warnings.append(f"Объем '{recognized_item['name']}' ({recognized_quantity}) меньше планового ({planned_quantity}).")

    for name, recognized_item in recognized_map.items():
        if name not in planned_map:
            errors.append(f"Материал '{recognized_item['name']}' не был запланирован для этой задачи.")

    if errors:
        return {
            "status": "validation_error",
            "message": "Выявлены расхождения с планом. " + " ".join(errors) + " " + " ".join(warnings)
        }
    if warnings:
        return {
            "status": "ok_with_warnings",
            "message": "Материалы соответствуют плану, но есть предупреждения. " + " ".join(warnings)
        }
    
    return {
        "status": "ok",
        "message": "Материал полностью соответствует плану."
    }


@celery.task
def process_ttn_recognition(document_id):
    document = Document.query.get(document_id)
    if not document:
        return

    document.recognition_status = 'processing'
    db.session.commit()

    try:
        ACCOUNTS_FILE = "accounts.json"
        COOKIES_FILE = "shared_cookies.json"
        account_manager = AccountManager(accounts_file_path=ACCOUNTS_FILE)
        cookie_manager = CookieManager(cookie_file_path=COOKIES_FILE)
        api_client = QwenAPIClient(account_manager, cookie_manager)

        task = Task.query.filter_by(id=document.linked_entity_id, project_id=document.project_id).first()
        if not task:
            raise Exception("Task not found")

        chat_session = api_client.create_chat(title=f"TTN Recognition - {document.id}")
        prompt = '''
You are an expert AI system specializing in the automated processing and data extraction from Russian shipping and transport documents. Your function is to meticulously analyze scanned documents and convert unstructured information into a structured JSON format with perfect accuracy.

The user will provide a file containing one or more scanned Russian transport documents (Транспортная накладная - ТН). These documents detail cargo shipments. Your task is to identify each individual document within the file, process it, and extract key information. The documents might have slight variations in layout, stamps, or handwritten notes.

Analyze the provided file step-by-step. For EACH transport document you identify, perform the following actions:
1.  **Isolate the Document**: Clearly define the boundaries of a single transport document before extracting its data. A document typically consists of the main "ТРАНСПОРТНАЯ НАКЛАДНАЯ" form and may have an associated "ДОКУМЕНТ О КАЧЕСТВЕ" page.
2.  **Extract Data**: Meticulously extract the specific fields listed below for that single document.
3.  **Format Output**: Structure the extracted information into a JSON object according to the specified schema.
4.  **Aggregate Results**: Compile the JSON objects for all processed documents into a single JSON array.

For each document, create a JSON object with the following keys. If a specific piece of information cannot be found, the value for that key must be `null`.

-   `"document_number"`: The number of the transport note (Транспортная накладная №).
-   `"document_date"`: The date of the transport note. Format as "YYYY-MM-DD".
-   `"sender"`: The name of the consignor (Грузоотправитель).
-   `"recipient"`: The name of the consignee (Грузополучатель).
-   `"carrier"`: The name of the carrier (Перевозчик).
-   `"shipping_address"`: The full address of the loading point (адрес места погрузки).
-   `"delivery_address"`: The full address of the destination (адрес места доставки груза).
-   `"driver"`: An object containing the driver's details:
    -   `"full_name"`: The full name of the driver (ФИО водителя).
-   `"vehicle"`: An object containing the vehicle's details:
    -   `"registration_plate"`: The state registration number (регистрационный номер транспортного средства).
-   `"items"`: An array of objects, with one object per line item in the cargo section (Груз). Each object should contain:
    -   `"name"`: The name of the item (Наименование).
    -   `"quantity"`: The quantity of the item (Количество). Convert to a number.
    -   `"unit"`: The unit of measurement (e.g., "шт", "п.м.").
    -   `"total_weight_net_kg"`: The net weight in kilograms (Масса нетто). Extract the numeric value only.
    -   `"total_weight_gross_kg"`: The gross weight in kilograms (Масса брутто). Extract the numeric value only.
    -   `"volume_m3"`: The volume in cubic meters (Объем). Extract the numeric value only.

Your final output must be a single, valid JSON array containing one object for each transport document found in the file. Do NOT include any text, explanations, or markdown formatting outside of the JSON array.
        '''
        stream = api_client.send_message(chat_session, prompt, file_paths=[document.url])

        full_response = ""
        for event in stream:
            if 'choices' in event and event['choices']:
                delta = event['choices'][0].get('delta', {})
                content = delta.get('content', '')
                if content:
                    full_response += content
        
        json_response_str = full_response.strip().replace("```json", "").replace("```", "").strip()
        
        recognized_data = json.loads(json_response_str)

        ttn_items = recognized_data[0].get('items', []) if isinstance(recognized_data, list) and recognized_data else []
        validation_result = validate_ttn_data(ttn_items, task.materials)

        document.recognized_data = recognized_data
        document.validation_status = validation_result
        document.recognition_status = 'completed'
        db.session.commit()

    except Exception as e:
        document.recognition_status = 'failed'
        db.session.commit()
    finally:
        if 'chat_session' in locals() and chat_session:
            api_client.delete_chat(chat_session)

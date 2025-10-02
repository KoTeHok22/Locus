import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import ApiService from '../../apiService';

const EditTTNModal = ({ document, onClose, onUpdate }) => {
    const [editableData, setEditableData] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (document && document.recognized_data) {
            // Глубокое копирование, чтобы избежать мутаций исходного объекта
            setEditableData(JSON.parse(JSON.stringify(document.recognized_data[0])));
        }
    }, [document]);

    const handleFieldChange = (path, value) => {
        setEditableData(prevData => {
            const newData = { ...prevData };
            let current = newData;
            for (let i = 0; i < path.length - 1; i++) {
                current = current[path[i]];
            }
            current[path[path.length - 1]] = value;
            return newData;
        });
    };

    const handleItemChange = (itemIndex, path, value) => {
        setEditableData(prevData => {
            const newData = { ...prevData };
            let current = newData.items[itemIndex];
            for (let i = 0; i < path.length - 1; i++) {
                current = current[path[i]];
            }
            current[path[path.length - 1]] = value;
            return newData;
        });
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        const toastId = toast.loading('Сохранение изменений...');
        try {
            // Оборачиваем объект обратно в массив, как он хранится в БД
            await ApiService.updateDocument(document.id, [editableData]);
            toast.success('Данные документа успешно обновлены!', { id: toastId });
            onUpdate();
            onClose();
        } catch (error) {
            toast.error(`Ошибка: ${error.message}`, { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!editableData) return null;

    const renderSection = (title, fields) => (
        <div className="p-3 border rounded-lg bg-slate-50">
            <h4 className="font-medium text-md mb-3 text-gray-800">{title}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fields.map(field => field && (
                    <div key={field.path.join('.')}>
                        <label className="text-xs text-gray-600">{field.label}</label>
                        <input 
                            type={field.type || 'text'} 
                            value={field.value || ''} 
                            onChange={(e) => handleFieldChange(field.path, e.target.value)} 
                            className="w-full p-1.5 border rounded-md text-sm bg-white" 
                        />
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-4xl">
                <h2 className="text-xl font-bold mb-4">Детали ТТН (ID: {document.id})</h2>
                <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
                    {renderSection('Основная информация', [
                        { label: 'Номер документа', path: ['document_number'], value: editableData.document_number },
                        { label: 'Дата документа', path: ['document_date'], value: editableData.document_date, type: 'date' },
                    ])}
                    {renderSection('Отправитель', [
                        { label: 'Наименование', path: ['sender', 'name'], value: editableData.sender?.name },
                        { label: 'ИНН', path: ['sender', 'inn'], value: editableData.sender?.inn },
                        { label: 'КПП', path: ['sender', 'kpp'], value: editableData.sender?.kpp },
                    ])}
                    {renderSection('Получатель', [
                        { label: 'Наименование', path: ['recipient', 'name'], value: editableData.recipient?.name },
                        { label: 'ИНН', path: ['recipient', 'inn'], value: editableData.recipient?.inn },
                        { label: 'КПП', path: ['recipient', 'kpp'], value: editableData.recipient?.kpp },
                    ])}
                     {renderSection('Перевозчик', [
                        { label: 'Наименование', path: ['carrier', 'name'], value: editableData.carrier?.name },
                        { label: 'ИНН', path: ['carrier', 'inn'], value: editableData.carrier?.inn },
                        { label: 'КПП', path: ['carrier', 'kpp'], value: editableData.carrier?.kpp },
                    ])}
                    {renderSection('Водитель и ТС', [
                        { label: 'ФИО водителя', path: ['driver', 'full_name'], value: editableData.driver?.full_name },
                        { label: 'Модель ТС', path: ['vehicle', 'model'], value: editableData.vehicle?.model },
                        { label: 'Тип ТС', path: ['vehicle', 'type'], value: editableData.vehicle?.type },
                    ])}

                    <div className="p-3 border rounded-lg bg-slate-50">
                        <h4 className="font-medium text-md mb-2 text-gray-800">Позиции</h4>
                        {editableData.items?.map((item, itemIndex) => (
                            <div key={itemIndex} className="p-3 border-t space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-xs text-gray-600">Наименование</label>
                                        <input type="text" value={item.name || ''} onChange={(e) => handleItemChange(itemIndex, ['name'], e.target.value)} className="w-full p-1.5 border rounded-md text-sm bg-white" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-600">Количество</label>
                                        <input type="number" value={item.quantity || ''} onChange={(e) => handleItemChange(itemIndex, ['quantity'], e.target.value)} className="w-full p-1.5 border rounded-md text-sm bg-white" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-600">Ед. изм.</label>
                                        <input type="text" value={item.unit || ''} onChange={(e) => handleItemChange(itemIndex, ['unit'], e.target.value)} className="w-full p-1.5 border rounded-md text-sm bg-white" />
                                    </div>
                                </div>
                                <div className="p-2 border rounded-md bg-white">
                                    <p className="text-xs font-medium mb-2 text-gray-700">Паспорт качества</p>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div>
                                            <label className="text-xs text-gray-600">№ партии</label>
                                            <input type="text" value={item.quality_certificate?.batch_number || ''} onChange={(e) => handleItemChange(itemIndex, ['quality_certificate', 'batch_number'], e.target.value)} className="w-full p-1.5 border rounded-md text-sm" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-600">Дата производства</label>
                                            <input type="date" value={item.quality_certificate?.manufacturing_date || ''} onChange={(e) => handleItemChange(itemIndex, ['quality_certificate', 'manufacturing_date'], e.target.value)} className="w-full p-1.5 border rounded-md text-sm" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-600">Вес ед., кг</label>
                                            <input type="number" value={item.quality_certificate?.unit_weight_kg || ''} onChange={(e) => handleItemChange(itemIndex, ['quality_certificate', 'unit_weight_kg'], e.target.value)} className="w-full p-1.5 border rounded-md text-sm" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex justify-end gap-4 mt-6">
                    <button onClick={onClose} className="bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium">Отмена</button>
                    <button onClick={handleSubmit} disabled={isSubmitting} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:bg-gray-400">
                        {isSubmitting ? 'Сохранение...' : 'Сохранить изменения'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditTTNModal;

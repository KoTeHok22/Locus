import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import ApiService from '../../apiService';

const EditTTNModal = ({ document, onClose, onUpdate }) => {
    const [editableData, setEditableData] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (document && document.recognized_data) {
            setEditableData(JSON.parse(JSON.stringify(document.recognized_data))); // Deep copy
        }
    }, [document]);

    const handleItemChange = (docIndex, itemIndex, field, value) => {
        const updatedData = [...editableData];
        updatedData[docIndex].items[itemIndex][field] = value;
        setEditableData(updatedData);
    };

    const handleFieldChange = (docIndex, field, value) => {
        const updatedData = [...editableData];
        updatedData[docIndex][field] = value;
        setEditableData(updatedData);
    }

    const handleSubmit = async () => {
        setIsSubmitting(true);
        const toastId = toast.loading('Сохранение изменений...');
        try {
            await ApiService.updateDocument(document.id, editableData);
            toast.success('Данные документа успешно обновлены!', { id: toastId });
            onUpdate();
            onClose();
        } catch (error) {
            toast.error(`Ошибка: ${error.message}`, { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!editableData) {
        return null; // Or a loading spinner
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-3xl">
                <h2 className="text-xl font-bold mb-4">Редактирование ТТН (ID: {document.id})</h2>
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    {editableData.map((doc, docIndex) => (
                        <div key={docIndex} className="p-3 border rounded-lg bg-slate-50 space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-600">Номер документа</label>
                                    <input type="text" value={doc.document_number || ''} onChange={(e) => handleFieldChange(docIndex, 'document_number', e.target.value)} className="w-full p-1.5 border rounded-md text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-600">Дата документа</label>
                                    <input type="date" value={doc.document_date || ''} onChange={(e) => handleFieldChange(docIndex, 'document_date', e.target.value)} className="w-full p-1.5 border rounded-md text-sm" />
                                </div>
                            </div>
                            <h4 className="font-medium text-sm mt-2">Позиции:</h4>
                            {doc.items.map((item, itemIndex) => (
                                <div key={itemIndex} className="p-2 border-t grid grid-cols-3 gap-2 items-end">
                                    <div>
                                        <label className="text-xs text-gray-600">Наименование</label>
                                        <input type="text" value={item.name || ''} onChange={(e) => handleItemChange(docIndex, itemIndex, 'name', e.target.value)} className="w-full p-1.5 border rounded-md text-sm" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-600">Количество</label>
                                        <input type="number" value={item.quantity || ''} onChange={(e) => handleItemChange(docIndex, itemIndex, 'quantity', e.target.value)} className="w-full p-1.5 border rounded-md text-sm" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-600">Ед. изм.</label>
                                        <input type="text" value={item.unit || ''} onChange={(e) => handleItemChange(docIndex, itemIndex, 'unit', e.target.value)} className="w-full p-1.5 border rounded-md text-sm" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
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

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import ApiService from '../../apiService';

const EditTTNModal = ({ document, onClose, onUpdate }) => {
    const [allDocuments, setAllDocuments] = useState([]);
    const [currentDocIndex, setCurrentDocIndex] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (document && document.recognized_data) {
            setAllDocuments(JSON.parse(JSON.stringify(document.recognized_data)));
        }
    }, [document]);

    const currentDoc = allDocuments[currentDocIndex];

    const handleFieldChange = (path, value) => {
        setAllDocuments(prevDocs => {
            const newDocs = [...prevDocs];
            let current = newDocs[currentDocIndex];
            for (let i = 0; i < path.length - 1; i++) {
                current = current[path[i]];
            }
            current[path[path.length - 1]] = value;
            return newDocs;
        });
    };

    const handleItemChange = (itemIndex, path, value) => {
        setAllDocuments(prevDocs => {
            const newDocs = [...prevDocs];
            let current = newDocs[currentDocIndex].items[itemIndex];
            for (let i = 0; i < path.length - 1; i++) {
                current = current[path[i]];
            }
            current[path[path.length - 1]] = value;
            return newDocs;
        });
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        const toastId = toast.loading('Сохранение изменений...');
        try {
            await ApiService.updateDocument(document.id, allDocuments);
            toast.success('Данные документов успешно обновлены!', { id: toastId });
            onUpdate();
            onClose();
        } catch (error) {
            toast.error(`Ошибка: ${error.message}`, { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!currentDoc) return null;

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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                    <h2 className="text-xl font-bold">
                        Детали ТТН №{currentDoc.document_number || document.id}
                    </h2>
                    {allDocuments.length > 1 && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentDocIndex(prev => Math.max(0, prev - 1))}
                                disabled={currentDocIndex === 0}
                                className="px-3 py-1 bg-gray-200 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
                            >
                                ← Назад
                            </button>
                            <span className="text-sm text-gray-600">
                                {currentDocIndex + 1} из {allDocuments.length}
                            </span>
                            <button
                                onClick={() => setCurrentDocIndex(prev => Math.min(allDocuments.length - 1, prev + 1))}
                                disabled={currentDocIndex === allDocuments.length - 1}
                                className="px-3 py-1 bg-gray-200 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
                            >
                                Вперед →
                            </button>
                        </div>
                    )}
                </div>
                
                <div className="space-y-4 flex-1 overflow-y-auto pr-2">
                    {renderSection('Основная информация', [
                        { label: 'Номер документа', path: ['document_number'], value: currentDoc.document_number },
                        { label: 'Дата документа', path: ['document_date'], value: currentDoc.document_date, type: 'date' },
                    ])}
                    {renderSection('Отправитель', [
                        { label: 'Наименование', path: ['sender', 'name'], value: currentDoc.sender?.name },
                        { label: 'ИНН', path: ['sender', 'inn'], value: currentDoc.sender?.inn },
                        { label: 'КПП', path: ['sender', 'kpp'], value: currentDoc.sender?.kpp },
                    ])}
                    {renderSection('Получатель', [
                        { label: 'Наименование', path: ['recipient', 'name'], value: currentDoc.recipient?.name },
                        { label: 'ИНН', path: ['recipient', 'inn'], value: currentDoc.recipient?.inn },
                        { label: 'КПП', path: ['recipient', 'kpp'], value: currentDoc.recipient?.kpp },
                    ])}
                     {renderSection('Перевозчик', [
                        { label: 'Наименование', path: ['carrier', 'name'], value: currentDoc.carrier?.name },
                        { label: 'ИНН', path: ['carrier', 'inn'], value: currentDoc.carrier?.inn },
                        { label: 'КПП', path: ['carrier', 'kpp'], value: currentDoc.carrier?.kpp },
                    ])}
                    {renderSection('Водитель и ТС', [
                        { label: 'ФИО водителя', path: ['driver', 'full_name'], value: currentDoc.driver?.full_name },
                        { label: 'Модель ТС', path: ['vehicle', 'model'], value: currentDoc.vehicle?.model },
                        { label: 'Тип ТС', path: ['vehicle', 'type'], value: currentDoc.vehicle?.type },
                    ])}

                    <div className="p-3 border rounded-lg bg-slate-50">
                        <h4 className="font-medium text-md mb-2 text-gray-800">Позиции</h4>
                        {currentDoc.items?.map((item, itemIndex) => (
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
                
                <div className="flex justify-between items-center gap-4 mt-6 pt-4 border-t flex-shrink-0">
                    {allDocuments.length > 1 && (
                        <div className="text-sm text-gray-600">
                            Всего документов: {allDocuments.length}
                        </div>
                    )}
                    <div className="flex gap-3 ml-auto">
                        <button 
                            onClick={onClose} 
                            className="bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 transition"
                        >
                            Отмена
                        </button>
                        <button 
                            onClick={handleSubmit} 
                            disabled={isSubmitting} 
                            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:bg-gray-400 hover:bg-green-700 transition"
                        >
                            {isSubmitting ? 'Сохранение...' : `Сохранить все (${allDocuments.length})`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditTTNModal;

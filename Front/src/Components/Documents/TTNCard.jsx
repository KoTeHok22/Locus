import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { translate } from '../../utils/translation';
import AuthService from '../../authService';
import ApiService from '../../apiService';

const StatusBadge = ({ status }) => {
    const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full';
    const statusClasses = {
        completed: 'bg-green-100 text-green-800',
        processing: 'bg-blue-100 text-blue-800 animate-pulse',
        pending: 'bg-yellow-100 text-yellow-800',
        failed: 'bg-red-100 text-red-800',
    };

    return (
        <span className={`${baseClasses} ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
            {translate(status)}
        </span>
    );
};

const RecognizedDataItem = ({ label, value }) => {
    if (value === null || value === undefined || value === '') return null;
    return (
        <div>
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-sm text-gray-800">{typeof value === 'object' ? JSON.stringify(value) : value}</p>
        </div>
    );
};

const RecognitionDetailsView = ({ documents }) => (
    <div className="mt-4 space-y-4">
        {documents.map((data, docIndex) => (
            <div key={docIndex} className="bg-slate-50 p-3 rounded-md border">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-sm text-gray-900">
                        ТТН №{data.document_number || docIndex + 1}
                    </h4>
                    {documents.length > 1 && (
                        <span className="text-xs text-gray-500">
                            Документ {docIndex + 1} из {documents.length}
                        </span>
                    )}
                </div>
                <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <RecognizedDataItem label="Дата" value={data.document_date} />
                        <RecognizedDataItem label="Отправитель" value={data.sender?.name} />
                        <RecognizedDataItem label="Получатель" value={data.recipient?.name} />
                        <RecognizedDataItem label="Перевозчик" value={data.carrier?.name} />
                        <RecognizedDataItem label="Водитель" value={data.driver?.full_name} />
                        <RecognizedDataItem label="ТС" value={`${data.vehicle?.model || ''} (${data.vehicle?.type || ''})`} />
                    </div>
                    <div className="pt-2 border-t">
                        <h5 className="font-semibold text-sm mt-2">Позиции:</h5>
                        {data.items?.map((item, index) => (
                            <div key={index} className="text-sm mt-1 border-b pb-2">
                                <p className='font-medium'>{item.name} - {item.quantity} {item.unit}</p>
                                {item.quality_certificate && 
                                    <p className='text-xs text-gray-600 pl-2'>Паспорт: №{item.quality_certificate.batch_number} от {item.quality_certificate.manufacturing_date}</p>
                                }
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        ))}
    </div>
);

const TTNCard = ({ document, onEdit, onDelete }) => {
    const [showDetails, setShowDetails] = useState(false);
    const [error, setError] = useState(null);
    const allDocuments = document.recognized_data || [];
    const firstDoc = allDocuments[0];
    const userRole = AuthService.getUserRole();

    const handleOpenFile = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            await ApiService.openDocumentFile(document.id);
        } catch (err) {
            setError(err.message);
            alert(`Ошибка: ${err.message}`);
        }
    };

    const handleDelete = () => {
        if (onDelete && confirm('Удалить этот документ? Это действие нельзя отменить.')) {
            onDelete(document.id);
        }
    };

    return (
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <div className="flex items-center gap-2">
                        <p className="font-semibold text-blue-700">
                            ТТН №{firstDoc?.document_number || document.id}
                        </p>
                        {allDocuments.length > 1 && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                +{allDocuments.length - 1}
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-gray-500">Загружен: {new Date(document.created_at).toLocaleString()}</p>
                    {allDocuments.length > 1 && (
                        <p className="text-xs text-gray-600 mt-1">Всего документов в файле: {allDocuments.length}</p>
                    )}
                </div>
                <StatusBadge status={document.recognition_status} />
            </div>

            {document.recognition_status === 'completed' && firstDoc ? (
                <div className="space-y-2 text-sm">
                    <RecognizedDataItem label="Отправитель" value={firstDoc.sender?.name} />
                    <RecognizedDataItem label="Дата" value={firstDoc.document_date} />
                </div>
            ) : (
                <p className="text-sm text-gray-500 italic">Данные распознавания отсутствуют или документ в обработке.</p>
            )}

            <div className="flex items-center justify-between mt-4 pt-3 border-t">
                <div className="flex gap-4">
                    <button onClick={handleOpenFile} className="text-blue-600 hover:underline text-sm font-medium">Открыть файл</button>
                    {userRole === 'foreman' && document.recognition_status === 'completed' && (
                        <button onClick={onEdit} className="text-green-600 hover:underline text-sm font-medium">
                            Детали / Редакт. {allDocuments.length > 1 && `(${allDocuments.length})`}
                        </button>
                    )}
                    {allDocuments.length > 0 && (
                        <button onClick={() => setShowDetails(!showDetails)} className="text-blue-600 hover:underline text-sm font-medium">
                            {showDetails ? 'Скрыть' : 'Показать все'}
                        </button>
                    )}
                </div>
                {userRole === 'foreman' && onDelete && (
                    <button 
                        onClick={handleDelete}
                        className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
                        title="Удалить документ"
                    >
                        <Trash2 size={14} />
                        <span>Удалить</span>
                    </button>
                )}
            </div>

            {showDetails && allDocuments.length > 0 && (
               <RecognitionDetailsView documents={allDocuments} />
            )}
        </div>
    );
};

export default TTNCard;

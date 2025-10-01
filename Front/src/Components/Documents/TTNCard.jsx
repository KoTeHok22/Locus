import React, { useState } from 'react';
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

const RecognitionDetailsView = ({ data }) => (
    <div className="mt-4 bg-slate-50 p-3 rounded-md border space-y-3">
        {data.map((doc, index) => (
            <div key={index} className="space-y-2">
                <h5 className="font-semibold text-sm">Документ #{index + 1}</h5>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <RecognizedDataItem label="Номер документа" value={doc.document_number} />
                    <RecognizedDataItem label="Дата документа" value={doc.document_date} />
                    <RecognizedDataItem label="Отправитель" value={doc.sender} />
                    <RecognizedDataItem label="Получатель" value={doc.recipient} />
                    <RecognizedDataItem label="Перевозчик" value={doc.carrier} />
                    <RecognizedDataItem label="Водитель" value={doc.driver?.full_name} />
                    <RecognizedDataItem label="Автомобиль" value={doc.vehicle?.registration_plate} />
                </div>
            </div>
        ))}
    </div>
);

const TTNCard = ({ document, onEdit }) => {
    const [showDetails, setShowDetails] = useState(false);
    const [error, setError] = useState(null);
    const recognized = document.recognized_data ? document.recognized_data[0] : null;
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

    return (
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <p className="font-semibold text-blue-700">ТТН (ID: {document.id})</p>
                    <p className="text-xs text-gray-500">Загружен: {new Date(document.created_at).toLocaleString()}</p>
                </div>
                <StatusBadge status={document.recognition_status} />
            </div>

            {document.recognition_status === 'completed' && recognized ? (
                <div className="space-y-2">
                    <RecognizedDataItem label="Номер документа" value={recognized.document_number} />
                    <RecognizedDataItem label="Дата документа" value={recognized.document_date} />
                    <div className="pt-2">
                        <h4 className="font-medium text-sm mb-1">Позиции:</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                            {recognized.items.map((item, index) => (
                                <li key={index}>{item.name} - {item.quantity} {item.unit}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            ) : (
                <p className="text-sm text-gray-500 italic">Данные распознавания отсутствуют или документ в обработке.</p>
            )}

            <div className="flex justify-end gap-4 mt-4 pt-3 border-t">
                <button onClick={handleOpenFile} className="text-blue-600 hover:underline text-sm">Открыть файл</button>
                {userRole === 'foreman' && document.recognition_status === 'completed' && (
                    <button onClick={onEdit} className="text-green-600 hover:underline text-sm">Отредактировать</button>
                )}
                {document.recognized_data && (
                    <button onClick={() => setShowDetails(!showDetails)} className="text-blue-600 hover:underline text-sm">
                        {showDetails ? 'Скрыть детали' : 'Показать детали'}
                    </button>
                )}
            </div>

            {showDetails && document.recognized_data && (
               <RecognitionDetailsView data={document.recognized_data} />
            )}
        </div>
    );
};

export default TTNCard;

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import ApiService from '../../apiService';

const VerificationIssueCard = ({ issue, onUpdate }) => {
    const [showPhotos, setShowPhotos] = useState(false);

    const handleVerify = async (newStatus) => {
        const actionText = newStatus === 'verified' ? 'принять' : 'отклонить';
        if (!window.confirm(`Вы уверены, что хотите ${actionText} это устранение?`)) {
            return;
        }

        const toastId = toast.loading('Обновление статуса...');
        try {
            await ApiService.verifyIssueResolution(issue.id, newStatus);
            toast.success(`Устранение было ${newStatus === 'verified' ? 'принято' : 'отклонено'}.`, { id: toastId });
            if (onUpdate) onUpdate();
        } catch (error) {
            toast.error(`Ошибка: ${error.message}`, { id: toastId });
        }
    };

    const photos = issue.resolution_photos || [];
    const hasPhotos = photos.length > 0;

    return (
        <div className="border rounded-lg p-4 bg-white hover:shadow-md transition-all">
            <h3 className="font-semibold text-gray-800 mb-2">{issue.description}</h3>
            <p className="text-sm text-gray-500">Проект: {issue.project_name}</p>
            <p className="text-xs text-gray-400 mt-1 mb-3">
                Устранено прорабом: {issue.resolved_at ? new Date(issue.resolved_at).toLocaleString() : '-'}
            </p>

            {issue.resolution_comment && (
                <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-medium text-gray-700 mb-1">Комментарий прораба:</p>
                    <p className="text-sm text-gray-600">{issue.resolution_comment}</p>
                </div>
            )}

            {hasPhotos && (
                <div className="mb-3">
                    <button
                        onClick={() => setShowPhotos(!showPhotos)}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800 mb-2 flex items-center gap-1"
                    >
                        Фотографии ({photos.length})
                    </button>
                    
                    {showPhotos && (
                        <div className="grid grid-cols-3 gap-2">
                            {photos.map((photo, index) => (
                                <img 
                                    key={index}
                                    src={`${import.meta.env.VITE_API_URL}/uploads/${photo}`}
                                    alt={`Фото ${index + 1}`}
                                    className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition"
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div className="flex justify-end gap-2">
                <button 
                    onClick={() => handleVerify('rejected')} 
                    className="bg-red-100 text-red-700 px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-red-200"
                >
                    Отклонить
                </button>
                <button 
                    onClick={() => handleVerify('verified')} 
                    className="bg-green-600 text-white px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-green-700"
                >
                    Принять
                </button>
            </div>
        </div>
    );
};

export default VerificationIssueCard;

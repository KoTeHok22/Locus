import React, { useState } from 'react';
import toast from 'react-hot-toast';
import ApiService from '../../apiService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const VerificationTaskCard = ({ task, onUpdate }) => {
    const [showPhotos, setShowPhotos] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState(null);

    const handleVerify = async (newStatus) => {
        const actionText = newStatus === 'verified' ? 'принять' : 'отклонить';
        if (!window.confirm(`Вы уверены, что хотите ${actionText} эту задачу?`)) {
            return;
        }

        const toastId = toast.loading('Обновление статуса задачи...');
        try {
            await ApiService.verifyTask(task.project_id, task.id, newStatus);
            toast.success(`Задача была ${newStatus === 'verified' ? 'принята' : 'отклонена'}.`, { id: toastId });
            if (onUpdate) onUpdate();
        } catch (error) {
            toast.error(`Ошибка: ${error.message}`, { id: toastId });
        }
    };

    const photos = task.completion_photos || [];
    const hasPhotos = photos.length > 0;

    return (
        <>
            {selectedPhoto && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedPhoto(null)}
                >
                    <img 
                        src={selectedPhoto} 
                        alt="Увеличенное фото"
                        className="max-w-full max-h-full object-contain"
                    />
                    <button 
                        className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-75"
                        onClick={() => setSelectedPhoto(null)}
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>
            )}
            
            <div className="border rounded-lg p-4 bg-white hover:shadow-md transition-all">
                <h3 className="font-semibold text-gray-800 mb-2">{task.name}</h3>
                <p className="text-sm text-gray-500">Проект: {task.project_name}</p>
                <p className="text-xs text-gray-400 mt-1 mb-3">
                    Выполнена прорабом: {task.completed_at ? new Date(task.completed_at).toLocaleString() : '-'}
                </p>

                {/* Комментарий прораба */}
                {task.completion_comment && (
                    <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs font-medium text-gray-700 mb-1">Комментарий прораба:</p>
                        <p className="text-sm text-gray-600">{task.completion_comment}</p>
                    </div>
                )}

                {/* Фотографии */}
                {hasPhotos && (
                    <div className="mb-3">
                        <button
                            onClick={() => setShowPhotos(!showPhotos)}
                            className="text-xs font-medium text-blue-600 hover:text-blue-800 mb-2 flex items-center gap-1"
                        >
                            <i className={`fas fa-chevron-${showPhotos ? 'up' : 'down'}`}></i>
                            Фотографии ({photos.length})
                        </button>
                        
                        {showPhotos && (
                            <div className="grid grid-cols-3 gap-2">
                                {photos.map((photo, index) => (
                                    <img 
                                        key={index}
                                        src={`${API_BASE_URL}${photo}`}
                                        alt={`Фото ${index + 1}`}
                                        className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition"
                                        onClick={() => setSelectedPhoto(`${API_BASE_URL}${photo}`)}
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
        </>
    );
};

export default VerificationTaskCard;

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import ApiService from '../../apiService';
import { X, CheckCircle, XCircle } from 'lucide-react';

const VerifyResolutionModal = ({ issue, onClose, onUpdate }) => {
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState(null);

    const handleVerify = async (status) => {
        if (status === 'rejected' && !comment.trim()) {
            toast.error('При отклонении необходимо указать причину');
            return;
        }

        setIsSubmitting(true);
        const toastId = toast.loading('Отправка...');

        try {
            await ApiService.verifyIssueResolution(issue.id, status, comment);
            toast.success(
                status === 'verified' 
                    ? 'Устранение подтверждено!' 
                    : 'Устранение отклонено', 
                { id: toastId }
            );
            onUpdate();
            onClose();
        } catch (error) {
            console.error('Ошибка при верификации:', error);
            toast.error(`Не удалось выполнить верификацию: ${error.message}`, { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900">
                            Верификация устранения нарушения
                        </h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <X size={24} />
                        </button>
                    </div>
                    
                    {}
                    <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-700">Описание нарушения:</p>
                        <p className="text-sm text-gray-600 mt-1">{issue.description}</p>
                    </div>

                    {}
                    {issue.resolution_comment && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm font-medium text-blue-900">Комментарий прораба:</p>
                            <p className="text-sm text-blue-700 mt-1">{issue.resolution_comment}</p>
                        </div>
                    )}

                    {}
                    {issue.resolution_photos && issue.resolution_photos.length > 0 && (
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Фотографии устранения:
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {issue.resolution_photos.map((photo, index) => (
                                    <a
                                        key={index}
                                        href={`${import.meta.env.VITE_API_URL || 'http://localhost:8501'}${photo}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block"
                                    >
                                        <img 
                                            src={`${import.meta.env.VITE_API_URL || 'http://localhost:8501'}${photo}`}
                                            alt={`Устранение ${index + 1}`}
                                            className="w-full h-32 object-cover rounded-lg hover:opacity-75 transition cursor-pointer"
                                        />
                                    </a>
                                ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Нажмите на фото для увеличения</p>
                        </div>
                    )}

                    {}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Комментарий {selectedStatus === 'rejected' && <span className="text-red-500">*</span>}
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder={
                                selectedStatus === 'rejected'
                                    ? "Укажите причину отклонения..."
                                    : "Дополнительные замечания (необязательно)..."
                            }
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows="3"
                        />
                    </div>

                    {}
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                setSelectedStatus('verified');
                                handleVerify('verified');
                            }}
                            disabled={isSubmitting}
                            className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium flex items-center justify-center gap-2"
                        >
                            <CheckCircle size={20} />
                            Подтвердить устранение
                        </button>
                        <button
                            onClick={() => {
                                setSelectedStatus('rejected');
                                if (!comment.trim()) {
                                    toast.error('При отклонении необходимо указать причину');
                                    return;
                                }
                                handleVerify('rejected');
                            }}
                            disabled={isSubmitting}
                            className="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium flex items-center justify-center gap-2"
                        >
                            <XCircle size={20} />
                            Отклонить
                        </button>
                    </div>

                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="w-full mt-3 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    >
                        Закрыть
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VerifyResolutionModal;

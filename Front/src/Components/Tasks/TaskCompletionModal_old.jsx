import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import ApiService from '../../apiService';
import { getCurrentGeolocation } from '../../utils/geolocation';

const TaskCompletionModal = ({ task, onClose, onUpdate }) => {
    const [comment, setComment] = useState('');
    const [photos, setPhotos] = useState([]);
    const [photoPreviews, setPhotoPreviews] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef(null);

    const handlePhotoSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const validFiles = files.filter(file => {
            if (file.size > 10 * 1024 * 1024) {
                toast.error(`Файл ${file.name} слишком большой (макс. 10 МБ)`);
                return false;
            }
            if (!file.type.startsWith('image/')) {
                toast.error(`Файл ${file.name} не является изображением`);
                return false;
            }
            return true;
        });

        setPhotos(prev => [...prev, ...validFiles]);

        validFiles.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreviews(prev => [...prev, reader.result]);
            };
            reader.readAsDataURL(file);
        });
    };

    const handleRemovePhoto = (index) => {
        setPhotos(prev => prev.filter((_, i) => i !== index));
        setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleCapture = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleSubmit = async () => {
        if (photos.length === 0) {
            toast.error('Необходимо прикрепить минимум одно фото');
            return;
        }

        setIsSubmitting(true);
        try {
            await ApiService.updateTaskStatus(
                task.project_id,
                task.id,
                'completed',
                photos,
                comment
            );
            toast.success('Задача успешно завершена!');
            onUpdate();
            onClose();
        } catch (error) {
            console.error('Ошибка при завершении задачи:', error);
            toast.error(`Не удалось завершить задачу: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                        Завершить задачу
                    </h2>
                    <p className="text-sm text-gray-600 mb-4">{task.name}</p>

                    {/* Комментарий */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Комментарий (необязательно)
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Опишите выполненные работы..."
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            rows="3"
                        />
                    </div>

                    {/* Фотографии */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Фотографии <span className="text-red-500">*</span>
                            <span className="text-xs text-gray-500 ml-2">(минимум 1 фото)</span>
                        </label>
                        
                        {/* Превью фотографий */}
                        {photoPreviews.length > 0 && (
                            <div className="grid grid-cols-3 gap-2 mb-3">
                                {photoPreviews.map((preview, index) => (
                                    <div key={index} className="relative group">
                                        <img 
                                            src={preview} 
                                            alt={`Превью ${index + 1}`}
                                            className="w-full h-24 object-cover rounded-lg"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleRemovePhoto(index)}
                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <i className="fas fa-times text-xs"></i>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Кнопки добавления фото */}
                        <div className="flex gap-2">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                capture="environment"
                                onChange={handlePhotoSelect}
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={handleCapture}
                                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                            >
                                <i className="fas fa-camera"></i>
                                Сделать фото
                            </button>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition flex items-center justify-center gap-2"
                            >
                                <i className="fas fa-image"></i>
                                Выбрать из галереи
                            </button>
                        </div>
                    </div>

                    {/* Кнопки действий */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || photos.length === 0}
                            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium"
                        >
                            {isSubmitting ? 'Отправка...' : 'Завершить задачу'}
                        </button>
                        <button
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                        >
                            Отмена
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskCompletionModal;

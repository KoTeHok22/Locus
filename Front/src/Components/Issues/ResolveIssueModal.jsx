import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import ApiService from '../../apiService';
import { X } from 'lucide-react';

const ResolveIssueModal = ({ issue, onClose, onUpdate }) => {
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
            toast.error('Необходимо прикрепить минимум одно фото устранения');
            return;
        }

        setIsSubmitting(true);
        const toastId = toast.loading('Отправка...');

        try {
            await ApiService.resolveIssue(issue.id, photos, comment);
            toast.success('Нарушение отмечено как устраненное и отправлено на верификацию!', { id: toastId });
            onUpdate();
            onClose();
        } catch (error) {
            console.error('Ошибка при устранении нарушения:', error);
            toast.error(`Не удалось устранить нарушение: ${error.message}`, { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900">
                            Устранить нарушение
                        </h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <X size={24} />
                        </button>
                    </div>
                    
                    <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-700">Описание нарушения:</p>
                        <p className="text-sm text-gray-600 mt-1">{issue.description}</p>
                    </div>

                    {}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Комментарий об устранении (необязательно)
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Опишите, как было устранено нарушение..."
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            rows="3"
                        />
                    </div>

                    {}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Фотографии устранения <span className="text-red-500">*</span>
                            <span className="text-xs text-gray-500 ml-2">(минимум 1 фото)</span>
                        </label>
                        
                        {}
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
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {}
                        <div className="flex gap-2">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image}
                    <div className="flex gap-3">
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || photos.length === 0}
                            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium"
                        >
                            {isSubmitting ? 'Отправка...' : 'Отметить как устраненное'}
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

export default ResolveIssueModal;

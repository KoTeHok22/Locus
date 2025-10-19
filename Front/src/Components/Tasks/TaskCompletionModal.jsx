import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import ApiService from '../../apiService';
import { getCurrentGeolocation } from '../../utils/geolocation';

const TaskCompletionModal = ({ task, onClose, onUpdate }) => {
    const [comment, setComment] = useState('');
    const [photos, setPhotos] = useState([]);
    const [photoPreviews, setPhotoPreviews] = useState([]);
    const [materials, setMaterials] = useState([{ material_id: '', quantity: '' }]);
    const [availableMaterials, setAvailableMaterials] = useState([]);
    const [actualQuantity, setActualQuantity] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingMaterials, setIsLoadingMaterials] = useState(true);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const loadMaterials = async () => {
            try {
                const materialsData = await ApiService.getMaterials();
                setAvailableMaterials(materialsData);
            } catch (error) {
                console.error('Ошибка загрузки материалов:', error);
                toast.error('Не удалось загрузить справочник материалов');
            } finally {
                setIsLoadingMaterials(false);
            }
        };
        loadMaterials();
    }, []);

    const handleAddMaterial = () => {
        setMaterials([...materials, { material_id: '', quantity: '' }]);
    };

    const handleRemoveMaterial = (index) => {
        setMaterials(materials.filter((_, i) => i !== index));
    };

    const handleMaterialChange = (index, field, value) => {
        const newMaterials = [...materials];
        newMaterials[index][field] = value;
        setMaterials(newMaterials);
    };

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
        // Проверка обязательного поля "Объем выполненных работ"
        if (!actualQuantity || actualQuantity === '') {
            toast.error('Укажите объем выполненных работ');
            return;
        }
        
        const actualQty = parseFloat(actualQuantity);
        if (isNaN(actualQty) || actualQty <= 0) {
            toast.error('Объем работ должен быть положительным числом');
            return;
        }

        const validMaterials = materials.filter(m => m.material_id && m.quantity);
        for (const mat of validMaterials) {
            if (isNaN(mat.quantity) || parseFloat(mat.quantity) <= 0) {
                toast.error('Количество материала должно быть положительным числом');
                return;
            }
        }

        setIsSubmitting(true);
        const toastId = toast.loading('Получение геолокации...');
        
        try {
            const { latitude, longitude } = await getCurrentGeolocation();
            const geolocation = `${latitude},${longitude}`;
            
            toast.loading('Завершение задачи...', { id: toastId });
            
            await ApiService.updateTaskStatus(
                task.project_id,
                task.id,
                'completed',
                photos,
                comment,
                geolocation,
                validMaterials,
                actualQty
            );
            toast.success('Задача успешно завершена!', { id: toastId });
            onUpdate();
            onClose();
        } catch (error) {
            console.error('Ошибка при завершении задачи:', error);
            if (error.message.includes('геолокац')) {
                toast.error(`${error.message}`, { id: toastId });
            } else {
                toast.error(`Не удалось завершить задачу: ${error.message}`, { id: toastId });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                        Завершить задачу
                    </h2>
                    <p className="text-sm text-gray-600 mb-1">{task.name}</p>
                    {task.work_plan_item && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-xs text-blue-600 font-medium mb-1">Пункт плана работ:</p>
                            <p className="text-sm text-blue-900">
                                {task.work_plan_item.name}
                            </p>
                            <p className="text-xs text-blue-700 mt-1">
                                Плановый объем: {task.work_plan_item.quantity} {task.work_plan_item.unit}
                            </p>
                        </div>
                    )}

                    {/* Обязательное поле: Объем выполненных работ */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Объем выполненных работ <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={actualQuantity}
                                onChange={(e) => setActualQuantity(e.target.value)}
                                placeholder="Введите объем..."
                                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                            {task.work_plan_item && (
                                <span className="text-sm text-gray-600 whitespace-nowrap">
                                    из {task.work_plan_item.quantity} {task.work_plan_item.unit}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Укажите фактический объем выполненных работ
                        </p>
                    </div>

                    {}
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

                    {}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Фотографии
                            <span className="text-xs text-gray-500 ml-2">(необязательно)</span>
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
                                            <i className="fas fa-times text-xs"></i>
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
                                accept="image/*"
                                multiple
                                onChange={handlePhotoSelect}
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={handleCapture}
                                className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition font-medium"
                            >
                                Выбрать фото
                            </button>
                        </div>
                    </div>

                    {}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Использованные материалы
                                <span className="text-xs text-gray-500 ml-2">(необязательно)</span>
                            </label>
                            <button
                                type="button"
                                onClick={handleAddMaterial}
                                disabled={isLoadingMaterials}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:text-gray-400"
                            >
                                + Добавить материал
                            </button>
                        </div>

                        {isLoadingMaterials ? (
                            <p className="text-sm text-gray-500">Загрузка материалов...</p>
                        ) : (
                            <div className="space-y-2">
                                {materials.map((material, index) => (
                                    <div key={index} className="flex gap-2 items-center">
                                        <select
                                            value={material.material_id}
                                            onChange={(e) => handleMaterialChange(index, 'material_id', e.target.value)}
                                            className="flex-1 p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Выберите материал...</option>
                                            {availableMaterials.map((mat) => (
                                                <option key={mat.id} value={mat.id}>
                                                    {mat.name} ({mat.unit})
                                                </option>
                                            ))}
                                        </select>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            placeholder="Кол-во"
                                            value={material.quantity}
                                            onChange={(e) => handleMaterialChange(index, 'quantity', e.target.value)}
                                            className="w-24 p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                        />
                                        {materials.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveMaterial(index)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <i className="fas fa-times"></i>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
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

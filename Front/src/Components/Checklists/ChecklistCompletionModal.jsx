import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import ApiService from '../../apiService';
import { getCurrentGeolocation } from '../../utils/geolocation';

const ChecklistCompletionModal = ({ checklist, projectId, editingCompletion, onClose, onComplete }) => {
    const [itemsResponses, setItemsResponses] = useState({});
    const [notes, setNotes] = useState('');
    const [photos, setPhotos] = useState([]);
    const [photoPreviews, setPhotoPreviews] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [initializationGeo, setInitializationGeo] = useState(null);
    const [classifiers, setClassifiers] = useState([]);
    const [userRole, setUserRole] = useState(null);
    const fileInputRef = useRef(null);

    const sortedItems = checklist.items?.sort((a, b) => a.order - b.order) || [];
    
    const itemsByCategory = sortedItems.reduce((acc, item) => {
        const category = item.category || 'Общее';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(item);
        return acc;
    }, {});

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        setUserRole(userData.role);

        if (checklist.requires_initialization) {
            handleInitialization();
        }

        if (userData.role === 'inspector') {
            loadClassifiers();
        }

        const initialResponses = {};
        
        if (editingCompletion && editingCompletion.item_responses) {
            editingCompletion.item_responses.forEach(itemResponse => {
                initialResponses[itemResponse.item_id] = {
                    response: itemResponse.response,
                    comment: itemResponse.comment || '',
                    photos: itemResponse.photos || [],
                    classifier_code: itemResponse.classifier_code || null
                };
            });
            setNotes(editingCompletion.notes || '');
        } else {
            sortedItems.forEach(item => {
                initialResponses[item.id] = {
                    response: null,
                    comment: '',
                    photos: [],
                    classifier_code: null
                };
            });
        }
        
        setItemsResponses(initialResponses);
    }, [checklist, editingCompletion]);

    const loadClassifiers = async () => {
        try {
            const data = await ApiService.getClassifiers({ type: 'violation' });
            setClassifiers(data || []);
        } catch (error) {
            console.error('Ошибка загрузки классификаторов:', error);
        }
    };

    const handleInitialization = async () => {
        const toastId = toast.loading('Инициализация с геолокацией...');
        try {
            const { latitude, longitude } = await getCurrentGeolocation();
            const geolocation = `${latitude},${longitude}`;
            
            await ApiService.initializeChecklist(projectId, checklist.id, geolocation);
            setInitializationGeo(geolocation);
            toast.success('Инициализация выполнена', { id: toastId });
        } catch (error) {
            toast.error(`Ошибка инициализации: ${error.message}`, { id: toastId });
            onClose();
        }
    };

    const handleResponseChange = (itemId, response) => {
        setItemsResponses(prev => ({
            ...prev,
            [itemId]: {
                ...prev[itemId],
                response
            }
        }));
    };

    const handleCommentChange = (itemId, comment) => {
        setItemsResponses(prev => ({
            ...prev,
            [itemId]: {
                ...prev[itemId],
                comment
            }
        }));
    };

    const handleClassifierChange = (itemId, classifier_code) => {
        setItemsResponses(prev => ({
            ...prev,
            [itemId]: {
                ...prev[itemId],
                classifier_code
            }
        }));
    };

    const handleItemPhotoSelect = (itemId, files) => {
        const validFiles = Array.from(files).filter(file => {
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

        setItemsResponses(prev => ({
            ...prev,
            [itemId]: {
                ...prev[itemId],
                photos: [...(prev[itemId].photos || []), ...validFiles]
            }
        }));
    };

    const handleRemoveItemPhoto = (itemId, photoIndex) => {
        setItemsResponses(prev => ({
            ...prev,
            [itemId]: {
                ...prev[itemId],
                photos: prev[itemId].photos.filter((_, i) => i !== photoIndex)
            }
        }));
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

    const validateForm = () => {
        // Для чек-листа №1 все пункты обязательны
        if (checklist.type === 'opening') {
            const unansweredItems = sortedItems.filter(item => 
                !itemsResponses[item.id]?.response
            );
            
            if (unansweredItems.length > 0) {
                toast.error(`Необходимо ответить на все пункты (осталось: ${unansweredItems.length})`);
                return false;
            }
        }

        const noResponsesWithoutComment = Object.entries(itemsResponses).filter(
            ([itemId, data]) => data.response === 'no' && !data.comment
        );

        if (noResponsesWithoutComment.length > 0) {
            toast.error('Для ответа "НЕТ" необходимо добавить комментарий');
            return false;
        }

        if (userRole === 'inspector') {
            const noResponsesWithoutClassifier = Object.entries(itemsResponses).filter(
                ([itemId, data]) => data.response === 'no' && !data.classifier_code
            );

            if (noResponsesWithoutClassifier.length > 0) {
                toast.error('Для нарушений необходимо выбрать классификатор');
                return false;
            }
        }

        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        const toastId = toast.loading('Получение геолокации...');

        try {
            const { latitude, longitude } = await getCurrentGeolocation();
            const geolocation = `${latitude},${longitude}`;

            toast.loading('Сохранение чек-листа...', { id: toastId });

            const responses = Object.entries(itemsResponses)
                .filter(([itemId, data]) => data.response) // Только с ответами
                .map(([itemId, data]) => ({
                    item_id: parseInt(itemId),
                    response: data.response,
                    comment: data.comment || '',
                    photos: data.photos || [],
                    classifier_code: data.classifier_code || null
                }));

            if (editingCompletion) {
                await ApiService.updateChecklistCompletion(
                    editingCompletion.id,
                    responses,
                    notes,
                    photos,
                    geolocation
                );
                toast.success('Чек-лист успешно обновлен!', { id: toastId });
            } else {
                await ApiService.completeChecklist(
                    projectId,
                    checklist.id,
                    responses,
                    notes,
                    photos,
                    geolocation,
                    initializationGeo
                );

                const message = checklist.requires_approval 
                    ? 'Чек-лист заполнен и отправлен на согласование!' 
                    : 'Чек-лист успешно заполнен!';
                
                toast.success(message, { id: toastId });
            }
            onComplete();
        } catch (error) {
            console.error('Ошибка при заполнении чек-листа:', error);
            
            if (error.message && error.message.includes('уже заполнен сегодня')) {
                toast.error('Чек-лист уже заполнен сегодня. Закройте окно и нажмите "Редактировать".', { id: toastId, duration: 5000 });
            } else {
                toast.error(`Не удалось сохранить чек-лист: ${error.message}`, { id: toastId });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const answeredCount = Object.values(itemsResponses).filter(r => r.response).length;
    const totalCount = sortedItems.length;

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
                    <div className="flex items-start justify-between mb-2">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                {checklist.name}
                            </h2>
                            <p className="text-sm text-gray-600 mt-1">
                                {checklist.description}
                            </p>
                            {checklist.requires_initialization && initializationGeo && (
                                <p className="text-xs text-green-600 mt-1">
                                    ✓ Инициализировано на объекте
                                </p>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-600">
                            Отвечено: <span className="font-medium">{answeredCount}/{totalCount}</span>
                        </span>
                        {checklist.requires_approval && (
                            <span className="text-orange-600 text-xs">
                                Требует согласования Инспектором
                            </span>
                        )}
                    </div>
                </div>

                <div className="p-6">
                    {Object.entries(itemsByCategory).map(([category, items]) => (
                        <div key={category} className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">
                                {category}
                            </h3>
                            
                            <div className="space-y-4">
                                {items.map(item => {
                                    const response = itemsResponses[item.id];
                                    const showDetails = response?.response === 'no';
                                    
                                    return (
                                        <div key={item.id} className="border rounded-lg p-4 bg-gray-50">
                                            <div className="mb-3">
                                                <div className="flex items-start gap-2 mb-2">
                                                    <span className="text-sm text-gray-500 font-mono">#{item.order}</span>
                                                    <span className="flex-1 text-gray-900">{item.text}</span>
                                                    {item.is_required && (
                                                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                                                            Обязательно
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleResponseChange(item.id, 'yes')}
                                                        disabled={isSubmitting}
                                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                            response?.response === 'yes'
                                                                ? 'bg-green-600 text-white'
                                                                : 'bg-white border border-gray-300 text-gray-700 hover:border-green-500'
                                                        }`}
                                                    >
                                                        ✓ ДА
                                                    </button>
                                                    <button
                                                        onClick={() => handleResponseChange(item.id, 'no')}
                                                        disabled={isSubmitting}
                                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                            response?.response === 'no'
                                                                ? 'bg-red-600 text-white'
                                                                : 'bg-white border border-gray-300 text-gray-700 hover:border-red-500'
                                                        }`}
                                                    >
                                                        ✗ НЕТ
                                                    </button>
                                                    {item.allows_not_applicable && (
                                                        <button
                                                            onClick={() => handleResponseChange(item.id, 'not_applicable')}
                                                            disabled={isSubmitting}
                                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                                response?.response === 'not_applicable'
                                                                    ? 'bg-gray-600 text-white'
                                                                    : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-500'
                                                            }`}
                                                        >
                                                            − Не требуется
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {showDetails && (
                                                <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                                                    <p className="text-sm font-medium text-red-800 mb-2">
                                                        Создание {userRole === 'inspector' ? 'нарушения' : 'замечания'}
                                                    </p>

                                                    {userRole === 'inspector' && (
                                                        <div className="mb-2">
                                                            <label className="block text-xs text-gray-700 mb-1">
                                                                Классификатор нарушения *
                                                            </label>
                                                            <select
                                                                value={response?.classifier_code || ''}
                                                                onChange={(e) => handleClassifierChange(item.id, e.target.value)}
                                                                disabled={isSubmitting}
                                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                                                            >
                                                                <option value="">Выберите классификатор</option>
                                                                {classifiers.map(c => (
                                                                    <option key={c.code} value={c.code}>
                                                                        {c.code} - {c.title}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    )}

                                                    <div className="mb-2">
                                                        <label className="block text-xs text-gray-700 mb-1">
                                                            Комментарий *
                                                        </label>
                                                        <textarea
                                                            value={response?.comment || ''}
                                                            onChange={(e) => handleCommentChange(item.id, e.target.value)}
                                                            disabled={isSubmitting}
                                                            rows={2}
                                                            placeholder="Опишите нарушение..."
                                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-xs text-gray-700 mb-1">
                                                            Фотографии (рекомендуется)
                                                        </label>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            multiple
                                                            onChange={(e) => handleItemPhotoSelect(item.id, e.target.files)}
                                                            disabled={isSubmitting}
                                                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-red-100 file:text-red-700 hover:file:bg-red-200"
                                                        />
                                                        {response?.photos && response.photos.length > 0 && (
                                                            <div className="mt-2 flex gap-2 flex-wrap">
                                                                {response.photos.map((photo, idx) => (
                                                                    <div key={idx} className="relative group">
                                                                        <img
                                                                            src={URL.createObjectURL(photo)}
                                                                            alt={`Фото ${idx + 1}`}
                                                                            className="w-16 h-16 object-cover rounded"
                                                                        />
                                                                        <button
                                                                            onClick={() => handleRemoveItemPhoto(item.id, idx)}
                                                                            disabled={isSubmitting}
                                                                            className="absolute top-0 right-0 bg-red-600 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100"
                                                                        >
                                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                            </svg>
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Общие фотографии объекта (необязательно)
                        </label>
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
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors text-sm"
                        >
                            📷 Добавить фото
                        </button>

                        {photoPreviews.length > 0 && (
                            <div className="mt-3 grid grid-cols-3 md:grid-cols-4 gap-3">
                                {photoPreviews.map((preview, index) => (
                                    <div key={index} className="relative group">
                                        <img
                                            src={preview}
                                            alt={`Preview ${index + 1}`}
                                            className="w-full h-24 object-cover rounded-lg"
                                        />
                                        <button
                                            onClick={() => handleRemovePhoto(index)}
                                            disabled={isSubmitting}
                                            className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Дополнительные комментарии
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            disabled={isSubmitting}
                            rows={3}
                            placeholder="Введите дополнительную информацию..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 resize-none"
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                            {isSubmitting ? 'Сохранение...' : 
                             checklist.requires_approval ? 'Отправить на согласование' : 'Сохранить чек-лист'}
                        </button>
                        <button
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                            Отмена
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChecklistCompletionModal;

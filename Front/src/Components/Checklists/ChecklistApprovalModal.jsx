import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import ApiService from '../../apiService';

const ChecklistApprovalModal = ({ completion, onClose, onComplete }) => {
    const [action, setAction] = useState(null); // 'approve' or 'reject'
    const [rejectionReason, setRejectionReason] = useState('');
    const [document, setDocument] = useState(null);
    const [documentPreview, setDocumentPreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef(null);

    const sortedItems = completion.checklist.items?.sort((a, b) => a.order - b.order) || [];
    
    const itemsByCategory = sortedItems.reduce((acc, item) => {
        const category = item.category || 'Общее';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(item);
        return acc;
    }, {});

    const handleDocumentSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 20 * 1024 * 1024) {
            toast.error('Файл слишком большой (макс. 20 МБ)');
            return;
        }

        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/png'
        ];

        if (!allowedTypes.includes(file.type)) {
            toast.error('Неподдерживаемый формат файла');
            return;
        }

        setDocument(file);
        setDocumentPreview(file.name);
    };

    const handleApprove = async () => {
        setIsSubmitting(true);
        const toastId = toast.loading('Согласование чек-листа...');

        try {
            await ApiService.approveChecklist(completion.id, 'approved', null, document);
            toast.success('Чек-лист согласован! Объект активирован.', { id: toastId });
            onComplete();
        } catch (error) {
            toast.error(`Ошибка: ${error.message}`, { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            toast.error('Необходимо указать причину отклонения');
            return;
        }

        setIsSubmitting(true);
        const toastId = toast.loading('Отклонение чек-листа...');

        try {
            await ApiService.approveChecklist(completion.id, 'rejected', rejectionReason);
            toast.success('Чек-лист отклонен', { id: toastId });
            onComplete();
        } catch (error) {
            toast.error(`Ошибка: ${error.message}`, { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getResponseLabel = (response) => {
        switch (response) {
            case 'yes': return { text: 'ДА', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-300' };
            case 'no': return { text: 'НЕТ', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-300' };
            case 'not_applicable': return { text: 'Не требуется', color: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-300' };
            default: return { text: 'Нет ответа', color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200' };
        }
    };

    const completionRate = Object.keys(completion.items_data).length / sortedItems.length * 100;

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto sm:rounded-3xl">
                <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10 sm:p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                            <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
                                Согласование: {completion.checklist.name}
                            </h2>
                            <p className="text-sm text-gray-600 mt-1">
                                Проект: {completion.project?.name}
                            </p>
                            <p className="text-sm text-gray-600">
                                Заполнил: {completion.completed_by.first_name} {completion.completed_by.last_name}
                            </p>
                            <p className="text-xs text-gray-500">
                                Дата: {new Date(completion.completion_date).toLocaleString('ru-RU')}
                            </p>
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

                    <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                                className="h-2 rounded-full bg-blue-600 transition-all"
                                style={{ width: `${completionRate}%` }}
                            />
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                            {Math.round(completionRate)}%
                        </span>
                    </div>
                </div>

                <div className="p-4 sm:p-6">
                    {Object.entries(itemsByCategory).map(([category, items]) => (
                        <div key={category} className="mb-4 sm:mb-6">
                            <h3 className="text-base font-semibold text-gray-800 mb-3 border-b pb-2 sm:text-lg">
                                {category}
                            </h3>
                            
                            <div className="space-y-3">
                                {items.map(item => {
                                    const response = completion.items_data[item.id];
                                    const label = getResponseLabel(response ? 'yes' : 'no');
                                    
                                    return (
                                        <div
                                            key={item.id}
                                            className={`p-4 rounded-lg border ${label.border} ${label.bg}`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <span className="text-xs text-gray-500 font-mono">#{item.order}</span>
                                                <div className="flex-1">
                                                    <p className="text-gray-900">{item.text}</p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-lg text-sm font-medium ${label.color} ${label.bg} border ${label.border}`}>
                                                    {label.text}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {completion.photos && completion.photos.length > 0 && (
                        <div className="mb-4 sm:mb-6">
                            <h3 className="text-base font-semibold text-gray-800 mb-3 sm:text-lg">Фотографии</h3>
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4">
                                {completion.photos.map((photo, index) => (
                                    <a
                                        key={index}
                                        href={`${import.meta.env.VITE_API_URL}/uploads/${photo}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block"
                                    >
                                        <img
                                            src={`${import.meta.env.VITE_API_URL}/uploads/${photo}`}
                                            alt={`Фото ${index + 1}`}
                                            className="w-full h-32 object-cover rounded-lg hover:opacity-90 transition-opacity"
                                        />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {completion.notes && (
                        <div className="mb-4 sm:mb-6">
                            <h3 className="text-base font-semibold text-gray-800 mb-2 sm:text-lg">Комментарии</h3>
                            <p className="text-gray-700 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
                                {completion.notes}
                            </p>
                        </div>
                    )}

                    {completion.geolocation && (
                        <div className="mb-6 text-xs text-gray-500">
                            <span className="font-medium">Координаты:</span> {completion.geolocation}
                        </div>
                    )}

                    {!action && (
                        <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
                            <button
                                onClick={() => setAction('approve')}
                                disabled={isSubmitting}
                                className="flex-1 px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors font-medium text-lg"
                            >
                                ✓ Согласовать
                            </button>
                            <button
                                onClick={() => setAction('reject')}
                                disabled={isSubmitting}
                                className="flex-1 px-6 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors font-medium text-lg"
                            >
                                ✗ Отклонить
                            </button>
                        </div>
                    )}

                    {action === 'approve' && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <h4 className="font-semibold text-green-800 mb-3">Согласование чек-листа</h4>
                            
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Прикрепить Акт открытия объекта (PDF/DOC/IMG) (необязательно)
                                </label>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf,.doc,.docx,image/*"
                                    onChange={handleDocumentSelect}
                                    disabled={isSubmitting}
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isSubmitting}
                                    className="px-4 py-2 bg-white border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-colors"
                                >
                                    📎 Выбрать файл
                                </button>
                                {documentPreview && (
                                    <p className="mt-2 text-sm text-green-700">
                                        Выбран файл: <span className="font-medium">{documentPreview}</span>
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleApprove}
                                    disabled={isSubmitting}
                                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors font-medium"
                                >
                                    {isSubmitting ? 'Согласование...' : 'Подтвердить согласование'}
                                </button>
                                <button
                                    onClick={() => {
                                        setAction(null);
                                        setDocument(null);
                                        setDocumentPreview(null);
                                    }}
                                    disabled={isSubmitting}
                                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                    Назад
                                </button>
                            </div>
                        </div>
                    )}

                    {action === 'reject' && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <h4 className="font-semibold text-red-800 mb-3">Отклонение чек-листа</h4>
                            
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Причина отклонения *
                                </label>
                                <textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    disabled={isSubmitting}
                                    rows={4}
                                    placeholder="Укажите причину отклонения..."
                                    className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 resize-none"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleReject}
                                    disabled={isSubmitting || !rejectionReason.trim()}
                                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors font-medium"
                                >
                                    {isSubmitting ? 'Отклонение...' : 'Подтвердить отклонение'}
                                </button>
                                <button
                                    onClick={() => {
                                        setAction(null);
                                        setRejectionReason('');
                                    }}
                                    disabled={isSubmitting}
                                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                    Назад
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChecklistApprovalModal;

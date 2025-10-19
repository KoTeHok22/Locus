import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import ApiService from '../../apiService';

const ChecklistHistory = ({ projectId, checklistType, onClose }) => {
    const [completions, setCompletions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCompletion, setSelectedCompletion] = useState(null);

    useEffect(() => {
        loadCompletions();
    }, [projectId, checklistType]);

    const loadCompletions = async () => {
        try {
            const data = await ApiService.getChecklistCompletions(projectId, checklistType);
            setCompletions(data);
        } catch (error) {
            toast.error('Не удалось загрузить историю заполнений');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = async (completionId) => {
        try {
            const data = await ApiService.getChecklistCompletionDetails(completionId);
            setSelectedCompletion(data);
        } catch (error) {
            toast.error('Не удалось загрузить детали');
            console.error(error);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusConfig = (status) => {
        switch (status) {
            case 'approved':
                return {
                    text: 'Согласован',
                    color: 'text-green-700',
                    bg: 'bg-green-100',
                    border: 'border-green-200'
                };
            case 'pending':
                return {
                    text: 'На согласовании',
                    color: 'text-amber-700',
                    bg: 'bg-amber-100',
                    border: 'border-amber-200'
                };
            case 'rejected':
                return {
                    text: 'Отклонен',
                    color: 'text-red-700',
                    bg: 'bg-red-100',
                    border: 'border-red-200'
                };
            case 'not_required':
                return {
                    text: 'Не требует согласования',
                    color: 'text-slate-700',
                    bg: 'bg-slate-100',
                    border: 'border-slate-200'
                };
            default:
                return {
                    text: status,
                    color: 'text-slate-700',
                    bg: 'bg-slate-100',
                    border: 'border-slate-200'
                };
        }
    };

    const getCompletionRate = (itemsData, checklist) => {
        const totalItems = checklist.items?.length || 0;
        const checkedItems = Object.values(itemsData).filter(v => v).length;
        return totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
                <div className="bg-white rounded-lg shadow-xl p-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                </div>
            </div>
        );
    }

    if (selectedCompletion) {
        const sortedItems = selectedCompletion.checklist.items?.sort((a, b) => a.order - b.order) || [];
        const completionRate = getCompletionRate(selectedCompletion.items_data, selectedCompletion.checklist);

        return (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    {selectedCompletion.checklist.name}
                                </h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    Заполнено: {formatDate(selectedCompletion.completion_date)}
                                </p>
                                <p className="text-sm text-gray-600">
                                    Заполнил: {selectedCompletion.completed_by.first_name} {selectedCompletion.completed_by.last_name}
                                </p>
                                {selectedCompletion.approved_at && selectedCompletion.approved_by && (
                                    <p className="text-sm text-gray-600">
                                        Согласовано: {formatDate(selectedCompletion.approved_at)} — {selectedCompletion.approved_by.first_name} {selectedCompletion.approved_by.last_name}
                                    </p>
                                )}
                                {selectedCompletion.approval_status && (
                                    <div className="mt-2">
                                        <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${
                                            getStatusConfig(selectedCompletion.approval_status).border
                                        } ${getStatusConfig(selectedCompletion.approval_status).bg} ${
                                            getStatusConfig(selectedCompletion.approval_status).color
                                        }`}>
                                            {getStatusConfig(selectedCompletion.approval_status).text}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={async () => {
                                        try {
                                            await ApiService.downloadChecklist(selectedCompletion.id);
                                            toast.success('Чек-лист скачан');
                                        } catch (error) {
                                            toast.error('Не удалось скачать чек-лист');
                                            console.error(error);
                                        }
                                    }}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                    title="Скачать DOCX"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Скачать DOCX
                                </button>
                                <button
                                    onClick={() => setSelectedCompletion(null)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {}
                        <div className="mt-4 flex items-center gap-4">
                            <div className="flex-1 bg-gray-200 rounded-full h-3">
                                <div
                                    className={`h-3 rounded-full transition-all ${
                                        completionRate === 100 ? 'bg-green-600' : 'bg-blue-600'
                                    }`}
                                    style={{ width: `${completionRate}%` }}
                                />
                            </div>
                            <span className="text-sm font-medium text-gray-700">
                                {completionRate}%
                            </span>
                        </div>
                    </div>

                    <div className="p-6">
                        {}
                        <div className="mb-6">
                            <h3 className="text-sm font-semibold text-gray-700 mb-3">Пункты чек-листа</h3>
                            <div className="space-y-2">
                                {sortedItems.map(item => {
                                    const isChecked = selectedCompletion.items_data[item.id];
                                    return (
                                        <div
                                            key={item.id}
                                            className={`flex items-start gap-3 p-3 rounded-lg border ${
                                                isChecked
                                                    ? 'bg-green-50 border-green-300'
                                                    : 'bg-red-50 border-red-300'
                                            }`}
                                        >
                                            <div className="mt-1">
                                                {isChecked ? (
                                                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <span className={isChecked ? 'text-gray-900' : 'text-gray-700'}>
                                                    {item.text}
                                                </span>
                                                {item.is_required && (
                                                    <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                                                        Обязательно
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {}
                        {selectedCompletion.photos && selectedCompletion.photos.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Фотографии</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {selectedCompletion.photos.map((photo, index) => (
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
                                                className="w-full h-40 object-cover rounded-lg hover:opacity-90 transition-opacity"
                                            />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {}
                        {selectedCompletion.notes && (
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-gray-700 mb-2">Комментарии</h3>
                                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
                                    {selectedCompletion.notes}
                                </p>
                            </div>
                        )}

                        {}
                        {selectedCompletion.geolocation && (
                            <div className="text-xs text-gray-500">
                                Координаты: {selectedCompletion.geolocation}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">История заполнений</h2>
                            <p className="text-sm text-gray-600 mt-1">
                                {checklistType === 'opening' ? 'Чек-листы открытия объекта' : 'Ежедневные чек-листы'}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    {completions.length === 0 ? (
                        <div className="text-center py-12">
                            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-gray-600">Нет заполненных чек-листов</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {completions.map(completion => {
                                const completionRate = getCompletionRate(completion.items_data, completion.checklist);
                                const statusConfig = getStatusConfig(completion.approval_status);
                                return (
                                    <div
                                        key={completion.id}
                                        className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer"
                                        onClick={() => handleViewDetails(completion.id)}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-medium text-gray-900">{completion.checklist.name}</h3>
                                                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${
                                                        statusConfig.border
                                                    } ${statusConfig.bg} ${statusConfig.color}`}>
                                                        {statusConfig.text}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {formatDate(completion.completion_date)}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    {completion.completed_by.first_name} {completion.completed_by.last_name}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="text-right">
                                                    <div className={`text-2xl font-bold ${
                                                        completionRate === 100 ? 'text-green-600' : 'text-blue-600'
                                                    }`}>
                                                        {completionRate}%
                                                    </div>
                                                    <div className="text-xs text-gray-500">выполнено</div>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        ApiService.downloadChecklist(completion.id)
                                                            .then(() => toast.success('Чек-лист скачан'))
                                                            .catch(() => toast.error('Ошибка скачивания'));
                                                    }}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                    title="Скачать DOCX"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                </button>
                                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                        </div>

                                        {}
                                        <div className="flex items-center gap-3 text-xs text-gray-500">
                                            {completion.photos && completion.photos.length > 0 && (
                                                <span className="flex items-center gap-1">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    {completion.photos.length} фото
                                                </span>
                                            )}
                                            {completion.notes && (
                                                <span className="flex items-center gap-1">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                                    </svg>
                                                    Есть комментарии
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChecklistHistory;

import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, MapPin, Calendar, User, Clock, FileText, Image as ImageIcon, CheckCircle } from 'lucide-react';
import ApiService from '../../apiService';
import { translate } from '../../utils/translation';

const IssueDetailsModal = ({ issueId, onClose }) => {
    const [issue, setIssue] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchIssueDetails = async () => {
            try {
                const data = await ApiService.getIssueDetails(issueId);
                setIssue(data);
            } catch (err) {
                console.error('Error fetching issue details:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchIssueDetails();
    }, [issueId]);

    if (loading) {
        return (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center z-[10000] p-4" onClick={onClose}>
                <div className="w-full max-w-3xl rounded-3xl bg-white p-6">
                    <p className="text-slate-500">Загрузка данных...</p>
                </div>
            </div>
        );
    }

    if (!issue) {
        return (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center z-[10000] p-4" onClick={onClose}>
                <div className="w-full max-w-3xl rounded-3xl bg-white p-6">
                    <p className="text-red-500">Не удалось загрузить данные о нарушении</p>
                </div>
            </div>
        );
    }

    const getStatusColor = (status) => {
        switch(status) {
            case 'open': return 'bg-red-100 text-red-700 border-red-200';
            case 'pending_verification': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'resolved': return 'bg-green-100 text-green-700 border-green-200';
            case 'rejected': return 'bg-slate-100 text-slate-700 border-slate-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const getTypeColor = (type) => {
        return type === 'violation' 
            ? 'bg-red-100 text-red-700 border-red-200' 
            : 'bg-orange-100 text-orange-700 border-orange-200';
    };

    const getTypeLabel = (type) => {
        return type === 'violation' ? 'Нарушение' : 'Замечание';
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center z-[10000] p-4" onClick={onClose}>
            <div className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-3xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-red-100 p-2">
                            <AlertTriangle size={24} className="text-red-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Детали нарушения</h2>
                            <p className="text-sm text-slate-500">Полная информация о нарушении #{issue.id}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 100px)' }}>
                    <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                        <div className="mb-4 flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${getTypeColor(issue.type)}`}>
                                {getTypeLabel(issue.type)}
                            </span>
                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${getStatusColor(issue.status)}`}>
                                {translate(issue.status)}
                            </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Описание</h3>
                        <p className="mt-2 text-sm text-slate-700">{issue.description || 'Нет описания'}</p>
                    </div>

                    <div className="mb-6 grid gap-4 sm:grid-cols-2">
                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                            <div className="flex items-start gap-3">
                                <div className="rounded-lg bg-blue-100 p-2">
                                    <Calendar size={20} className="text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Дата создания</p>
                                    <p className="mt-1 text-sm font-medium text-slate-900">
                                        {new Date(issue.created_at).toLocaleString('ru-RU', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {issue.due_date && (
                            <div className="rounded-xl border border-slate-200 bg-white p-4">
                                <div className="flex items-start gap-3">
                                    <div className="rounded-lg bg-orange-100 p-2">
                                        <Clock size={20} className="text-orange-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Срок устранения</p>
                                        <p className="mt-1 text-sm font-medium text-slate-900">
                                            {new Date(issue.due_date).toLocaleDateString('ru-RU', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {issue.created_by_username && (
                            <div className="rounded-xl border border-slate-200 bg-white p-4">
                                <div className="flex items-start gap-3">
                                    <div className="rounded-lg bg-purple-100 p-2">
                                        <User size={20} className="text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Создал</p>
                                        <p className="mt-1 text-sm font-medium text-slate-900">{issue.created_by_username}</p>
                                        {issue.created_by_role && (
                                            <p className="mt-0.5 text-xs text-slate-500">
                                                {issue.created_by_role === 'client' && 'Служба строительного контроля (заказчик)'}
                                                {issue.created_by_role === 'foreman' && 'Прораб'}
                                                {issue.created_by_role === 'inspector' && 'Инспектор'}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {issue.geolocation && (
                            <div className="rounded-xl border border-slate-200 bg-white p-4">
                                <div className="flex items-start gap-3">
                                    <div className="rounded-lg bg-green-100 p-2">
                                        <MapPin size={20} className="text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Геолокация</p>
                                        <p className="mt-1 font-mono text-xs text-slate-700">{issue.geolocation}</p>
                                        <a 
                                            href={`https://www.openstreetmap.org/?mlat=${issue.geolocation.split(',')[0]}&mlon=${issue.geolocation.split(',')[1]}&zoom=15`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-1 inline-block text-xs text-blue-600 hover:underline"
                                        >
                                            Показать на карте
                                        </a>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {issue.classifier_name && (
                        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
                            <div className="flex items-start gap-3">
                                <div className="rounded-lg bg-slate-100 p-2">
                                    <FileText size={20} className="text-slate-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Классификатор</p>
                                    <p className="mt-1 text-sm font-medium text-slate-900">{issue.classifier_name}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {issue.resolution_photos && issue.resolution_photos.length > 0 && (
                        <div className="mb-6">
                            <h4 className="mb-3 flex items-center gap-2 text-base font-bold text-slate-900">
                                <ImageIcon size={18} className="text-slate-500" />
                                Фотографии устранения
                            </h4>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                {issue.resolution_photos.map((photo, index) => (
                                    <div key={index} className="overflow-hidden rounded-xl border border-slate-200">
                                        <img 
                                            src={photo} 
                                            alt={`Фото ${index + 1}`}
                                            className="h-32 w-full object-cover transition-transform hover:scale-105"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {issue.resolution_comment && (
                        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4">
                            <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-green-900">
                                <CheckCircle size={16} />
                                Комментарий к устранению
                            </h4>
                            <p className="text-sm text-green-800">{issue.resolution_comment}</p>
                        </div>
                    )}

                    {issue.verification_comment && (
                        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
                            <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-blue-900">
                                <FileText size={16} />
                                Комментарий верификации
                            </h4>
                            <p className="text-sm text-blue-800">{issue.verification_comment}</p>
                        </div>
                    )}

                    {issue.resolved_at && (
                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                            <div className="flex items-start gap-3">
                                <div className="rounded-lg bg-green-100 p-2">
                                    <CheckCircle size={20} className="text-green-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Дата устранения</p>
                                    <p className="mt-1 text-sm font-medium text-slate-900">
                                        {new Date(issue.resolved_at).toLocaleString('ru-RU', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default IssueDetailsModal;

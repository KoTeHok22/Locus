import React, { useState, useEffect } from 'react';
import { CheckCircle, Image, MessageSquare, MapPin, Clock, FileCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import ApiService from '../../apiService';
import ChecklistApprovalModal from './ChecklistApprovalModal';

const PendingApprovalCard = ({ completion, onView }) => {
    return (
        <div 
            className="group flex flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:border-orange-200 hover:shadow-lg cursor-pointer"
            onClick={() => onView(completion)}
        >
            <div className="flex items-start justify-between gap-3 mb-4">
                <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-slate-900 group-hover:text-orange-700">
                        {completion.checklist.name}
                    </h3>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                        <MapPin size={14} className="text-slate-400" />
                        {completion.project.address}
                    </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-100 bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-orange-600">
                    <Clock size={12} />
                    Ожидает согласования
                </span>
            </div>

            <div className="space-y-2 text-sm text-slate-600 mb-4">
                <div className="flex items-start gap-2">
                    <span className="font-semibold text-slate-700 min-w-[80px]">Проект:</span>
                    <span>{completion.project.name}</span>
                </div>
                <div className="flex items-start gap-2">
                    <span className="font-semibold text-slate-700 min-w-[80px]">Заполнил:</span>
                    <span>{completion.completed_by.first_name} {completion.completed_by.last_name}</span>
                </div>
                <div className="flex items-start gap-2">
                    <span className="font-semibold text-slate-700 min-w-[80px]">Дата:</span>
                    <span>
                        {new Date(completion.completion_date).toLocaleString('ru-RU', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </span>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-4 text-xs text-slate-500">
                {completion.photos && completion.photos.length > 0 && (
                    <span className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-1">
                        <Image size={14} className="text-slate-400" />
                        {completion.photos.length} фото
                    </span>
                )}
                {completion.notes && (
                    <span className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-1">
                        <MessageSquare size={14} className="text-slate-400" />
                        Есть комментарии
                    </span>
                )}
                {completion.geolocation && (
                    <span className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-1">
                        <MapPin size={14} className="text-slate-400" />
                        С геолокацией
                    </span>
                )}
            </div>

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onView(completion);
                }}
                className="mt-auto rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
                Рассмотреть →
            </button>
        </div>
    );
};

const PendingApprovalsList = () => {
    const [pendingCompletions, setPendingCompletions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCompletion, setSelectedCompletion] = useState(null);

    useEffect(() => {
        loadPendingApprovals();
    }, []);

    const loadPendingApprovals = async () => {
        try {
            const data = await ApiService.getPendingApprovals();
            setPendingCompletions(data || []);
        } catch (error) {
            toast.error('Не удалось загрузить список на согласование');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewCompletion = async (completion) => {
        try {
            const fullData = await ApiService.getChecklistCompletionDetails(completion.id);
            setSelectedCompletion(fullData);
        } catch (error) {
            toast.error('Не удалось загрузить детали');
            console.error(error);
        }
    };

    const handleCompleteApproval = () => {
        setSelectedCompletion(null);
        loadPendingApprovals();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center rounded-2xl bg-slate-50 p-10">
                <p className="text-slate-500">Загрузка...</p>
            </div>
        );
    }

    return (
        <>
            <div className="flex flex-col gap-6 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">Чек-листы на согласование</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Список чек-листов, ожидающих вашего согласования
                    </p>
                </div>

                {pendingCompletions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-50 p-10">
                        <CheckCircle size={64} className="text-slate-300 mb-4" />
                        <h2 className="text-lg font-semibold text-slate-900">
                            Нет чек-листов на согласование
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Все чек-листы согласованы или ожидают заполнения
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {pendingCompletions.map(completion => (
                            <PendingApprovalCard
                                key={completion.id}
                                completion={completion}
                                onView={handleViewCompletion}
                            />
                        ))}
                    </div>
                )}
            </div>

            {selectedCompletion && (
                <ChecklistApprovalModal
                    completion={selectedCompletion}
                    onClose={() => setSelectedCompletion(null)}
                    onComplete={handleCompleteApproval}
                />
            )}
        </>
    );
};

export default PendingApprovalsList;

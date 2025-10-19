import React from 'react';
import { Calendar, CheckCircle2, Clock, AlertCircle, FileCheck } from 'lucide-react';
import { translate } from '../../utils/translation';

const TaskCard = ({ task }) => {
    const getStatusConfig = (status) => {
        switch (status) {
            case 'pending':
                return {
                    icon: Clock,
                    color: 'text-amber-600',
                    bg: 'bg-amber-50',
                    border: 'border-amber-200',
                    text: 'Ожидает'
                };
            case 'completed':
                return {
                    icon: CheckCircle2,
                    color: 'text-green-600',
                    bg: 'bg-green-50',
                    border: 'border-green-200',
                    text: 'Выполнена'
                };
            case 'verified':
                return {
                    icon: FileCheck,
                    color: 'text-blue-600',
                    bg: 'bg-blue-50',
                    border: 'border-blue-200',
                    text: 'Верифицирована'
                };
            case 'rejected':
                return {
                    icon: AlertCircle,
                    color: 'text-red-600',
                    bg: 'bg-red-50',
                    border: 'border-red-200',
                    text: 'Отклонена'
                };
            default:
                return {
                    icon: Clock,
                    color: 'text-slate-600',
                    bg: 'bg-slate-50',
                    border: 'border-slate-200',
                    text: status
                };
        }
    };

    const statusConfig = getStatusConfig(task.status);
    const StatusIcon = statusConfig.icon;

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div className={`rounded-2xl border ${statusConfig.border} ${statusConfig.bg} p-4`}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900 truncate">{task.name}</h3>
                    {task.work_plan_item && (
                        <p className="mt-1 text-xs text-slate-600">
                            {task.work_plan_item.name}
                        </p>
                    )}
                    
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusConfig.border} ${statusConfig.bg} ${statusConfig.color}`}
                        >
                            <StatusIcon size={12} />
                            {statusConfig.text}
                        </span>
                    </div>

                    <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                            <Calendar size={14} className="text-slate-400" />
                            <span>{formatDate(task.start_date)}</span>
                        </div>
                        <span>→</span>
                        <div className="flex items-center gap-1">
                            <Calendar size={14} className="text-slate-400" />
                            <span>{formatDate(task.end_date)}</span>
                        </div>
                    </div>

                    {task.work_plan_item && (
                        <div className="mt-2 text-xs text-slate-500">
                            <span>Объем: </span>
                            <span className="font-medium text-slate-700">
                                {task.work_plan_item.quantity} {task.work_plan_item.unit}
                            </span>
                            {task.actual_quantity !== null && task.actual_quantity !== undefined && (
                                <span className="ml-2">
                                    (факт: <span className="font-medium text-slate-700">{task.actual_quantity}</span>)
                                </span>
                            )}
                        </div>
                    )}

                    {task.completion_comment && (
                        <div className="mt-2 rounded-lg bg-white/60 p-2 text-xs text-slate-600">
                            <span className="font-medium">Комментарий: </span>
                            {task.completion_comment}
                        </div>
                    )}

                    {task.completion_photos && task.completion_photos.length > 0 && (
                        <div className="mt-2">
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                                <FileCheck size={14} className="text-slate-400" />
                                <span>{task.completion_photos.length} фото</span>
                            </div>
                        </div>
                    )}
                </div>
                <StatusIcon size={20} className={statusConfig.color} />
            </div>
        </div>
    );
};

export default TaskCard;

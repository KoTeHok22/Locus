import React, { useState, useEffect } from 'react';
import { Calendar, AlertTriangle, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import ApiService from '../../apiService';

const GanttChart = ({ projectId }) => {
    const [ganttData, setGanttData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadGanttData();
    }, [projectId]);

    const loadGanttData = async () => {
        setIsLoading(true);
        try {
            const data = await ApiService.getGanttChart(projectId);
            setGanttData(data);
        } catch (error) {
            toast.error(`Ошибка загрузки: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const getRiskColor = (riskLevel) => {
        switch (riskLevel) {
            case 'high':
                return 'bg-red-500';
            case 'medium':
                return 'bg-amber-500';
            case 'low':
                return 'bg-emerald-500';
            default:
                return 'bg-slate-400';
        }
    };

    const getRiskBadge = (riskLevel, isDelayed) => {
        if (isDelayed) {
            return (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 text-xs font-semibold">
                    <AlertTriangle size={12} />
                    Просрочено
                </span>
            );
        }
        
        switch (riskLevel) {
            case 'high':
                return <span className="inline-flex items-center gap-1 rounded-full bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 text-xs font-semibold">
                    <AlertTriangle size={12} />
                    Высокий риск
                </span>;
            case 'medium':
                return <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 text-xs font-semibold">
                    <Clock size={12} />
                    Средний риск
                </span>;
            case 'low':
                return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-xs font-semibold">
                    <CheckCircle size={12} />
                    Норма
                </span>;
            default:
                return null;
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'completed':
                return 'Завершено';
            case 'in_progress':
                return 'В работе';
            case 'not_started':
                return 'Не начато';
            default:
                return status;
        }
    };

    if (isLoading) {
        return (
            <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 p-4 sm:p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-slate-200 rounded w-1/3"></div>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-16 bg-slate-100 rounded-lg"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (!ganttData || !ganttData.tasks || ganttData.tasks.length === 0) {
        return (
            <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2 mb-4">
                    <Calendar className="text-blue-600" size={24} />
                    Диаграмма Ганта
                </h2>
                <div className="text-center py-12">
                    <Calendar size={48} className="mx-auto mb-3 text-slate-300" />
                    <p className="text-sm text-slate-500">Нет данных для отображения</p>
                </div>
            </div>
        );
    }

    const planStart = new Date(ganttData.plan_start_date);
    const planEnd = new Date(ganttData.plan_end_date);
    const totalDays = Math.ceil((planEnd - planStart) / (1000 * 60 * 60 * 24));

    const calculatePosition = (startDate, endDate) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const startOffset = Math.max(0, Math.ceil((start - planStart) / (1000 * 60 * 60 * 24)));
        const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        const startPercent = (startOffset / totalDays) * 100;
        const widthPercent = (duration / totalDays) * 100;
        return { left: `${startPercent}%`, width: `${widthPercent}%` };
    };

    return (
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 p-4 sm:p-6">
            <div className="mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2 mb-2">
                    <Calendar className="text-blue-600" size={24} />
                    Диаграмма Ганта
                </h2>
                <p className="text-sm text-slate-600">
                    Период: {new Date(ganttData.plan_start_date).toLocaleDateString('ru-RU')} - {new Date(ganttData.plan_end_date).toLocaleDateString('ru-RU')}
                </p>
            </div>

            <div className="space-y-3 overflow-x-auto">
                {ganttData.tasks.map((task, index) => {
                    const position = calculatePosition(task.start_date, task.end_date);
                    
                    return (
                        <div key={task.id} className="min-w-[600px]">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 flex-shrink-0 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                                    {index + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h4 className="text-sm font-semibold text-slate-900 truncate">
                                            {task.name}
                                        </h4>
                                        {getRiskBadge(task.risk_level, task.is_delayed)}
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-600">
                                        <span>{new Date(task.start_date).toLocaleDateString('ru-RU')} - {new Date(task.end_date).toLocaleDateString('ru-RU')}</span>
                                        <span className="hidden sm:inline">•</span>
                                        <span className="hidden sm:inline">{getStatusLabel(task.status)}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="relative h-10 bg-slate-100 rounded-lg overflow-hidden">
                                <div
                                    className={`absolute top-1 bottom-1 rounded-md ${getRiskColor(task.risk_level)} ${task.is_delayed ? 'animate-pulse' : ''} transition-all`}
                                    style={position}
                                >
                                    <div className="relative h-full">
                                        <div
                                            className="absolute inset-0 bg-white/30 rounded-md transition-all"
                                            style={{ width: `${task.progress}%` }}
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-xs font-bold text-white drop-shadow">
                                                {task.progress}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-6 pt-6 border-t border-slate-200">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="text-xs font-semibold text-slate-600">Легенда:</div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-emerald-500"></div>
                        <span className="text-xs text-slate-600">Норма</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-amber-500"></div>
                        <span className="text-xs text-slate-600">Средний риск</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-red-500"></div>
                        <span className="text-xs text-slate-600">Высокий риск</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GanttChart;

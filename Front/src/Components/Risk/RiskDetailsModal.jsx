import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, TrendingUp, Clock, FileText, User, ArrowUp, ArrowDown } from 'lucide-react';
import ApiService from '../../apiService';
import AuthService from '../../authService';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const EVENT_TYPE_CONFIG = {
    SCHEDULE_DEVIATION: { label: 'Отклонение от графика', icon: Clock, color: 'orange' },
    OPEN_VIOLATIONS: { label: 'Открытые нарушения', icon: AlertTriangle, color: 'red' },
    REPORTING_DISCIPLINE: { label: 'Дисциплина отчётности', icon: FileText, color: 'amber' },
    MANUAL_ADJUSTMENT: { label: 'Ручная корректировка', icon: User, color: 'sky' },
    DEFAULT: { label: 'Событие', icon: TrendingUp, color: 'slate' },
};

const RiskDetailsModal = ({ projectId, onClose }) => {
    const [summary, setSummary] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const summaryData = await ApiService.getProjectRisk(projectId);
                setSummary(summaryData);

                const token = AuthService.getToken();
                const response = await fetch(`${(import.meta.env.VITE_API_URL || 'http://localhost:8501').replace(/\/$/, '')}/api/projects/${projectId}/risk/history`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch risk history');
                }
                const historyData = await response.json();
                setHistory(historyData);

            } catch (err) {
                console.error('Error fetching risk details:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [projectId]);

    const getRiskColor = (level) => {
        switch(level) {
            case 'LOW': return 'text-green-600 bg-green-100 border-green-200';
            case 'MEDIUM': return 'text-amber-600 bg-amber-100 border-amber-200';
            case 'HIGH': return 'text-red-600 bg-red-100 border-red-200';
            case 'CRITICAL': return 'text-red-800 bg-red-200 border-red-400';
            default: return 'text-slate-600 bg-slate-100 border-slate-200';
        }
    };

    const getRiskLabel = (level) => {
        switch(level) {
            case 'LOW': return 'Низкий';
            case 'MEDIUM': return 'Средний';
            case 'HIGH': return 'Высокий';
            case 'CRITICAL': return 'Критический';
            default: return 'Неизвестен';
        }
    };

    const renderLoading = () => (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-4xl rounded-3xl bg-white p-6">
                <p className="text-slate-500">Загрузка истории рисков...</p>
            </div>
        </div>
    );

    const renderContent = () => {
        const { risk_score, risk_level } = summary || {};

        return (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center z-[10000] p-4" onClick={onClose}>
                <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl bg-slate-50 shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
                    <div className="flex-shrink-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-orange-100 p-2">
                                <TrendingUp size={24} className="text-orange-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">История оценки рисков</h2>
                                <p className="text-sm text-slate-500">Проект: {summary?.project_name || '...'}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex-shrink-0 bg-white p-6 border-b border-slate-200">
                        <div className="rounded-2xl border-2 border-slate-200 bg-white p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Текущий уровень риска</p>
                                    <div className={`mt-2 inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 text-lg font-bold ${getRiskColor(risk_level)}`}>
                                        <AlertTriangle size={20} />
                                        {getRiskLabel(risk_level)}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Общий счёт</p>
                                    <p className="mt-2 text-5xl font-bold text-slate-900">{risk_score}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-grow overflow-y-auto p-6">
                        {history.length > 0 ? (
                            <div className="space-y-4">
                                {history.map(event => {
                                    const config = EVENT_TYPE_CONFIG[event.event_type] || EVENT_TYPE_CONFIG.DEFAULT;
                                    const Icon = config.icon;
                                    const isPositive = event.score_change > 0;

                                    return (
                                        <div key={event.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-slate-300">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-4">
                                                    <div className={`rounded-lg bg-${config.color}-100 p-3`}>
                                                        <Icon size={20} className={`text-${config.color}-600`} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-base font-bold text-slate-800">{config.label}</h4>
                                                        <p className="mt-1 text-sm text-slate-600">{event.description}</p>
                                                        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                                                            <Clock size={14} />
                                                            <span>{format(new Date(event.timestamp), 'd MMMM yyyy, HH:mm', { locale: ru })}</span>
                                                            {event.triggering_user_id && (<>
                                                                <User size={14} className="ml-2"/>
                                                                <span>Инициатор: {event.triggering_user_id}</span>
                                                            </>)}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className={`flex-shrink-0 flex items-center gap-1 rounded-lg px-3 py-1 text-base font-bold ${isPositive ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                    {isPositive ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                                                    {event.score_change}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-slate-500">История событий риска для этого проекта пуста.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return loading ? renderLoading() : renderContent();
};

export default RiskDetailsModal;
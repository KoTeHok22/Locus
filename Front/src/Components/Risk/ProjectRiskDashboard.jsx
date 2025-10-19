import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp, Clock, FileText, AlertCircle, Package, CheckCircle } from 'lucide-react';
import ApiService from '../../apiService';
import ProjectRiskIndicator from './ProjectRiskIndicator';

const FACTOR_CONFIG = {
    overdue_tasks: {
        label: 'Просроченные задачи',
        icon: Clock,
        color: 'red',
        weightLabel: '+15 баллов за задачу'
    },
    overdue_verifications: {
        label: 'Неверифицированные задачи (>48ч)',
        icon: CheckCircle,
        color: 'amber',
        weightLabel: '+10 баллов за задачу'
    },
    issues: {
        label: 'Замечания и нарушения',
        icon: AlertTriangle,
        color: 'red',
        weightLabel: 'До +40 баллов за нарушение'
    },
    missed_reports: {
        label: 'Пропущенные ежедневные отчёты',
        icon: FileText,
        color: 'orange',
        weightLabel: '+25 баллов за день'
    },
    material_deliveries: {
        label: 'Проблемы с ТТН',
        icon: Package,
        color: 'amber',
        weightLabel: 'До +30 баллов за ошибку'
    }
};

const FactorCard = ({ factorKey, factorData }) => {
    const config = FACTOR_CONFIG[factorKey];
    if (!config) return null;

    const Icon = config.icon;
    const score = factorData.score || 0;

    let details = '';
    if (factorKey === 'overdue_tasks') {
        details = `${factorData.count} задач просрочено`;
    } else if (factorKey === 'overdue_verifications') {
        details = `${factorData.count} задач ожидают верификации`;
    } else if (factorKey === 'issues') {
        const parts = [];
        if (factorData.remarks_count > 0) parts.push(`${factorData.remarks_count} замечаний`);
        if (factorData.violations_count > 0) parts.push(`${factorData.violations_count} нарушений`);
        if (factorData.overdue_count > 0) parts.push(`${factorData.overdue_count} просрочено`);
        if (factorData.rejected_count > 0) parts.push(`${factorData.rejected_count} отклонено`);
        details = parts.join(', ');
    } else if (factorKey === 'missed_reports') {
        details = `${factorData.missed_days} дней без отчёта`;
    } else if (factorKey === 'material_deliveries') {
        const parts = [];
        if (factorData.validation_errors > 0) parts.push(`${factorData.validation_errors} ошибок валидации`);
        if (factorData.validation_warnings > 0) parts.push(`${factorData.validation_warnings} предупреждений`);
        details = parts.join(', ');
    }

    return (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                    <div className={`rounded-lg bg-${config.color}-100 p-2`}>
                        <Icon size={20} className={`text-${config.color}-600`} />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-slate-900">{config.label}</h4>
                        <p className="mt-1 text-xs text-slate-600">{details}</p>
                        <p className="mt-1 text-xs text-slate-500">{config.weightLabel}</p>
                    </div>
                </div>
                <div className="rounded-lg bg-red-600 px-3 py-1 text-sm font-bold text-white">
                    +{score}
                </div>
            </div>
        </div>
    );
};

const ProjectRiskDashboard = ({ projectId }) => {
    const [riskData, setRiskData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRiskData = async () => {
            try {
                setLoading(true);
                const response = await ApiService.getProjectRisk(projectId);
                setRiskData(response);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchRiskData();
    }, [projectId]);

    if (loading) {
        return (
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                <p className="text-sm text-slate-500">Загрузка данных о рисках...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-6">
                <p className="text-sm text-red-600">Ошибка: {error}</p>
            </div>
        );
    }

    if (!riskData) return null;

    const { risk_score, risk_level, risk_factors } = riskData;
    const hasFactors = risk_factors && Object.keys(risk_factors).length > 0;

    return (
        <div className="rounded-3xl border border-slate-100 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
                <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-orange-100 p-2.5">
                        <TrendingUp size={20} className="text-orange-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-900">Оценка рисков проекта</h3>
                        <p className="text-sm text-slate-500">Анализ факторов, влияющих на успех проекта</p>
                    </div>
                </div>
            </div>

            <div className="p-6">
                <div className="mb-6 flex items-center justify-between rounded-2xl border-2 border-slate-200 bg-slate-50 p-6">
                    <div>
                        <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Текущий уровень риска</p>
                        <div className="mt-2">
                            <ProjectRiskIndicator riskLevel={risk_level} riskScore={risk_score} size="lg" showScore={true} />
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Общий счёт</p>
                        <p className="mt-2 text-4xl font-bold text-slate-900">{risk_score}</p>
                        <p className="text-sm text-slate-500">из 1000</p>
                    </div>
                </div>

                {hasFactors ? (
                    <div>
                        <h4 className="mb-4 text-base font-semibold text-slate-900">Факторы риска</h4>
                        <div className="space-y-3">
                            {Object.entries(risk_factors).map(([key, data]) => (
                                <FactorCard key={key} factorKey={key} factorData={data} />
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="rounded-2xl bg-emerald-50 px-6 py-8 text-center">
                        <AlertCircle className="mx-auto mb-3 text-emerald-600" size={48} />
                        <p className="text-base font-semibold text-emerald-900">Факторов риска не обнаружено</p>
                        <p className="mt-1 text-sm text-emerald-700">Проект в графике, дисциплина соблюдается</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectRiskDashboard;

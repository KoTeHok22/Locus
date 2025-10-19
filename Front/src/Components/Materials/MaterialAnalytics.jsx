import React, { useState, useEffect } from 'react';
import { Package, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, BarChart3, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import ApiService from '../../apiService';

const MaterialAnalytics = ({ projectId }) => {
    const [planFactData, setPlanFactData] = useState(null);
    const [riskData, setRiskData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('plan-fact');

    useEffect(() => {
        loadData();
    }, [projectId]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [planFact, risks] = await Promise.all([
                ApiService.getMaterialPlanFact(projectId),
                ApiService.getRiskAnalysis(projectId)
            ]);
            setPlanFactData(planFact);
            setRiskData(risks);
        } catch (error) {
            toast.error(`Ошибка загрузки: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 p-4 sm:p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-slate-200 rounded w-1/3"></div>
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-20 bg-slate-100 rounded-lg"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 p-4 sm:p-6">
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2 sm:pb-0">
                    <button
                        onClick={() => setActiveTab('plan-fact')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                            activeTab === 'plan-fact'
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        <span className="flex items-center gap-2">
                            <BarChart3 size={16} />
                            План/Факт
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('risks')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                            activeTab === 'risks'
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        <span className="flex items-center gap-2">
                            <AlertTriangle size={16} />
                            Риски ({riskData?.summary.total_material_risks + riskData?.summary.total_schedule_risks || 0})
                        </span>
                    </button>
                </div>

                {activeTab === 'plan-fact' && <PlanFactReport data={planFactData} />}
                {activeTab === 'risks' && <RiskAnalysis data={riskData} />}
            </div>
        </div>
    );
};

const PlanFactReport = ({ data }) => {
    if (!data || !data.materials || data.materials.length === 0) {
        return (
            <div className="text-center py-12">
                <Package size={48} className="mx-auto mb-3 text-slate-300" />
                <p className="text-sm text-slate-500">Нет данных о материалах</p>
            </div>
        );
    }

    const getStatusBadge = (status) => {
        switch (status) {
            case 'ok':
                return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-xs font-semibold">
                    <CheckCircle size={12} />
                    Норма
                </span>;
            case 'shortage_risk':
                return <span className="inline-flex items-center gap-1 rounded-full bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 text-xs font-semibold">
                    <AlertTriangle size={12} />
                    Риск нехватки
                </span>;
            case 'running_low':
                return <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 text-xs font-semibold">
                    <AlertCircle size={12} />
                    Заканчивается
                </span>;
            case 'overrun':
                return <span className="inline-flex items-center gap-1 rounded-full bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 text-xs font-semibold">
                    <TrendingUp size={12} />
                    Перерасход
                </span>;
            default:
                return null;
        }
    };

    return (
        <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-4">
                Отчет План/Факт по материалам
            </h3>
            
            <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                                    Материал
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">
                                    План
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">
                                    Поставлено
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">
                                    Израсходовано
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">
                                    Остаток
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">
                                    Статус
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                            {data.materials.map((mat) => (
                                <tr key={mat.material_id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">{mat.material_name}</p>
                                            <p className="text-xs text-slate-500">{mat.unit}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right text-sm text-slate-900">
                                        {mat.planned.toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <span className={`text-sm font-semibold ${
                                            mat.delivered >= mat.planned ? 'text-emerald-600' : 'text-amber-600'
                                        }`}>
                                            {mat.delivered.toFixed(2)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <span className={`text-sm font-semibold ${
                                            mat.consumed > mat.planned ? 'text-red-600' : 'text-blue-600'
                                        }`}>
                                            {mat.consumed.toFixed(2)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <span className={`text-sm font-semibold ${
                                            mat.remaining > 0 ? 'text-slate-900' : 'text-red-600'
                                        }`}>
                                            {mat.remaining.toFixed(2)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {getStatusBadge(mat.status)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-xs text-slate-600">
                    <span className="font-semibold">Прогноз дефицита/излишка</span> = Поставлено - Запланировано
                </p>
            </div>
        </div>
    );
};

const RiskAnalysis = ({ data }) => {
    if (!data) {
        return (
            <div className="text-center py-12">
                <AlertTriangle size={48} className="mx-auto mb-3 text-slate-300" />
                <p className="text-sm text-slate-500">Нет данных о рисках</p>
            </div>
        );
    }

    const getRiskLevelColor = (level) => {
        switch (level) {
            case 'high':
                return 'bg-red-100 text-red-700 border-red-200';
            case 'medium':
                return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'low':
                return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            default:
                return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    const getSeverityIcon = (severity) => {
        return severity === 'high' ? <AlertTriangle size={16} /> : <AlertCircle size={16} />;
    };

    return (
        <div className="space-y-6">
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                        Анализ рисков проекта
                    </h3>
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold ${getRiskLevelColor(data.overall_risk_level)}`}>
                        {data.overall_risk_level === 'high' ? '🔴' : data.overall_risk_level === 'medium' ? '🟡' : '🟢'}
                        {data.overall_risk_level === 'high' ? 'Высокий' : data.overall_risk_level === 'medium' ? 'Средний' : 'Низкий'}
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="bg-slate-50 rounded-lg p-4">
                        <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Риски по материалам</p>
                        <p className="text-2xl font-bold text-slate-900">{data.summary.total_material_risks}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4">
                        <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Риски по срокам</p>
                        <p className="text-2xl font-bold text-slate-900">{data.summary.total_schedule_risks}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4">
                        <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Высокая серьезность</p>
                        <p className="text-2xl font-bold text-red-600">{data.summary.high_severity_count}</p>
                    </div>
                </div>
            </div>

            {data.material_risks.length > 0 && (
                <div>
                    <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <Package size={16} className="text-red-600" />
                        Риски по материалам ({data.material_risks.length})
                    </h4>
                    <div className="space-y-2">
                        {data.material_risks.map((risk, index) => (
                            <div key={index} className={`rounded-lg border p-4 ${
                                risk.severity === 'high' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'
                            }`}>
                                <div className="flex items-start gap-3">
                                    <div className={`flex-shrink-0 ${risk.severity === 'high' ? 'text-red-600' : 'text-amber-600'}`}>
                                        {getSeverityIcon(risk.severity)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="text-sm font-semibold text-slate-900">
                                                {risk.work_item_name}
                                            </p>
                                            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${
                                                risk.severity === 'high' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-amber-100 text-amber-700 border-amber-200'
                                            }`}>
                                                {risk.severity === 'high' ? 'Высокий' : 'Средний'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-700 mb-2">{risk.description}</p>
                                        <p className="text-xs text-slate-600">
                                            <span className="font-semibold">Материал:</span> {risk.material_name}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {data.schedule_risks.length > 0 && (
                <div>
                    <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <AlertTriangle size={16} className="text-amber-600" />
                        Риски по срокам ({data.schedule_risks.length})
                    </h4>
                    <div className="space-y-2">
                        {data.schedule_risks.map((risk, index) => (
                            <div key={index} className={`rounded-lg border p-4 ${
                                risk.severity === 'high' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'
                            }`}>
                                <div className="flex items-start gap-3">
                                    <div className={`flex-shrink-0 ${risk.severity === 'high' ? 'text-red-600' : 'text-amber-600'}`}>
                                        {getSeverityIcon(risk.severity)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="text-sm font-semibold text-slate-900">
                                                {risk.work_item_name}
                                            </p>
                                            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${
                                                risk.severity === 'high' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-amber-100 text-amber-700 border-amber-200'
                                            }`}>
                                                {risk.severity === 'high' ? 'Высокий' : 'Средний'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-700">{risk.description}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {data.material_risks.length === 0 && data.schedule_risks.length === 0 && (
                <div className="text-center py-12">
                    <CheckCircle size={64} className="mx-auto mb-4 text-emerald-500" />
                    <h4 className="text-lg font-semibold text-slate-900 mb-2">Рисков не обнаружено</h4>
                    <p className="text-sm text-slate-600">Проект выполняется в соответствии с планом</p>
                </div>
            )}
        </div>
    );
};

export default MaterialAnalytics;

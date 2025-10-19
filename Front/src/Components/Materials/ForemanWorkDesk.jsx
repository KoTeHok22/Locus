import React, { useState, useEffect } from 'react';
import { ClipboardList, TrendingUp, Package, CheckCircle, Clock, AlertCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import ApiService from '../../apiService';

const ForemanWorkDesk = ({ projectId }) => {
    const [workItems, setWorkItems] = useState([]);
    const [availableMaterials, setAvailableMaterials] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('in_progress');
    const [selectedItem, setSelectedItem] = useState(null);
    const [showReportModal, setShowReportModal] = useState(false);

    useEffect(() => {
        loadData();
    }, [projectId, statusFilter]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [items, materials] = await Promise.all([
                ApiService.getMyWorkItems(projectId, statusFilter),
                ApiService.getAvailableMaterials(projectId)
            ]);
            setWorkItems(items.items || []);
            setAvailableMaterials(materials.available_materials || []);
        } catch (error) {
            toast.error(`Ошибка загрузки: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const openReportModal = (item) => {
        setSelectedItem(item);
        setShowReportModal(true);
    };

    const handleReportSuccess = () => {
        setShowReportModal(false);
        setSelectedItem(null);
        loadData();
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'in_progress':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'not_started':
                return 'bg-slate-100 text-slate-700 border-slate-200';
            default:
                return 'bg-slate-100 text-slate-600 border-slate-200';
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
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 bg-slate-100 rounded-lg"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                        <ClipboardList className="text-blue-600" size={24} />
                        Мои работы
                    </h2>
                    
                    <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
                        {[
                            { value: 'in_progress', label: 'В работе' },
                            { value: 'not_started', label: 'Не начато' },
                            { value: 'completed', label: 'Завершено' }
                        ].map(filter => (
                            <button
                                key={filter.value}
                                onClick={() => setStatusFilter(filter.value)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                                    statusFilter === filter.value
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>
                </div>

                {workItems.length === 0 ? (
                    <div className="text-center py-12">
                        <ClipboardList size={48} className="mx-auto mb-3 text-slate-300" />
                        <p className="text-sm text-slate-500">Нет работ с выбранным статусом</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {workItems.map((item, index) => (
                            <WorkItemCard
                                key={item.id}
                                item={item}
                                index={index}
                                onReport={openReportModal}
                            />
                        ))}
                    </div>
                )}
            </div>

            {showReportModal && selectedItem && (
                <ReportProgressModal
                    workItem={selectedItem}
                    availableMaterials={availableMaterials}
                    onClose={() => {
                        setShowReportModal(false);
                        setSelectedItem(null);
                    }}
                    onSuccess={handleReportSuccess}
                />
            )}
        </div>
    );
};

const WorkItemCard = ({ item, index, onReport }) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'in_progress':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'not_started':
                return 'bg-slate-100 text-slate-700 border-slate-200';
            default:
                return 'bg-slate-100 text-slate-600 border-slate-200';
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

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 transition-all hover:border-blue-200 hover:shadow-md">
            <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                    {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                        <h3 className="text-sm sm:text-base font-semibold text-slate-900">
                            {item.name}
                        </h3>
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${getStatusColor(item.status)}`}>
                            {getStatusLabel(item.status)}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                        <div className="text-xs text-slate-600">
                            <span className="font-semibold">Объем:</span> {item.quantity} {item.unit}
                        </div>
                        <div className="text-xs text-slate-600 flex items-center gap-1">
                            <Clock size={12} />
                            {new Date(item.start_date).toLocaleDateString('ru-RU')} - {new Date(item.end_date).toLocaleDateString('ru-RU')}
                        </div>
                    </div>

                    <div className="mt-3">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-semibold text-slate-600">Прогресс</span>
                            <span className="text-xs font-bold text-blue-600">{item.progress}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-blue-600 transition-all duration-300"
                                style={{ width: `${item.progress}%` }}
                            />
                        </div>
                    </div>

                    {item.required_materials && item.required_materials.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                            <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1">
                                <Package size={12} />
                                Плановые материалы:
                            </p>
                            <div className="space-y-1">
                                {item.required_materials.map(mat => (
                                    <div key={mat.material_id} className="text-xs text-slate-600">
                                        • {mat.material_name}: <span className="font-semibold">{mat.planned_quantity} {mat.material_unit}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <button
                        onClick={() => onReport(item)}
                        className="mt-4 w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                    >
                        <TrendingUp size={16} />
                        Отчитаться о прогрессе
                    </button>
                </div>
            </div>
        </div>
    );
};

const ReportProgressModal = ({ workItem, availableMaterials, onClose, onSuccess }) => {
    const [materialsUsed, setMaterialsUsed] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const getAvailableQuantity = (materialId) => {
        const mat = availableMaterials.find(m => m.material_id === materialId);
        return mat ? mat.available_quantity : 0;
    };

    const handleMaterialQuantityChange = (materialId, quantity) => {
        const existing = materialsUsed.find(m => m.material_id === materialId);
        if (existing) {
            setMaterialsUsed(materialsUsed.map(m =>
                m.material_id === materialId ? { ...m, quantity_used: quantity } : m
            ));
        } else {
            setMaterialsUsed([...materialsUsed, { material_id: materialId, quantity_used: quantity }]);
        }
    };

    const getMaterialQuantity = (materialId) => {
        const mat = materialsUsed.find(m => m.material_id === materialId);
        return mat ? mat.quantity_used : 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        for (const used of materialsUsed) {
            const available = getAvailableQuantity(used.material_id);
            if (used.quantity_used > available) {
                const material = workItem.required_materials.find(m => m.material_id === used.material_id);
                toast.error(`Недостаточно материала "${material.material_name}". Доступно: ${available} ${material.material_unit}`);
                return;
            }
        }

        setIsSubmitting(true);
        try {
            await ApiService.reportWorkProgress(
                workItem.id,
                materialsUsed.filter(m => m.quantity_used > 0)
            );
            toast.success('Отчет сохранен');
            onSuccess();
        } catch (error) {
            toast.error(`Ошибка: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-slate-200 p-6 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-900">Отчет о выполнении</h3>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{workItem.name}</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {workItem.required_materials && workItem.required_materials.length > 0 && (
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-3">
                                Использованные материалы
                            </label>
                            <div className="space-y-3">
                                {workItem.required_materials.map(mat => {
                                    const available = getAvailableQuantity(mat.material_id);
                                    const used = getMaterialQuantity(mat.material_id);
                                    
                                    return (
                                        <div key={mat.material_id} className="bg-slate-50 rounded-lg p-4">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold text-slate-900">
                                                        {mat.material_name}
                                                    </p>
                                                    <p className="text-xs text-slate-600 mt-1">
                                                        План: {mat.planned_quantity} {mat.material_unit} • Доставлено: {mat.delivered_quantity} {mat.material_unit} • Доступно: <span className={available > 0 ? 'text-emerald-600 font-semibold' : 'text-red-600 font-semibold'}>{available} {mat.material_unit}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={available}
                                                    step="0.01"
                                                    value={used}
                                                    onChange={(e) => handleMaterialQuantityChange(mat.material_id, parseFloat(e.target.value) || 0)}
                                                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                                    placeholder="0"
                                                />
                                                <span className="text-sm font-semibold text-slate-600 w-16 text-right">
                                                    {mat.material_unit}
                                                </span>
                                            </div>
                                            {used > available && (
                                                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                                    <AlertCircle size={12} />
                                                    Недостаточно материала на складе
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Сохранение...' : 'Сохранить отчет'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border-2 border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                        >
                            Отмена
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ForemanWorkDesk;

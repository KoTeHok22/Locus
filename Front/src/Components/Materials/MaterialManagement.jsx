import React, { useState, useEffect } from 'react';
import { Package, Plus, Trash2, Search, Edit2, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import ApiService from '../../apiService';

const MaterialManagement = ({ workItem, onUpdate }) => {
    const [requiredMaterials, setRequiredMaterials] = useState([]);
    const [allMaterials, setAllMaterials] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showCreateMaterial, setShowCreateMaterial] = useState(false);
    const [editingQuantity, setEditingQuantity] = useState(null);

    useEffect(() => {
        loadData();
    }, [workItem.id]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [itemData, catalog] = await Promise.all([
                ApiService.getWorkPlanItem(workItem.id),
                ApiService.getMaterials()
            ]);
            setRequiredMaterials(itemData.required_materials || []);
            setAllMaterials(catalog.materials || []);
        } catch (error) {
            toast.error(`Ошибка загрузки: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddMaterial = async (materialId, quantity) => {
        try {
            await ApiService.addRequiredMaterial(workItem.id, materialId, quantity);
            toast.success('Материал добавлен');
            setShowAddModal(false);
            loadData();
            if (onUpdate) onUpdate();
        } catch (error) {
            toast.error(`Ошибка: ${error.message}`);
        }
    };

    const handleUpdateQuantity = async (requiredMaterial, newQuantity) => {
        try {
            await ApiService.updateRequiredMaterial(
                requiredMaterial.work_item_id,
                requiredMaterial.material_id,
                newQuantity
            );
            toast.success('Количество обновлено');
            setEditingQuantity(null);
            loadData();
            if (onUpdate) onUpdate();
        } catch (error) {
            toast.error(`Ошибка: ${error.message}`);
        }
    };

    const handleDeleteMaterial = async (requiredMaterial) => {
        if (!confirm('Удалить материал из плана?')) return;
        
        try {
            await ApiService.deleteRequiredMaterial(
                requiredMaterial.work_item_id,
                requiredMaterial.material_id
            );
            toast.success('Материал удален');
            loadData();
            if (onUpdate) onUpdate();
        } catch (error) {
            toast.error(`Ошибка: ${error.message}`);
        }
    };

    if (isLoading) {
        return (
            <div className="animate-pulse space-y-3">
                {[1, 2].map(i => (
                    <div key={i} className="h-16 bg-slate-100 rounded-lg"></div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <Package size={16} className="text-blue-600" />
                    Плановые материалы
                </h4>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
                >
                    <Plus size={14} />
                    Добавить
                </button>
            </div>

            {requiredMaterials.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-lg">
                    <Package size={32} className="mx-auto mb-2 text-slate-300" />
                    <p className="text-sm text-slate-500">Материалы не добавлены</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {requiredMaterials.map((mat) => (
                        <div key={mat.id} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-900">{mat.material_name}</p>
                                <p className="text-xs text-slate-500">{mat.material_unit}</p>
                            </div>
                            
                            {editingQuantity === mat.id ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        step="0.01"
                                        defaultValue={mat.planned_quantity}
                                        className="w-24 rounded border border-blue-500 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleUpdateQuantity(mat, parseFloat(e.target.value));
                                            } else if (e.key === 'Escape') {
                                                setEditingQuantity(null);
                                            }
                                        }}
                                        autoFocus
                                    />
                                    <button
                                        onClick={(e) => {
                                            const input = e.currentTarget.previousElementSibling;
                                            handleUpdateQuantity(mat, parseFloat(input.value));
                                        }}
                                        className="p-1 rounded text-emerald-600 hover:bg-emerald-50"
                                    >
                                        <Check size={16} />
                                    </button>
                                    <button
                                        onClick={() => setEditingQuantity(null)}
                                        className="p-1 rounded text-slate-600 hover:bg-slate-100"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setEditingQuantity(mat.id)}
                                        className="text-sm font-semibold text-slate-900 hover:text-blue-600 flex items-center gap-1"
                                    >
                                        {mat.planned_quantity}
                                        <Edit2 size={12} className="text-slate-400" />
                                    </button>
                                </div>
                            )}

                            <button
                                onClick={() => handleDeleteMaterial(mat)}
                                className="p-1.5 rounded text-red-600 hover:bg-red-50 transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {showAddModal && (
                <AddMaterialModal
                    materials={allMaterials}
                    existingMaterials={requiredMaterials.map(m => m.material_id)}
                    onAdd={handleAddMaterial}
                    onClose={() => setShowAddModal(false)}
                    onCreateNew={() => {
                        setShowAddModal(false);
                        setShowCreateMaterial(true);
                    }}
                />
            )}

            {showCreateMaterial && (
                <CreateMaterialModal
                    onSuccess={() => {
                        setShowCreateMaterial(false);
                        loadData();
                    }}
                    onClose={() => setShowCreateMaterial(false)}
                />
            )}
        </div>
    );
};

const AddMaterialModal = ({ materials, existingMaterials, onAdd, onClose, onCreateNew }) => {
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const [quantity, setQuantity] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const availableMaterials = materials.filter(m => !existingMaterials.includes(m.id));
    const filteredMaterials = availableMaterials.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSubmit = (e) => {
        e.preventDefault();
        if (selectedMaterial && quantity > 0) {
            onAdd(selectedMaterial.id, parseFloat(quantity));
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] flex flex-col">
                <div className="p-6 border-b border-slate-200">
                    <h3 className="text-lg font-bold text-slate-900">Добавить материал</h3>
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Поиск материала
                            </label>
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Введите название..."
                                    className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg">
                            {filteredMaterials.length === 0 ? (
                                <div className="p-4 text-center">
                                    <p className="text-sm text-slate-500 mb-3">Материал не найден</p>
                                    <button
                                        type="button"
                                        onClick={onCreateNew}
                                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700"
                                    >
                                        <Plus size={14} />
                                        Создать новый материал
                                    </button>
                                </div>
                            ) : (
                                filteredMaterials.map((mat) => (
                                    <button
                                        key={mat.id}
                                        type="button"
                                        onClick={() => setSelectedMaterial(mat)}
                                        className={`w-full text-left px-4 py-3 border-b border-slate-100 transition-colors ${
                                            selectedMaterial?.id === mat.id
                                                ? 'bg-blue-50 border-l-4 border-l-blue-600'
                                                : 'hover:bg-slate-50'
                                        }`}
                                    >
                                        <p className="text-sm font-semibold text-slate-900">{mat.name}</p>
                                        <p className="text-xs text-slate-500">{mat.unit}</p>
                                    </button>
                                ))
                            )}
                        </div>

                        {selectedMaterial && (
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Плановое количество ({selectedMaterial.unit})
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    placeholder="0"
                                    className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                        )}

                        <div className="flex gap-3 pt-4">
                            <button
                                type="submit"
                                disabled={!selectedMaterial || !quantity}
                                className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
                            >
                                Добавить
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
        </div>
    );
};

const CreateMaterialModal = ({ onSuccess, onClose }) => {
    const [name, setName] = useState('');
    const [unit, setUnit] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await ApiService.createMaterial({ name, unit });
            toast.success('Материал создан');
            onSuccess();
        } catch (error) {
            toast.error(`Ошибка: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
                <div className="p-6 border-b border-slate-200">
                    <h3 className="text-lg font-bold text-slate-900">Создать материал</h3>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Название материала
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Например: Цемент М400"
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Единица измерения
                        </label>
                        <input
                            type="text"
                            value={unit}
                            onChange={(e) => setUnit(e.target.value)}
                            placeholder="кг, м3, шт и т.д."
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Создание...' : 'Создать'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="rounded-xl border-2 border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Отмена
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MaterialManagement;

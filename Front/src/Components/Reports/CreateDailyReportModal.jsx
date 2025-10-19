import React, { useState, useEffect } from 'react';
import { FileText, Users, Truck, CloudRain, X } from 'lucide-react';
import toast from 'react-hot-toast';
import ApiService from '../../apiService';
import { getCurrentGeolocation } from '../../utils/geolocation';

const CreateDailyReportModal = ({ projectId, editingReport, onClose }) => {
    const [formData, setFormData] = useState({
        workers_count: '',
        equipment: '',
        weather_conditions: '',
        notes: ''
    });
    const [loading, setLoading] = useState(false);
    const [geolocation, setGeolocation] = useState(null);

    const isEditing = !!editingReport;

    useEffect(() => {
        if (isEditing) {
            setFormData({
                workers_count: editingReport.workers_count || '',
                equipment: editingReport.equipment || '',
                weather_conditions: editingReport.weather_conditions || '',
                notes: editingReport.notes || ''
            });
        } else {
            const fetchGeolocation = async () => {
                try {
                    const location = await getCurrentGeolocation();
                    setGeolocation(`${location.latitude},${location.longitude}`);
                } catch (error) {
                    console.error('Ошибка получения геолокации:', error);
                }
            };
            fetchGeolocation();
        }
    }, [editingReport, isEditing]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.workers_count || !formData.weather_conditions) {
            toast.error('Заполните обязательные поля');
            return;
        }

        if (!isEditing && !geolocation) {
            toast.error('Ожидание геолокации...');
            return;
        }

        setLoading(true);
        try {
            if (isEditing) {
                await ApiService.updateDailyReport(editingReport.id, formData);
                toast.success('Ежедневный отчёт успешно обновлен!');
            } else {
                await ApiService.createDailyReport({
                    project_id: projectId,
                    ...formData,
                    workers_count: parseInt(formData.workers_count),
                    geolocation
                });
                toast.success('Ежедневный отчёт успешно создан!');
            }
            onClose();
        } catch (error) {
            toast.error(error.message || (isEditing ? 'Ошибка обновления отчёта' : 'Ошибка создания отчёта'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[10000] px-4">
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-3xl">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                >
                    <X size={20} />
                </button>

                <div className="border-b border-slate-200 px-4 py-4 sm:px-6 sm:py-5">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-blue-100 p-2.5">
                            <FileText size={20} className="text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
                                {isEditing ? 'Редактировать отчёт' : 'Новый ежедневный отчёт'}
                            </h2>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="px-4 py-4 sm:px-6 sm:py-6">
                    <div className="space-y-5">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 sm:text-sm">
                                <div className="mb-2 flex items-center gap-2">
                                    <Users size={16} className="text-slate-500" />
                                    Количество рабочих *
                                </div>
                                <input
                                    type="number"
                                    name="workers_count"
                                    value={formData.workers_count}
                                    onChange={handleChange}
                                    min="0"
                                    required
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 sm:rounded-xl sm:px-4 sm:py-3"
                                    placeholder="Введите количество"
                                />
                            </label>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 sm:text-sm">
                                <div className="mb-2 flex items-center gap-2">
                                    <Truck size={16} className="text-slate-500" />
                                    Техника
                                </div>
                                <input
                                    type="text"
                                    name="equipment"
                                    value={formData.equipment}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 sm:rounded-xl sm:px-4 sm:py-3"
                                    placeholder="Например: Экскаватор, самосвал"
                                />
                            </label>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 sm:text-sm">
                                <div className="mb-2 flex items-center gap-2">
                                    <CloudRain size={16} className="text-slate-500" />
                                    Погодные условия *
                                </div>
                                <select
                                    name="weather_conditions"
                                    value={formData.weather_conditions}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 sm:rounded-xl sm:px-4 sm:py-3"
                                >
                                    <option value="">Выберите условия</option>
                                    <option value="Ясно">☀️ Ясно</option>
                                    <option value="Облачно">⛅ Облачно</option>
                                    <option value="Дождь">🌧️ Дождь</option>
                                    <option value="Снег">❄️ Снег</option>
                                    <option value="Туман">🌫️ Туман</option>
                                    <option value="Гроза">⛈️ Гроза</option>
                                </select>
                            </label>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 sm:text-sm">
                                <div className="mb-2 flex items-center gap-2">
                                    <FileText size={16} className="text-slate-500" />
                                    Заметки
                                </div>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 sm:rounded-xl sm:px-4 sm:py-3 sm:rows-4"
                                    placeholder="Дополнительная информация о ходе работ..."
                                />
                            </label>
                        </div>
                    </div>

                    <div className="mt-4 flex flex-col-reverse gap-2 sm:mt-6 sm:flex-row sm:gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-slate-300"
                        >
                            {loading ? (isEditing ? 'Сохранение...' : 'Создание...') : (isEditing ? 'Сохранить изменения' : 'Создать отчёт')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateDailyReportModal;
import React, { useState, useEffect } from 'react';
import { FileText, Users, Truck, CloudRain, X, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import ApiService from '../../apiService';
import { getCurrentGeolocation } from '../../utils/geolocation';

const CreateDailyReportModal = ({ project, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        workers_count: '',
        equipment: '',
        weather_conditions: '',
        notes: ''
    });
    const [loading, setLoading] = useState(false);
    const [geolocation, setGeolocation] = useState(null);

    useEffect(() => {
        const fetchGeolocation = async () => {
            try {
                const location = await getCurrentGeolocation();
                setGeolocation(`${location.latitude},${location.longitude}`);
            } catch (error) {
                console.error('Ошибка получения геолокации:', error);
            }
        };
        fetchGeolocation();
    }, []);

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

        if (!geolocation) {
            toast.error('Ожидание геолокации...');
            return;
        }

        setLoading(true);
        try {
            await ApiService.createDailyReport({
                project_id: project.id,
                workers_count: parseInt(formData.workers_count),
                equipment: formData.equipment,
                weather_conditions: formData.weather_conditions,
                notes: formData.notes,
                geolocation
            });
            toast.success('Ежедневный отчёт успешно создан!');
            onSuccess();
        } catch (error) {
            toast.error(error.message || 'Ошибка создания отчёта');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
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
                                Ежедневный отчёт
                            </h2>
                            <p className="text-sm text-slate-500">
                                {project.name}
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="px-4 py-4 sm:px-6 sm:py-6">
                    <div className="space-y-5">
                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                            <div className="flex items-start gap-2">
                                <AlertCircle size={18} className="mt-0.5 flex-shrink-0 text-amber-600" />
                                <div>
                                    <p className="text-sm font-semibold text-amber-900">Важно</p>
                                    <p className="mt-1 text-xs text-amber-700">
                                        Отчёт можно создать только один раз в 12 часов. 
                                        Пропуск дней повышает риск проекта.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 sm:text-sm">
                                <div className="mb-2 flex items-center gap-2">
                                    <Users size={14} className="text-slate-500 sm:hidden" />
                                    <Users size={16} className="hidden text-slate-500 sm:block" />
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
                                    <Truck size={14} className="text-slate-500 sm:hidden" />
                                    <Truck size={16} className="hidden text-slate-500 sm:block" />
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
                                    <CloudRain size={14} className="text-slate-500 sm:hidden" />
                                    <CloudRain size={16} className="hidden text-slate-500 sm:block" />
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
                                    <FileText size={14} className="text-slate-500 sm:hidden" />
                                    <FileText size={16} className="hidden text-slate-500 sm:block" />
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
                            {loading ? 'Создание...' : 'Создать отчёт'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateDailyReportModal;

import React, { useState, useEffect } from 'react';
import ApiService from '../../apiService';
import toast from 'react-hot-toast';

const CreateTaskModal = ({ projectId, onClose, onUpdate }) => {
    const today = new Date().toISOString().split('T')[0];
    const [name, setName] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [workPlanItemId, setWorkPlanItemId] = useState('');
    const [workPlanItems, setWorkPlanItems] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingPlan, setIsLoadingPlan] = useState(true);

    useEffect(() => {
        const loadWorkPlan = async () => {
            try {
                const plan = await ApiService.getWorkPlan(projectId);
                setWorkPlanItems(plan.items || []);
            } catch (error) {
                console.error('Ошибка загрузки плана работ:', error);
                setWorkPlanItems([]);
            } finally {
                setIsLoadingPlan(false);
            }
        };
        loadWorkPlan();
    }, [projectId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !startDate || !endDate || !workPlanItemId) {
            toast.error('Все поля обязательны для заполнения.');
            return;
        }

        setIsLoading(true);
        const toastId = toast.loading('Создание задачи...');

        try {
            const taskData = {
                project_id: parseInt(projectId),
                work_plan_item_id: parseInt(workPlanItemId),
                name,
                start_date: startDate,
                end_date: endDate
            };
            await ApiService.createTask(taskData);
            toast.success('Задача успешно создана', { id: toastId });
            onUpdate();
            onClose();
        } catch (error) {
            toast.error(`Ошибка: ${error.message}`, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center z-[10000] px-4">
            <div className="bg-white rounded-2xl shadow-xl p-4 w-full max-w-md max-h-[90vh] overflow-y-auto sm:p-6 sm:rounded-3xl">
                <h2 className="text-lg font-bold mb-3 sm:text-xl sm:mb-4">Новая задача</h2>
                
                {isLoadingPlan ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500">Загрузка плана работ...</p>
                    </div>
                ) : workPlanItems.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="mb-4">
                            <svg className="mx-auto h-12 w-12 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <p className="text-yellow-600 font-medium mb-2">План работ не найден</p>
                        <p className="text-gray-500 text-sm mb-4">
                            Для создания задачи необходимо сначала создать план работ для проекта.
                            <br />
                            Обратитесь к службе строительного контроля (заказчику) для создания плана.
                        </p>
                        <button 
                            onClick={onClose} 
                            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            Понятно
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3 sm:mb-4">
                            <label className="block text-xs font-medium text-gray-700 mb-1 sm:text-sm">
                                Пункт плана работ <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={workPlanItemId}
                                onChange={(e) => setWorkPlanItemId(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg text-sm sm:text-base"
                                required
                            >
                                <option value="">Выберите работу...</option>
                                {workPlanItems.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.name} ({item.quantity} {item.unit})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="mb-3 sm:mb-4">
                            <label className="block text-xs font-medium text-gray-700 mb-1 sm:text-sm">Название задачи</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg text-sm sm:text-base"
                                required
                            />
                        </div>
                        <div className="mb-3 sm:mb-4">
                            <label className="block text-xs font-medium text-gray-700 mb-1 sm:text-sm">Дата начала</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                min={today}
                                className="w-full p-2 border border-gray-300 rounded-lg text-sm sm:text-base"
                                required
                            />
                        </div>
                        <div className="mb-4 sm:mb-6">
                            <label className="block text-xs font-medium text-gray-700 mb-1 sm:text-sm">Дата окончания</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                min={startDate || today}
                                className="w-full p-2 border border-gray-300 rounded-lg text-sm sm:text-base"
                                required
                            />
                        </div>
                        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-4">
                            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg">Отмена</button>
                            <button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-400">
                                {isLoading ? 'Создание...' : 'Создать'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default CreateTaskModal;

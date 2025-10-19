import React, { useState, useEffect } from 'react';
import ApiService from '../../apiService';
import toast from 'react-hot-toast';
import CreateWorkPlanModal from './CreateWorkPlanModal';

const WorkPlanView = ({ projectId, userRole }) => {
    const [workPlan, setWorkPlan] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const fetchWorkPlan = async () => {
        setIsLoading(true);
        try {
            const data = await ApiService.getWorkPlan(projectId);
            setWorkPlan(data);
        } catch (error) {
            if (error.message.includes('не найден')) {
                setWorkPlan(null);
            } else {
                toast.error(`Ошибка загрузки плана работ: ${error.message}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchWorkPlan();
    }, [projectId]);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric' 
        });
    };

    const handleCreateSuccess = () => {
        fetchWorkPlan();
    };

    if (isLoading) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="space-y-3">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!workPlan) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">План работ еще не создан</p>
                    {userRole === 'client' && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Создать план работ
                        </button>
                    )}
                </div>
                {showCreateModal && (
                    <CreateWorkPlanModal
                        projectId={projectId}
                        onClose={() => setShowCreateModal(false)}
                        onSuccess={handleCreateSuccess}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">План работ</h2>
            </div>

            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-sm font-semibold mb-2">Общие сроки выполнения</h3>
                <p className="text-sm">
                    <span className="font-medium">С:</span> {formatDate(workPlan.start_date)} 
                    {' '}<span className="font-medium">по:</span> {formatDate(workPlan.end_date)}
                </p>
            </div>

            <div>
                <h3 className="text-sm font-semibold mb-3">Перечень работ ({workPlan.items.length})</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    №
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Наименование работы
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Плановый объем
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Фактический объем
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ед. изм.
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Сроки выполнения
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {workPlan.items.map((item, index) => {
                                const actualQuantity = item.actual_quantity || 0;
                                const plannedQuantity = item.quantity;
                                const isComplete = actualQuantity > 0;
                                const isOverfilled = actualQuantity > plannedQuantity;
                                
                                return (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {index + 1}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-900">
                                            {item.name}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {item.quantity}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                                            {isComplete ? (
                                                <span className={`font-semibold ${isOverfilled ? 'text-orange-600' : 'text-green-600'}`}>
                                                    {actualQuantity}
                                                    {isOverfilled && (
                                                        <span className="ml-1 text-xs text-orange-500">
                                                            (+{(actualQuantity - plannedQuantity).toFixed(2)})
                                                        </span>
                                                    )}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {item.unit}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(item.start_date)} - {formatDate(item.end_date)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default WorkPlanView;

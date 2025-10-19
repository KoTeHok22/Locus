import React, { useState, useEffect } from 'react';
import ApiService from '../../apiService';
import toast from 'react-hot-toast';
import CreateWorkPlanModal from './CreateWorkPlanModal';
import AddWorkPlanItemModal from './AddWorkPlanItemModal';
import EditWorkPlanItemModal from './EditWorkPlanItemModal';
import { Plus, Edit } from 'lucide-react';

const WorkPlanView = ({ projectId, userRole }) => {
    const [workPlan, setWorkPlan] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isExpanded, setIsExpanded] = useState(false);

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
        if (!dateString) return '---';
        const date = new Date(dateString);
        return date.toLocaleString('ru-RU', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    
    const handleSuccess = () => {
        fetchWorkPlan();
    };

    const handleEditClick = (item) => {
        setSelectedItem(item);
        setShowEditModal(true);
    };

    const datesAreDifferent = (date1, date2) => {
        if (!date1 || !date2) return false;
        // Compare dates ignoring milliseconds for robustness
        return new Date(date1).getTime() !== new Date(date2).getTime();
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
                        onSuccess={handleSuccess}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">План работ</h2>
                <div className="flex items-center gap-4">
                    {userRole === 'client' && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <Plus size={18} />
                            Добавить работу
                        </button>
                    )}
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-sm text-blue-600 hover:underline"
                    >
                        {isExpanded ? 'Свернуть' : 'Развернуть'}
                    </button>
                </div>
            </div>

            {isExpanded && (
                <>
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                        <h3 className="text-sm font-semibold mb-2">Общие сроки выполнения</h3>
                        <p className="text-sm">
                            <span className="font-medium">С:</span> {new Date(workPlan.start_date).toLocaleDateString('ru-RU')} 
                            {' '}<span className="font-medium">по:</span> {new Date(workPlan.end_date).toLocaleDateString('ru-RU')}
                        </p>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold mb-3">Перечень работ ({workPlan.items.length})</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">№</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Наименование работы</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Плановый объем</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ед. изм.</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Сроки</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата создания</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата изменения</th>
                                        {userRole === 'client' && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {workPlan.items.map((item, index) => (
                                            <tr key={item.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                                                <td className="px-4 py-4 text-sm text-gray-900">{item.name}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.quantity}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.unit}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(item.start_date).toLocaleDateString('ru-RU')} - {new Date(item.end_date).toLocaleDateString('ru-RU')}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(item.created_at)}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {formatDate(item.updated_at)}
                                                    {datesAreDifferent(item.created_at, item.updated_at) && (
                                                        <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                            Отредактирован
                                                        </span>
                                                    )}
                                                </td>
                                                {userRole === 'client' && (
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                                        <button onClick={() => handleEditClick(item)} className="text-blue-600 hover:text-blue-900">
                                                            <Edit size={18} />
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {showAddModal && (
                <AddWorkPlanItemModal
                    projectId={projectId}
                    workPlan={workPlan}
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => {
                        setShowAddModal(false);
                        handleSuccess();
                    }}
                />
            )}

            {showEditModal && selectedItem && (
                <EditWorkPlanItemModal
                    item={selectedItem}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedItem(null);
                    }}
                    onSuccess={() => {
                        setShowEditModal(false);
setSelectedItem(null);
                        handleSuccess();
                    }}
                />
            )}
        </div>
    );
};

export default WorkPlanView;

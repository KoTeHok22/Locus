import React from 'react';
import toast from 'react-hot-toast';
import ApiService from '../../apiService';

const VerificationTaskCard = ({ task, onUpdate }) => {

    const handleVerify = async (newStatus) => {
        const actionText = newStatus === 'verified' ? 'принять' : 'отклонить';
        if (!window.confirm(`Вы уверены, что хотите ${actionText} эту задачу?`)) {
            return;
        }

        const toastId = toast.loading('Обновление статуса задачи...');
        try {
            await ApiService.verifyTask(task.project_id, task.id, newStatus);
            toast.success(`Задача была ${newStatus === 'verified' ? 'принята' : 'отклонена'}.`, { id: toastId });
            if (onUpdate) onUpdate();
        } catch (error) {
            toast.error(`Ошибка: ${error.message}`, { id: toastId });
        }
    };

    return (
        <div className="border rounded-lg p-4 bg-white hover:shadow-md transition-all">
            <h3 className="font-semibold text-gray-800">{task.name}</h3>
            <p className="text-sm text-gray-500">Проект: {task.project_name}</p>
            <p className="text-xs text-gray-400 mt-1">Выполнена прорабом: {task.completed_at ? new Date(task.completed_at).toLocaleString() : '-'}</p>
            <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => handleVerify('rejected')} className="bg-red-100 text-red-700 px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-red-200">
                    Отклонить
                </button>
                <button onClick={() => handleVerify('verified')} className="bg-green-600 text-white px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-green-700">
                    Принять
                </button>
            </div>
        </div>
    );
};

export default VerificationTaskCard;

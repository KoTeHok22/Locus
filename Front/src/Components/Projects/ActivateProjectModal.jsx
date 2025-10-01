import React, { useState } from 'react';
import toast from 'react-hot-toast';
import ApiService from '../../apiService';

const ActivateProjectModal = ({ project, onClose, onSuccess }) => {
    const [foremanEmail, setForemanEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!foremanEmail) {
            toast.error('Введите email прораба.');
            return;
        }
        setLoading(true);
        const toastId = toast.loading('Активация проекта...');

        try {
            // Step 1: Add foreman to the project
            await ApiService.addProjectMember(project.id, foremanEmail, 'foreman');
            toast.success('Прораб успешно назначен.', { id: toastId });

            // Step 2: Activate the project
            await ApiService.activateProject(project.id);
            toast.success('Проект активирован и ожидает согласования инспектора.', { id: toastId });

            onSuccess(); // Refresh the projects list
        } catch (err) {
            toast.error(`Ошибка: ${err.message}`, { id: toastId });
        } finally {
            setLoading(false);
            onClose(); // Close the modal
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Активация проекта: {project.name}</h2>
                <p className="text-sm text-gray-600 mb-6">Чтобы активировать проект, назначьте ответственного прораба. Ему будет отправлено приглашение.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="foremanEmail" className="block text-sm font-medium text-gray-700">Email прораба*</label>
                        <input
                            id="foremanEmail"
                            type="email"
                            value={foremanEmail}
                            onChange={(e) => setForemanEmail(e.target.value)}
                            className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                            placeholder="foreman@example.com"
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium">
                            Отмена
                        </button>
                        <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:bg-gray-400">
                            {loading ? 'Активация...' : 'Активировать и назначить'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ActivateProjectModal;

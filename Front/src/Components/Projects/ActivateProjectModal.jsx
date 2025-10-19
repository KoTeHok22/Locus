import React, { useState } from 'react';
import toast from 'react-hot-toast';

const ActivateProjectModal = ({ project, onClose, onSuccess }) => {
    const [foremanEmail, setForemanEmail] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!foremanEmail) {
            toast.error('Введите email прораба.');
            return;
        }

        onSuccess(project.id, foremanEmail);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[10000] px-4">
            <div className="bg-white p-4 rounded-2xl shadow-xl w-full max-w-md sm:p-6 sm:rounded-3xl">
                <h2 className="text-lg font-bold mb-3 sm:text-xl sm:mb-4">Активация проекта: {project.name}</h2>
                <p className="text-xs text-gray-600 mb-4 sm:text-sm sm:mb-6">Чтобы активировать проект, назначьте ответственного прораба. Ему будет отправлено приглашение.</p>
                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                    <div>
                        <label htmlFor="foremanEmail" className="block text-xs font-medium text-gray-700 sm:text-sm">Email прораба*</label>
                        <input
                            id="foremanEmail"
                            type="email"
                            value={foremanEmail}
                            onChange={(e) => setForemanEmail(e.target.value)}
                            className="mt-1 w-full p-2 border border-gray-300 rounded-lg text-sm sm:text-base"
                            placeholder="foreman@example.com"
                            required
                        />
                    </div>
                    <div className="flex flex-col-reverse gap-2 pt-3 sm:flex-row sm:justify-end sm:gap-4 sm:pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium">
                            Отмена
                        </button>
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
                            Продолжить
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ActivateProjectModal;

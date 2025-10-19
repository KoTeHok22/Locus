import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import ApiService from '../../apiService';

const CreateIssueModal = ({ projects, classifiers, onClose, onUpdate, issueType = 'violation', preselectedProjectId }) => {
    const [selectedProject, setSelectedProject] = useState(preselectedProjectId || '');
    const [description, setDescription] = useState('');
    const [classifierId, setClassifierId] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const today = new Date().toISOString().split('T')[0];
    const isViolation = issueType === 'violation';

    const getCurrentPosition = () => {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true });
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedProject || !description || (isViolation && !classifierId)) {
            setError('Пожалуйста, заполните все обязательные поля.');
            return;
        }

        setIsSubmitting(true);
        setError('');
        const toastId = toast.loading('Получение геолокации...');

        try {
            const position = await getCurrentPosition();
            const { latitude, longitude } = position.coords;
            const geolocation = `${latitude},${longitude}`;
            
            toast.loading(isViolation ? 'Регистрация нарушения...' : 'Добавление замечания...', { id: toastId });

            const issueData = {
                type: issueType,
                description,
                due_date: dueDate || null,
            };

            if (isViolation) {
                issueData.classifier_id = classifierId;
            }

            await ApiService.createIssue(selectedProject, issueData, geolocation);
            
            toast.success(isViolation ? 'Нарушение успешно зарегистрировано.' : 'Замечание успешно добавлено.', { id: toastId });
            if (onUpdate) onUpdate();
            onClose();
        } catch (err) {
            if (err.code === 1) {
                toast.error('Доступ к геолокации запрещен. Пожалуйста, разрешите доступ в настройках браузера.', { id: toastId });
                setError('Не удалось получить геолокацию. Проверьте разрешения в браузере.');
            } else {
                toast.error(`Ошибка: ${err.message}`, { id: toastId });
                setError(`Ошибка: ${err.message}`);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[10000] px-4">
            <div className="bg-white rounded-2xl shadow-xl p-4 w-full max-w-lg max-h-[90vh] overflow-y-auto sm:p-6 sm:rounded-3xl">
                <h2 className="text-lg font-semibold mb-3 sm:text-xl sm:mb-4">{isViolation ? 'Зафиксировать нарушение' : 'Добавить замечание'}</h2>
                {error && <p className="text-red-500 text-xs mb-3 sm:text-sm sm:mb-4">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {!preselectedProjectId && projects && (
                        <div>
                            <label className="block text-xs font-medium text-gray-700 sm:text-sm">Проект</label>
                            <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-lg text-sm sm:text-base">
                                <option value="" disabled>Выберите проект</option>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                    )}
                    {isViolation && classifiers && (
                        <div>
                            <label className="block text-xs font-medium text-gray-700 sm:text-sm">Тип нарушения (Классификатор)</label>
                            <select value={classifierId} onChange={e => setClassifierId(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-lg text-sm sm:text-base">
                                <option value="" disabled>Выберите тип</option>
                                {classifiers.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                            </select>
                        </div>
                    )}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 sm:text-sm">Описание</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} rows="3" className="mt-1 block w-full p-2 border border-gray-300 rounded-lg text-sm sm:text-base"></textarea>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 sm:text-sm">Срок устранения</label>
                        <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} min={today} className="mt-1 block w-full p-2 border border-gray-300 rounded-lg text-sm sm:text-base" />
                    </div>
                    <div className="flex flex-col-reverse gap-2 pt-3 sm:flex-row sm:justify-end sm:gap-4 sm:pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium">Отмена</button>
                        <button type="submit" disabled={isSubmitting} className={`text-white px-4 py-2 rounded-lg text-sm font-medium ${isViolation ? 'bg-red-600' : 'bg-blue-600'} disabled:bg-gray-400`}>
                            {isSubmitting ? 'Сохранение...' : (isViolation ? 'Сохранить нарушение' : 'Сохранить замечание')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateIssueModal;

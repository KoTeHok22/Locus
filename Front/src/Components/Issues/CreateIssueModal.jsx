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
            if (err.code === 1) { // Geolocation permission denied
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
                <h2 className="text-xl font-semibold mb-4">{isViolation ? 'Зафиксировать нарушение' : 'Добавить замечание'}</h2>
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {!preselectedProjectId && projects && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Проект</label>
                            <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
                                <option value="" disabled>Выберите проект</option>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                    )}
                    {isViolation && classifiers && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Тип нарушения (Классификатор)</label>
                            <select value={classifierId} onChange={e => setClassifierId(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
                                <option value="" disabled>Выберите тип</option>
                                {classifiers.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                            </select>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Описание</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} rows="3" className="mt-1 block w-full p-2 border border-gray-300 rounded-md"></textarea>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Срок устранения</label>
                        <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} min={today} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
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

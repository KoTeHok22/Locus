import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import ApiService from '../../../apiService';
import '../../../index.css';

const CreateIssueModal = ({ projects, classifiers, onClose, onUpdate }) => {
    const [selectedProject, setSelectedProject] = useState('');
    const [description, setDescription] = useState('');
    const [classifierId, setClassifierId] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedProject || !description || !classifierId) {
            setError('Проект, описание и тип нарушения обязательны.');
            return;
        }
        try {
            const issueData = {
                type: 'violation',
                classifier_id: classifierId,
                description,
                due_date: dueDate || null,
            };
            await ApiService.createIssue(selectedProject, issueData);
            toast.success('Нарушение успешно зарегистрировано.');
            onUpdate();
            onClose();
        } catch (err) {
            setError(`Ошибка: ${err.message}`);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
                <h2 className="text-xl font-semibold mb-4">Зафиксировать нарушение</h2>
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Проект</label>
                        <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
                            <option value="" disabled>Выберите проект</option>
                            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Тип нарушения (Классификатор)</label>
                        <select value={classifierId} onChange={e => setClassifierId(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
                            <option value="" disabled>Выберите тип</option>
                            {classifiers.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Описание</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} rows="3" className="mt-1 block w-full p-2 border border-gray-300 rounded-md"></textarea>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Срок устранения</label>
                        <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium">Отмена</button>
                        <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Сохранить</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const VerificationTaskCard = ({ task, onUpdate }) => {
    const handleVerify = async () => {
        const toastId = toast.loading('Верификация задачи...');
        try {
            await ApiService.verifyTask(task.project_id, task.id, 'verified');
            toast.success('Задача верифицирована.', { id: toastId });
            onUpdate();
        } catch (error) {
            toast.error(`Ошибка: ${error.message}`, { id: toastId });
        }
    };

    return (
        <div className="border rounded-lg p-4 bg-white hover:shadow-md transition-all">
            <h3 className="font-semibold text-gray-800">{task.name}</h3>
            <p className="text-sm text-gray-500">Проект: {task.project_name}</p>
            <p className="text-xs text-gray-400 mt-1">Выполнена: {task.completed_at}</p>
            <div className="mt-4 flex justify-end">
                <button onClick={handleVerify} className="bg-green-600 text-white px-3 py-1.5 text-xs font-medium rounded-lg">Верифицировать</button>
            </div>
        </div>
    );
};

const InspectorDHB = () => {
    const [data, setData] = useState({ projects: [], tasksToVerify: [], issues: [], classifiers: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [projects, tasks, issues, classifiers] = await Promise.all([
                ApiService.getProjects(),
                ApiService.getTasks({ status: 'completed' }),
                ApiService.getIssues({ status: 'open' }),
                ApiService.getClassifiers({ type: 'violation' })
            ]);
            setData({ projects, tasksToVerify: tasks, issues, classifiers });
        } catch (err) {
            setError(err.message);
            console.error("Ошибка при загрузке данных для инспектора:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) {
        return <div className="flex items-center justify-center h-full">Загрузка данных инспектора...</div>;
    }

    if (error) {
        return <div className="flex items-center justify-center h-full text-red-500">Ошибка: {error}</div>;
    }

    return (
        <div className="p-6 h-full bg-slate-50" id="inspector-dashboard">
            {isModalOpen && 
                <CreateIssueModal 
                    projects={data.projects} 
                    classifiers={data.classifiers}
                    onClose={() => setIsModalOpen(false)} 
                    onUpdate={fetchData} 
                />
            }
            <div className="grid grid-cols-3 gap-6 h-full">
                <div className="col-span-2 min-h-0 flex flex-col gap-6">
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex-1 flex flex-col">
                        <div className="border-b border-slate-200 p-4">
                            <h2 className="text-lg font-semibold text-gray-900">К верификации ({data.tasksToVerify.length})</h2>
                        </div>
                        <div className="p-4 overflow-y-auto space-y-4">
                            {data.tasksToVerify.length > 0 ? (
                                data.tasksToVerify.map(task => <VerificationTaskCard key={task.id} task={task} onUpdate={fetchData} />)
                            ) : (
                                <p className="text-center text-gray-500 pt-10">Нет задач, ожидающих верификации.</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="col-span-1 flex flex-col gap-6 min-h-0">
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Действия инспектора</h2>
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className="w-full bg-red-600 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2">
                            <i className="fas fa-plus-circle"></i>
                            Зафиксировать нарушение
                        </button>
                    </div>
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex-1 flex flex-col">
                        <div className="border-b border-slate-200 p-4">
                            <h2 className="text-lg font-semibold text-gray-900">Открытые нарушения ({data.issues.length})</h2>
                        </div>
                        <div className="p-4 overflow-y-auto space-y-4">
                            {data.issues.length > 0 ? (
                                data.issues.map(issue => (
                                    <div key={issue.id} className="border-b pb-2">
                                        <p className="font-semibold text-sm">{issue.description}</p>
                                        <p className="text-xs text-gray-500">Проект: {issue.project_name}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-gray-500 pt-10">Нет открытых нарушений.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export { InspectorDHB };
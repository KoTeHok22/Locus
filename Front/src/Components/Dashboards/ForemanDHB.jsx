import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import ApiService from '../../apiService';
import '../../index.css';

const TaskCard = ({ task, onUpdate }) => {
    const handleComplete = async () => {
        try {
            await ApiService.updateTaskStatus(task.project_id, task.id, 'completed');
            onUpdate();
        } catch (error) {
            console.error(`Ошибка при обновлении задачи #${task.id}:`, error);
            toast.error(`Не удалось завершить задачу: ${error.message}`);
        }
    };

    return (
        <div className={`border rounded-lg p-4 transition-all bg-white ${task.status === 'completed' ? 'opacity-60 bg-slate-50' : 'hover:shadow-md'}`}>
            <h3 className="font-semibold text-gray-900">{task.name}</h3>
            <p className="text-sm text-gray-500 mb-3">Проект: {task.project_name}</p>
            <p className="text-xs text-gray-500 mb-3">Срок: до {task.end_date}</p>
            {task.status !== 'completed' ? (
                <button 
                    onClick={handleComplete}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 h-8">
                    <i className="fas fa-check-circle mr-1"></i>
                    Готово
                </button>
            ) : (
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Выполнено
                </div>
            )}
        </div>
    );
};

const IssueCard = ({ issue }) => (
    <div className="border rounded-lg p-4 transition-all hover:shadow-md border-red-200 bg-red-50">
        <h3 className="font-semibold text-gray-900 mb-1">Замечание #{issue.id}</h3>
        <p className="text-sm text-gray-600 mb-2">{issue.description}</p>
        <p className="text-xs text-gray-500 mb-3">Срок: до {issue.due_date}</p>
        <button className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 h-8">
            <i className="fas fa-camera mr-2"></i>
            Устранить
        </button>
    </div>
);

const MaterialDeliveryFlow = ({ projects, onUpdate }) => {
    const [file, setFile] = useState(null);
    const [selectedProject, setSelectedProject] = useState('');
    const [isRecognizing, setIsRecognizing] = useState(false);
    const [recognizedData, setRecognizedData] = useState(null);
    const [documentId, setDocumentId] = useState(null);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleRecognition = async () => {
        if (!file || !selectedProject) {
            toast.error('Выберите проект и файл для распознавания.');
            return;
        }
        setIsRecognizing(true);
        const toastId = toast.loading('Запущено распознавание ТТН...');
        try {
            const { document_id } = await ApiService.recognizeDocument(selectedProject, file);
            setDocumentId(document_id);

            let status = 'processing';
            while (status === 'processing' || status === 'pending') {
                await new Promise(resolve => setTimeout(resolve, 5000));
                const res = await ApiService.getRecognitionStatus(document_id);
                status = res.recognition_status;
                if (status === 'completed') {
                    toast.success('Документ успешно распознан!', { id: toastId });
                    setRecognizedData(res.recognized_data);
                    break;
                }
                 if (status === 'failed') {
                    throw new Error('Не удалось распознать документ.');
                }
            }
        } catch (error) {
            toast.error(error.message, { id: toastId });
        } finally {
            setIsRecognizing(false);
        }
    };

    const handleConfirmDelivery = async () => {
        if (!documentId || !recognizedData) {
            toast.error('Нет данных для подтверждения.');
            return;
        }
        const toastId = toast.loading('Регистрация поставки...');
        try {
            const items = recognizedData[0]?.items || [];
            await ApiService.createDelivery(selectedProject, documentId, items);
            toast.success('Поставка успешно зарегистрирована!', { id: toastId });
            setFile(null);
            setSelectedProject('');
            setRecognizedData(null);
            setDocumentId(null);
            onUpdate();
        } catch (error) {
            toast.error(`Ошибка: ${error.message}`, { id: toastId });
        }
    };

    if (recognizedData) {
        return (
            <div className="p-6">
                <h3 className="text-lg font-semibold mb-2">Проверьте распознанные данные</h3>
                <div className="bg-slate-100 p-4 rounded-lg text-xs mb-4 overflow-auto">
                    <pre>{JSON.stringify(recognizedData, null, 2)}</pre>
                </div>
                <div className="flex gap-4">
                    <button onClick={handleConfirmDelivery} className="bg-green-600 text-white px-4 py-2 rounded-lg">Подтвердить поставку</button>
                    <button onClick={() => setRecognizedData(null)} className="bg-gray-300 px-4 py-2 rounded-lg">Отмена</button>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900">Принять материал</h2>
            <p className="text-sm text-gray-600 mt-1 mb-4">Загрузите фото ТТН для автоматического распознавания.</p>
            
            <select 
                value={selectedProject}
                onChange={e => setSelectedProject(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg mb-4"
            >
                <option value="" disabled>Выберите проект</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>

            <input type="file" onChange={handleFileChange} className="w-full text-sm" />

            <button 
                onClick={handleRecognition} 
                disabled={isRecognizing || !file || !selectedProject}
                className="w-full mt-4 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg disabled:bg-gray-400">
                {isRecognizing ? 'Распознавание...' : 'Начать распознавание'}
            </button>
        </div>
    );
}

function ForemanDHB(){
    const [data, setData] = useState({ projects: [], tasks: [], issues: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [projects, tasks, issues] = await Promise.all([
                ApiService.getProjects(),
                ApiService.getTasks(),
                ApiService.getIssues(),
            ]);
            setData({ projects, tasks, issues });
        } catch (err) {
            setError(err.message);
            console.error("Ошибка при загрузке данных для прораба:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) {
        return <div className="flex items-center justify-center h-full">Загрузка данных прораба...</div>;
    }

    if (error) {
        return <div className="flex items-center justify-center h-full text-red-500">Ошибка: {error}</div>;
    }

    return(
        <div className="p-6 h-full bg-slate-50" id="foreman-dashboard">
            <div className="grid grid-cols-3 gap-6 h-full">
                <div className="col-span-2 min-h-0 flex flex-col gap-6">
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex-1 flex flex-col">
                        <div className="border-b border-slate-200 p-4">
                            <h2 className="text-lg font-semibold text-gray-900">Мои задачи ({data.tasks.length})</h2>
                        </div>
                        <div className="p-4 overflow-y-auto space-y-4">
                            {data.tasks.length > 0 ? (
                                data.tasks.map(task => <TaskCard key={task.id} task={task} onUpdate={fetchData} />)
                            ) : (
                                <p className="text-center text-gray-500 pt-10">Нет назначенных задач.</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="col-span-1 flex flex-col gap-6 min-h-0">
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
                         <MaterialDeliveryFlow projects={data.projects} onUpdate={fetchData} />
                    </div>
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex-1 flex flex-col">
                        <div className="border-b border-slate-200 p-4">
                            <h2 className="text-lg font-semibold text-gray-900">Замечания ({data.issues.length})</h2>
                        </div>
                        <div className="p-4 overflow-y-auto space-y-4">
                            {data.issues.length > 0 ? (
                                data.issues.map(issue => <IssueCard key={issue.id} issue={issue} />)
                            ) : (
                                <p className="text-center text-gray-500 pt-10">Нет открытых замечаний.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export { ForemanDHB };
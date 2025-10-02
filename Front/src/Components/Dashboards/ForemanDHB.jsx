import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import ApiService from '../../apiService';
import { translate } from '../../utils/translation.js';
import TaskCompletionModal from '../Tasks/TaskCompletionModal';
import '../../index.css';

const TaskCard = ({ task, onUpdate, onComplete }) => {

    const getStatusBadgeClass = (status) => {
        switch(status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'completed': return 'bg-blue-100 text-blue-800';
            case 'verified': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className={`border rounded-lg p-4 transition-all bg-white ${task.status === 'pending' ? 'hover:shadow-md' : 'opacity-75 bg-slate-50'}`}>
            <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900">{task.name}</h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(task.status)}`}>
                    {translate(task.status)}
                </span>
            </div>
            <p className="text-sm text-gray-500 mb-1">Проект: {task.project_name}</p>
            <p className="text-xs text-gray-500 mb-3">Срок: до {task.end_date}</p>
            {task.status === 'pending' && (
                <button 
                    onClick={() => onComplete(task)}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 h-8">
                    <i className="fas fa-check-circle mr-1"></i>
                    Готово
                </button>
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
    const [editableItems, setEditableItems] = useState([]);
    const [documentId, setDocumentId] = useState(null);

    useEffect(() => {
        if (recognizedData && recognizedData[0]?.items) {
            setEditableItems(recognizedData[0].items);
        } else {
            setEditableItems([]);
        }
    }, [recognizedData]);

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

    const handleItemChange = (index, field, value) => {
        const updatedItems = [...editableItems];
        updatedItems[index][field] = value;
        setEditableItems(updatedItems);
    };

    const handleConfirmDelivery = async () => {
        if (!documentId || !editableItems) {
            toast.error('Нет данных для подтверждения.');
            return;
        }
        const toastId = toast.loading('Регистрация поставки...');
        try {
            await ApiService.createDelivery(selectedProject, documentId, editableItems);
            toast.success('Поставка успешно зарегистрирована!', { id: toastId });
            setFile(null);
            setSelectedProject('');
            setRecognizedData(null);
            setEditableItems([]);
            setDocumentId(null);
            onUpdate();
        } catch (error) {
            toast.error(`Ошибка: ${error.message}`, { id: toastId });
        }
    };

    if (recognizedData) {
        return (
            <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Проверьте и исправьте данные</h3>
                <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                    {editableItems.map((item, index) => (
                        <div key={index} className="p-3 border rounded-lg bg-slate-50 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs text-gray-600">Наименование</label>
                                    <input 
                                        type="text" 
                                        value={item.name || ''}
                                        onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                                        className="w-full p-1.5 border rounded-md text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-600">Количество</label>
                                    <input 
                                        type="number" 
                                        value={item.quantity || ''}
                                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                        className="w-full p-1.5 border rounded-md text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-600">Ед. изм.</label>
                                <input 
                                    type="text" 
                                    value={item.unit || ''}
                                    onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                                    className="w-full p-1.5 border rounded-md text-sm"
                                />
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex gap-4 mt-4">
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
    const [completingTask, setCompletingTask] = useState(null);

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
        <>
            {completingTask && (
                <TaskCompletionModal 
                    task={completingTask}
                    onClose={() => setCompletingTask(null)}
                    onUpdate={fetchData}
                />
            )}
            <div className="p-6 h-full bg-slate-50" id="foreman-dashboard">
                <div className="grid grid-cols-3 gap-6 h-full">
                    <div className="col-span-2 min-h-0 flex flex-col gap-6">
                        <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex-1 flex flex-col">
                            <div className="border-b border-slate-200 p-4">
                                <h2 className="text-lg font-semibold text-gray-900">Мои задачи ({data.tasks.length})</h2>
                            </div>
                            <div className="p-4 overflow-y-auto space-y-4">
                                {data.tasks.length > 0 ? (
                                    data.tasks.map(task => <TaskCard key={task.id} task={task} onUpdate={fetchData} onComplete={setCompletingTask} />)
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
        </>
    )
}

export { ForemanDHB };
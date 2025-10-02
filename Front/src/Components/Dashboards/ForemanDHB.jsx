import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircle, AlertTriangle, PackageCheck, Camera, UploadCloud, ClipboardList, Clock, Loader2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import ApiService from '../../apiService';
import { translate } from '../../utils/translation.js';
import TaskCompletionModal from '../Tasks/TaskCompletionModal';
import '../../index.css';

const taskStatusStyles = {
    pending: {
        badge: 'bg-amber-100 text-amber-700 border-amber-200',
        dot: 'bg-amber-500',
    },
    completed: {
        badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
    },
    verified: {
        badge: 'bg-blue-100 text-blue-700 border-blue-200',
        dot: 'bg-blue-500',
    },
};

const TaskCard = ({ index, task, onComplete }) => {
    const styles = taskStatusStyles[task.status] || {
        badge: 'bg-slate-100 text-slate-600 border-slate-200',
        dot: 'bg-slate-400',
    };

    return (
        <div
            className={`rounded-2xl border border-slate-100 bg-white/70 p-4 transition-all ${
                task.status === 'pending' ? 'hover:border-blue-200 hover:shadow-lg' : 'opacity-80'
            }`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white`}>
                        {index + 1}
                    </div>
                    <div>
                        <h3 className={`text-base font-semibold text-slate-900 ${task.status !== 'pending' ? 'line-through text-slate-500' : ''}`}>
                            {task.name}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">{task.project_name || 'Без проекта'}</p>
                    </div>
                </div>
                <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${styles.badge}`}>
                    <span className={`h-2 w-2 rounded-full ${styles.dot}`} />
                    {translate(task.status)}
                </span>
            </div>

            {task.description && (
                <p className={`mt-3 text-sm text-slate-600 ${task.status !== 'pending' ? 'line-through text-slate-400' : ''}`}>
                    {task.description}
                </p>
            )}

            {task.end_date && (
                <p className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                    <Clock size={14} className="text-slate-400" />
                    Срок: {task.end_date}
                </p>
            )}

            {task.status === 'pending' && (
                <div className="mt-4 flex items-center gap-3">
                    <button
                        onClick={() => onComplete(task)}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
                    >
                        <CheckCircle size={14} />
                        Готово
                    </button>
                </div>
            )}
        </div>
    );
};

const IssueCard = ({ issue }) => {
    const fileInputRef = useRef(null);
    const [selectedFileName, setSelectedFileName] = useState('');

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }
        setSelectedFileName(file.name);
        toast.success('Фото добавлено. Отправьте отчет через систему.');
    };

    return (
        <div className="rounded-2xl border border-red-100 bg-red-50/70 p-4 shadow-sm transition-all hover:border-red-200 hover:shadow-lg">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h3 className="text-sm font-semibold text-slate-900">Замечание #{issue.id}</h3>
                    <p className="mt-2 text-sm text-slate-600">{issue.description}</p>
                    {issue.project_name && (
                        <p className="mt-2 text-xs text-slate-500">Проект: {issue.project_name}</p>
                    )}
                    {issue.due_date && (
                        <p className="mt-1 text-xs text-slate-500">Срок: до {issue.due_date}</p>
                    )}
                    {selectedFileName && (
                        <p className="mt-2 text-xs text-blue-600">Прикреплено: {selectedFileName}</p>
                    )}
                </div>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
                    <AlertTriangle size={18} />
                </span>
            </div>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
            />
            <button
                onClick={handleUploadClick}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
            >
                <Camera size={14} />
                Устранить
            </button>
        </div>
    );
};

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
            <div className="flex h-full flex-col gap-4">
                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-2">
                        <PackageCheck size={18} className="text-emerald-600" />
                        <h3 className="text-lg font-semibold text-slate-900">Проверьте данные поставки</h3>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">Отредактируйте позиции перед подтверждением</p>
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                    {editableItems.map((item, index) => (
                        <div key={index} className="rounded-xl border border-slate-200 bg-white p-4">
                            <div className="grid gap-3 sm:grid-cols-2">
                                <label className="text-xs font-semibold text-slate-500">
                                    Наименование
                                    <input
                                        type="text"
                                        value={item.name || ''}
                                        onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    />
                                </label>
                                <label className="text-xs font-semibold text-slate-500">
                                    Количество
                                    <input
                                        type="number"
                                        value={item.quantity || ''}
                                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    />
                                </label>
                            </div>
                            <label className="mt-3 block text-xs font-semibold text-slate-500">
                                Ед. изм.
                                <input
                                    type="text"
                                    value={item.unit || ''}
                                    onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                />
                            </label>
                        </div>
                    ))}
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                        onClick={handleConfirmDelivery}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                    >
                        <PackageCheck size={16} />
                        Подтвердить поставку
                    </button>
                    <button
                        onClick={() => setRecognizedData(null)}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition-colors hover:border-slate-300"
                    >
                        <XCircle size={16} />
                        Отмена
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col gap-4">
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2">
                    <PackageCheck size={18} className="text-blue-600" />
                    <h2 className="text-lg font-semibold text-slate-900">Принять материал</h2>
                </div>
                <p className="mt-1 text-sm text-slate-500">Загрузите фото ТТН для автоматического распознавания поставки.</p>
            </div>

            <select
                value={selectedProject}
                onChange={e => setSelectedProject(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
                <option value="" disabled>Выберите проект</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>

            <label className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 px-6 py-5 text-center text-sm text-slate-500 transition-all hover:border-blue-300 hover:bg-blue-50">
                <UploadCloud size={24} className="text-blue-500" />
                <span>Перетащите файл или выберите вручную</span>
                <input type="file" onChange={handleFileChange} className="hidden" />
                {file && <span className="text-xs text-blue-600">Выбран файл: {file.name}</span>}
            </label>

            <button
                onClick={handleRecognition}
                disabled={isRecognizing || !file || !selectedProject}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
                {isRecognizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackageCheck size={16} />}
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
            <div className="flex h-full flex-col gap-6 bg-slate-50" id="foreman-dashboard">
                <div className="grid flex-1 gap-6 px-4 pb-6 lg:grid-cols-[2fr_1fr] lg:px-0">
                    <section className="flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                            <div>
                                <div className="flex items-center gap-2 text-slate-500">
                                    <ClipboardList size={16} />
                                    <span className="text-sm font-semibold">Мои задачи</span>
                                </div>
                                <h2 className="mt-1 text-xl font-semibold text-slate-900">Сегодня {data.tasks.length} задач</h2>
                                <p className="text-sm text-slate-500">Контролируйте выполнение ключевых работ</p>
                            </div>
                            <span className="inline-flex h-10 items-center justify-center rounded-full bg-blue-50 px-4 text-sm font-semibold text-blue-600">
                                {data.tasks.filter(task => task.status !== 'completed').length} в процессе
                            </span>
                        </div>
                        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
                            {data.tasks.length > 0 ? (
                                data.tasks.map((task, index) => (
                                    <TaskCard
                                        key={task.id}
                                        index={index}
                                        task={task}
                                        onComplete={setCompletingTask}
                                    />
                                ))
                            ) : (
                                <div className="flex h-full flex-col items-center justify-center rounded-2xl bg-slate-50 py-10 text-center text-sm text-slate-500">
                                    <CheckCircle size={32} className="mb-3 text-emerald-500" />
                                    Все задачи выполнены
                                </div>
                            )}
                        </div>
                    </section>

                    <aside className="flex flex-col gap-6">
                        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                            <MaterialDeliveryFlow projects={data.projects} onUpdate={fetchData} />
                        </div>
                        <div className="flex-1 overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
                            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                                <div>
                                    <div className="flex items-center gap-2 text-red-500">
                                        <AlertTriangle size={16} />
                                        <span className="text-sm font-semibold">Замечания</span>
                                    </div>
                                    <h2 className="mt-1 text-lg font-semibold text-slate-900">{data.issues.length} открыто</h2>
                                </div>
                                <span className="inline-flex h-9 items-center justify-center rounded-full bg-red-50 px-4 text-xs font-semibold text-red-600">
                                    Срочно
                                </span>
                            </div>
                            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
                                {data.issues.length > 0 ? (
                                    data.issues.map(issue => <IssueCard key={issue.id} issue={issue} />)
                                ) : (
                                    <div className="flex h-full flex-col items-center justify-center rounded-2xl bg-slate-50 py-10 text-center text-sm text-slate-500">
                                        Нарушений не обнаружено
                                    </div>
                                )}
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </>
    );
}

export { ForemanDHB };
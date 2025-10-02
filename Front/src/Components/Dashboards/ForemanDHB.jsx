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
            className={`rounded-xl border border-slate-100 bg-white/70 p-3 transition-all sm:rounded-2xl sm:p-4 ${
                task.status === 'pending' ? 'hover:border-blue-200 hover:shadow-md' : 'opacity-80'
            }`}
        >
            <div className="flex items-start gap-2 sm:gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white sm:h-10 sm:w-10 sm:text-sm">
                    {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className={`text-sm font-semibold text-slate-900 sm:text-base ${task.status !== 'pending' ? 'line-through text-slate-500' : ''}`}>
                        {task.name}
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500">{task.project_name || 'Без проекта'}</p>
                </div>
                <span className={`flex-shrink-0 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold sm:gap-1.5 sm:px-2.5 sm:py-1 sm:text-xs ${styles.badge}`}>
                    <span className={`h-1.5 w-1.5 rounded-full sm:h-2 sm:w-2 ${styles.dot}`} />
                    <span className="hidden sm:inline">{translate(task.status)}</span>
                </span>
            </div>

            {task.description && (
                <p className={`mt-2 text-xs text-slate-600 sm:mt-3 sm:text-sm ${task.status !== 'pending' ? 'line-through text-slate-400' : ''}`}>
                    {task.description}
                </p>
            )}

            {task.end_date && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                    <Clock size={12} className="text-slate-400 sm:hidden" />
                    <Clock size={14} className="hidden text-slate-400 sm:block" />
                    <span className="text-[11px] sm:text-xs">Срок: {task.end_date}</span>
                </p>
            )}

            {task.status === 'pending' && (
                <div className="mt-3 flex items-center gap-2 sm:mt-4 sm:gap-3">
                    <button
                        onClick={() => onComplete(task)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 sm:rounded-xl sm:px-3 sm:py-2 sm:text-sm"
                    >
                        <CheckCircle size={12} className="sm:hidden" />
                        <CheckCircle size={14} className="hidden sm:block" />
                        <span>Готово</span>
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
        <div className="rounded-xl border border-red-100 bg-red-50/70 p-3 shadow-sm transition-all hover:border-red-200 hover:shadow-md sm:rounded-2xl sm:p-4">
            <div className="flex items-start justify-between gap-2 sm:gap-3">
                <div className="min-w-0 flex-1">
                    <h3 className="text-xs font-semibold text-slate-900 sm:text-sm">Замечание #{issue.id}</h3>
                    <p className="mt-1.5 text-xs text-slate-600 sm:mt-2 sm:text-sm">{issue.description}</p>
                    {issue.project_name && (
                        <p className="mt-1.5 text-[10px] text-slate-500 sm:mt-2 sm:text-xs">Проект: {issue.project_name}</p>
                    )}
                    {issue.due_date && (
                        <p className="mt-1 text-[10px] text-slate-500 sm:text-xs">Срок: до {issue.due_date}</p>
                    )}
                    {selectedFileName && (
                        <p className="mt-1.5 text-[10px] text-blue-600 sm:mt-2 sm:text-xs">Прикреплено: {selectedFileName}</p>
                    )}
                </div>
                <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 sm:h-10 sm:w-10">
                    <AlertTriangle size={14} className="sm:hidden" />
                    <AlertTriangle size={18} className="hidden sm:block" />
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
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 sm:mt-4 sm:rounded-xl sm:px-3 sm:py-2 sm:text-sm"
            >
                <Camera size={12} className="sm:hidden" />
                <Camera size={14} className="hidden sm:block" />
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
            <div className="flex h-full flex-col gap-3 sm:gap-4">
                <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-5">
                    <div className="flex items-center gap-2">
                        <PackageCheck size={16} className="text-emerald-600 sm:hidden" />
                        <PackageCheck size={18} className="hidden text-emerald-600 sm:block" />
                        <h3 className="text-base font-semibold text-slate-900 sm:text-lg">Проверьте данные</h3>
                    </div>
                    <p className="mt-1 text-xs text-slate-500 sm:text-sm">Отредактируйте позиции</p>
                </div>
                <div className="flex-1 space-y-2 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/70 p-3 sm:space-y-3 sm:rounded-2xl sm:p-4">
                    {editableItems.map((item, index) => (
                        <div key={index} className="rounded-lg border border-slate-200 bg-white p-3 sm:rounded-xl sm:p-4">
                            <div className="space-y-3">
                                <label className="block text-xs font-semibold text-slate-500">
                                    Наименование
                                    <input
                                        type="text"
                                        value={item.name || ''}
                                        onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    />
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <label className="text-xs font-semibold text-slate-500">
                                        Количество
                                        <input
                                            type="number"
                                            value={item.quantity || ''}
                                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                        />
                                    </label>
                                    <label className="text-xs font-semibold text-slate-500">
                                        Ед. изм.
                                        <input
                                            type="text"
                                            value={item.unit || ''}
                                            onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                                            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-3">
                    <button
                        onClick={() => setRecognizedData(null)}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition-colors hover:border-slate-300"
                    >
                        <XCircle size={16} />
                        Отмена
                    </button>
                    <button
                        onClick={handleConfirmDelivery}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                    >
                        <PackageCheck size={16} />
                        Подтвердить
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col gap-3 sm:gap-4">
            <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-5">
                <div className="flex items-center gap-2">
                    <PackageCheck size={16} className="text-blue-600 sm:hidden" />
                    <PackageCheck size={18} className="hidden text-blue-600 sm:block" />
                    <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Принять материал</h2>
                </div>
                <p className="mt-1 text-xs text-slate-500 sm:text-sm">Загрузите фото ТТН для распознавания</p>
            </div>

            <select
                value={selectedProject}
                onChange={e => setSelectedProject(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 sm:rounded-xl sm:px-4 sm:py-3 sm:text-sm"
            >
                <option value="" disabled>Выберите проект</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>

            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-4 text-center text-xs text-slate-500 transition-all hover:border-blue-300 hover:bg-blue-50 sm:gap-3 sm:rounded-2xl sm:px-6 sm:py-5 sm:text-sm">
                <UploadCloud size={20} className="text-blue-500 sm:hidden" />
                <UploadCloud size={24} className="hidden text-blue-500 sm:block" />
                <span>Выберите файл</span>
                <input type="file" onChange={handleFileChange} className="hidden" />
                {file && <span className="text-[11px] text-blue-600 sm:text-xs">Выбран: {file.name}</span>}
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
        return (
            <div className="flex h-full items-center justify-center">
                <p className="text-sm text-slate-500">Загрузка...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-full items-center justify-center rounded-2xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-500">Ошибка: {error}</p>
            </div>
        );
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
            <div className="flex h-full flex-col gap-4 bg-slate-50 sm:gap-6" id="foreman-dashboard">
                <div className="grid flex-1 gap-4 px-4 pb-4 sm:gap-6 sm:pb-6 md:grid-cols-2 lg:grid-cols-[2fr_1fr] lg:px-0">
                    <section className="flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm sm:rounded-3xl">
                        <div className="flex flex-col gap-1 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
                            <div>
                                <div className="flex items-center gap-1.5 text-slate-500 sm:gap-2">
                                    <ClipboardList size={14} className="sm:hidden" />
                                    <ClipboardList size={16} className="hidden sm:block" />
                                    <span className="text-xs font-semibold sm:text-sm">Мои задачи</span>
                                </div>
                                <h2 className="mt-1 text-lg font-semibold text-slate-900 sm:text-xl">Сегодня {data.tasks.length}</h2>
                                <p className="text-xs text-slate-500 sm:text-sm">Контроль ключевых работ</p>
                            </div>
                            <span className="mt-2 inline-flex h-8 w-fit items-center justify-center rounded-full bg-blue-50 px-3 text-xs font-semibold text-blue-600 sm:mt-0 sm:h-10 sm:px-4 sm:text-sm">
                                {data.tasks.filter(task => task.status !== 'completed').length} в процессе
                            </span>
                        </div>
                        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:space-y-4 sm:px-6 sm:py-5">
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
                                <div className="flex h-full flex-col items-center justify-center rounded-xl bg-slate-50 py-8 text-center text-xs text-slate-500 sm:rounded-2xl sm:py-10 sm:text-sm">
                                    <CheckCircle size={28} className="mb-2 text-emerald-500 sm:mb-3 sm:size-8" />
                                    Все задачи выполнены
                                </div>
                            )}
                        </div>
                    </section>

                    <aside className="flex flex-col gap-4 sm:gap-6">
                        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
                            <MaterialDeliveryFlow projects={data.projects} onUpdate={fetchData} />
                        </div>
                        <div className="flex max-h-[300px] flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm sm:max-h-[400px] sm:rounded-3xl md:flex-1">
                            <div className="flex flex-col gap-1 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
                                <div>
                                    <div className="flex items-center gap-1.5 text-red-500 sm:gap-2">
                                        <AlertTriangle size={14} className="sm:hidden" />
                                        <AlertTriangle size={16} className="hidden sm:block" />
                                        <span className="text-xs font-semibold sm:text-sm">Замечания</span>
                                    </div>
                                    <h2 className="mt-1 text-base font-semibold text-slate-900 sm:text-lg">{data.issues.length} открыто</h2>
                                </div>
                                <span className="mt-2 inline-flex h-7 w-fit items-center justify-center rounded-full bg-red-50 px-3 text-[10px] font-semibold text-red-600 sm:mt-0 sm:h-9 sm:px-4 sm:text-xs">
                                    Срочно
                                </span>
                            </div>
                            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:space-y-4 sm:px-6 sm:py-5">
                                {data.issues.length > 0 ? (
                                    data.issues.map(issue => <IssueCard key={issue.id} issue={issue} />)
                                ) : (
                                    <div className="flex h-full flex-col items-center justify-center rounded-xl bg-slate-50 py-8 text-center text-xs text-slate-500 sm:rounded-2xl sm:py-10 sm:text-sm">
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

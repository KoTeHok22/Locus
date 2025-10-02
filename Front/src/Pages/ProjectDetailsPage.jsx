import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, Calendar, ClipboardCheck, AlertTriangle, FileText, PlusCircle, User, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import ApiService from '../apiService';
import { OSMMap } from '../Components/Map/OSMMap';
import CreateIssueModal from '../Components/Issues/CreateIssueModal';
import CreateTaskModal from '../Components/Tasks/CreateTaskModal';
import AuthService from '../authService';
import VerificationTaskCard from '../Components/Tasks/VerificationTaskCard';
import TTNCard from '../Components/Documents/TTNCard';
import EditTTNModal from '../Components/Documents/EditTTNModal';
import { translate } from '../utils/translation.js';

function ProjectDetailsPage() {
    const { projectId } = useParams();
    const [project, setProject] = useState(null);
    const [tasksToVerify, setTasksToVerify] = useState([]);
    const [issues, setIssues] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [editingDocument, setEditingDocument] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isIssueModalOpen, setIssueModalOpen] = useState(false);
    const [isTaskModalOpen, setTaskModalOpen] = useState(false);
    const userRole = AuthService.getUserRole();

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [projectData, documentsData] = await Promise.all([
                ApiService.getProjectDetails(projectId),
                ApiService.getProjectDocuments(projectId)
            ]);
            setProject(projectData);
            setDocuments(documentsData);

            if (userRole === 'client') {
                const tasksData = await ApiService.getTasks({ project_id: projectId, status: 'completed' });
                setTasksToVerify(tasksData);
            }

            if (userRole === 'inspector') {
                const issuesData = await ApiService.getIssues({ project_id: projectId });
                setIssues(issuesData);
            }
            
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [projectId, userRole]);

    const handleDeleteDocument = async (documentId) => {
        try {
            // Сначала найдём поставку, связанную с этим документом
            const deliveries = await ApiService.getProjectDeliveries(projectId);
            const delivery = deliveries.find(d => d.document_id === documentId);
            
            if (delivery) {
                await ApiService.deleteMaterialDelivery(delivery.id);
                toast.success('Документ успешно удалён');
            } else {
                // Если поставка не найдена, возможно документ был загружен но не распознан
                // Пробуем удалить сам документ
                toast.error('Поставка не найдена для этого документа. Документ может быть не распознан.');
                console.error('Delivery not found for document:', documentId);
            }
            
            // Обновляем данные в любом случае
            fetchData();
        } catch (err) {
            toast.error(err.message || 'Ошибка удаления документа');
            console.error('Delete error:', err);
        }
    };

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center rounded-3xl border border-slate-100 bg-white p-8">
                <p className="text-slate-500">Загрузка данных о проекте...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-full items-center justify-center rounded-3xl border border-red-200 bg-red-50 p-8">
                <p className="text-red-500">Ошибка: {error}</p>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="flex h-full items-center justify-center rounded-3xl border border-slate-100 bg-slate-50 p-8">
                <p className="text-slate-500">Проект не найден.</p>
            </div>
        );
    }

    return (
        <>
            {isIssueModalOpen && (
                <CreateIssueModal
                    preselectedProjectId={projectId}
                    issueType='remark'
                    onClose={() => setIssueModalOpen(false)}
                    onUpdate={fetchData}
                />
            )}
            {isTaskModalOpen && (
                <CreateTaskModal
                    projectId={projectId}
                    onClose={() => setTaskModalOpen(false)}
                    onUpdate={fetchData}
                />
            )}
            {editingDocument && (
                <EditTTNModal 
                    document={editingDocument}
                    onClose={() => setEditingDocument(null)}
                    onUpdate={() => {
                        setEditingDocument(null);
                        fetchData();
                    }}
                />
            )}
            
            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:flex-row sm:items-start sm:justify-between sm:p-6">
                    <div className="flex-1">
                        <h1 className="text-2xl font-semibold text-slate-900">{project.name}</h1>
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                            <MapPin size={16} className="text-slate-400" />
                            {project.address || 'Адрес не указан'}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                            <span
                                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
                                    project.status === 'active'
                                        ? 'border-emerald-100 bg-emerald-50 text-emerald-600'
                                        : project.status === 'pending'
                                        ? 'border-amber-100 bg-amber-50 text-amber-600'
                                        : 'border-slate-100 bg-slate-50 text-slate-600'
                                }`}
                            >
                                <span
                                    className={`h-2 w-2 rounded-full ${
                                        project.status === 'active'
                                            ? 'bg-emerald-500'
                                            : project.status === 'pending'
                                            ? 'bg-amber-500'
                                            : 'bg-slate-400'
                                    }`}
                                />
                                {translate(project.status)}
                            </span>
                            <span className="flex items-center gap-1.5 text-xs text-slate-500">
                                <Calendar size={14} className="text-slate-400" />
                                Создан: {new Date(project.created_at).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                    {userRole === 'client' && (
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <button 
                                onClick={() => setTaskModalOpen(true)}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                            >
                                <PlusCircle size={16} />
                                <span>Задача</span>
                            </button>
                            <button 
                                onClick={() => setIssueModalOpen(true)}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                            >
                                <PlusCircle size={16} />
                                <span>Замечание</span>
                            </button>
                        </div>
                    )}
                </div>
                
                <div className="grid gap-4 lg:grid-cols-3">
                    <div className="flex h-[400px] flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm sm:h-[500px] lg:col-span-2 lg:h-[600px]">
                        <div className="border-b border-slate-200 px-4 py-3 sm:px-6 sm:py-4">
                            <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Карта объекта</h2>
                            <p className="text-xs text-slate-500 sm:text-sm">Расположение и границы территории</p>
                        </div>
                        <div className="relative flex-1 bg-slate-100">
                            <OSMMap projects={[project]} />
                        </div>
                    </div>

                    <div className="flex h-[400px] flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm sm:h-[500px] lg:h-[600px]">
                        <div className="border-b border-slate-200 px-4 py-3 sm:px-6 sm:py-4">
                            <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Детали проекта</h2>
                            <p className="text-xs text-slate-500 sm:text-sm">Полная информация об объекте</p>
                        </div>
                        <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:space-y-4 sm:p-6">
                            <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
                                <ClipboardCheck size={18} className="mt-0.5 flex-shrink-0 text-slate-500" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-slate-500">Статус</p>
                                    <p className="mt-1 text-sm font-medium capitalize text-slate-900">
                                        {translate(project.status)}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
                                <MapPin size={18} className="mt-0.5 flex-shrink-0 text-slate-500" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-slate-500">Адрес</p>
                                    <p className="mt-1 text-sm font-medium text-slate-900">
                                        {project.address || 'Не указан'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
                                <Calendar size={18} className="mt-0.5 flex-shrink-0 text-slate-500" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-slate-500">Дата создания</p>
                                    <p className="mt-1 text-sm font-medium text-slate-900">
                                        {new Date(project.created_at).toLocaleDateString('ru-RU', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric'
                                        })}
                                    </p>
                                </div>
                            </div>

                            {project.latitude && project.longitude && (
                                <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
                                    <MapPin size={18} className="mt-0.5 flex-shrink-0 text-slate-500" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-slate-500">Координаты</p>
                                        <p className="mt-1 text-xs font-mono text-slate-900">
                                            {project.latitude.toFixed(6)}, {project.longitude.toFixed(6)}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="rounded-xl border border-slate-200 bg-white p-3">
                                <p className="mb-3 text-xs font-semibold text-slate-500">Статистика</p>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-slate-600">Документы</span>
                                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600">
                                            {documents.length}
                                        </span>
                                    </div>
                                    {userRole === 'inspector' && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-slate-600">Нарушения</span>
                                            <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
                                                {issues.length}
                                            </span>
                                        </div>
                                    )}
                                    {userRole === 'client' && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-slate-600">На верификацию</span>
                                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-600">
                                                {tasksToVerify.length}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Блоки под картой */}
                <div className={`grid gap-4 lg:grid-cols-2 ${userRole === 'client' ? 'xl:grid-cols-3' : 'xl:grid-cols-2'}`}>
                    {userRole === 'client' && (
                        <div className="rounded-3xl border border-slate-100 bg-white shadow-sm">
                            <div className="border-b border-slate-200 px-4 py-3 sm:px-6 sm:py-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Задачи на верификацию</h2>
                                        <p className="text-xs text-slate-500 sm:text-sm">Требуют подтверждения выполнения</p>
                                    </div>
                                    <span className="inline-flex h-7 items-center justify-center rounded-full bg-blue-50 px-3 text-[10px] font-semibold text-blue-600 sm:h-9 sm:px-4 sm:text-xs">
                                        {tasksToVerify.length}
                                    </span>
                                </div>
                            </div>
                            <div className="max-h-96 space-y-3 overflow-y-auto p-4 sm:space-y-4 sm:p-6">
                                {tasksToVerify.length > 0 ? (
                                    tasksToVerify.map(task => (
                                        <VerificationTaskCard key={task.id} task={task} onUpdate={fetchData} />
                                    ))
                                ) : (
                                    <div className="flex items-center justify-center rounded-xl bg-slate-50 p-6 text-center">
                                        <p className="text-sm text-slate-500">Задач на подтверждение нет</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="rounded-3xl border border-slate-100 bg-white shadow-sm">
                        <div className="border-b border-slate-200 px-4 py-3 sm:px-6 sm:py-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Нарушения</h2>
                                    <p className="text-xs text-slate-500 sm:text-sm">Зафиксированные на объекте</p>
                                </div>
                                <span className="inline-flex h-7 items-center justify-center rounded-full bg-red-50 px-3 text-[10px] font-semibold text-red-600 sm:h-9 sm:px-4 sm:text-xs">
                                    {issues.length}
                                </span>
                            </div>
                        </div>
                        <div className="max-h-96 space-y-3 overflow-y-auto p-4 sm:p-6">
                                {issues.length > 0 ? (
                                    issues.map(issue => (
                                        <div key={issue.id} className="rounded-2xl border border-red-100 bg-red-50/70 p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold text-slate-900">{issue.description}</p>
                                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                                        <span
                                                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                                                                issue.status === 'open'
                                                                    ? 'border-red-200 bg-red-100 text-red-700'
                                                                    : 'border-slate-200 bg-slate-100 text-slate-600'
                                                            }`}
                                                        >
                                                            {translate(issue.status)}
                                                        </span>
                                                        {issue.due_date && (
                                                            <span className="text-xs text-slate-500">до {issue.due_date}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <AlertTriangle size={18} className="text-red-500" />
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex items-center justify-center rounded-xl bg-slate-50 p-6 text-center">
                                        <p className="text-sm text-slate-500">Нарушений нет</p>
                                    </div>
                            )}
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-100 bg-white shadow-sm">
                        <div className="border-b border-slate-200 px-4 py-3 sm:px-6 sm:py-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Документы</h2>
                                    <p className="text-xs text-slate-500 sm:text-sm">ТТН и накладные</p>
                                </div>
                                <span className="inline-flex h-7 items-center justify-center rounded-full bg-blue-50 px-3 text-[10px] font-semibold text-blue-600 sm:h-9 sm:px-4 sm:text-xs">
                                    {documents.length}
                                </span>
                            </div>
                        </div>
                        <div className="max-h-96 space-y-3 overflow-y-auto p-4 sm:p-6">
                            {documents.length > 0 ? (
                                documents.map(doc => (
                                    <TTNCard 
                                        key={doc.id} 
                                        document={doc} 
                                        onEdit={() => setEditingDocument(doc)}
                                        onDelete={userRole === 'foreman' ? handleDeleteDocument : null}
                                    />
                                ))
                            ) : (
                                <div className="flex items-center justify-center rounded-xl bg-slate-50 p-6 text-center">
                                    <p className="text-sm text-slate-500">Документов нет</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export { ProjectDetailsPage };

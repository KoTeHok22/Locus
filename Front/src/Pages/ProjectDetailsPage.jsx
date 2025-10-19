import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Calendar, ClipboardCheck, AlertTriangle, FileText, PlusCircle, User, Users, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import ApiService from '../apiService';
import { OSMMap } from '../Components/Map/OSMMap';
import CreateIssueModal from '../Components/Issues/CreateIssueModal';
import ResolveIssueModal from '../Components/Issues/ResolveIssueModal';
import VerifyResolutionModal from '../Components/Issues/VerifyResolutionModal';
import CreateTaskModal from '../Components/Tasks/CreateTaskModal';
import AuthService from '../authService';
import VerificationTaskCard from '../Components/Tasks/VerificationTaskCard';
import TaskCard from '../Components/Tasks/TaskCard';
import AllTasksModal from '../Components/Tasks/AllTasksModal';
import TTNCard from '../Components/Documents/TTNCard';
import EditTTNModal from '../Components/Documents/EditTTNModal';
import ActivateProjectModal from '../Components/Projects/ActivateProjectModal';
import ChecklistCompletionModal from '../Components/Checklists/ChecklistCompletionModal';
import ProjectRiskIndicator from '../Components/Risk/ProjectRiskIndicator';
import RiskDetailsModal from '../Components/Risk/RiskDetailsModal';
import MaterialDeliveryBlock from '../Components/Documents/MaterialDeliveryBlock';
import IssueDetailsModal from '../Components/Issues/IssueDetailsModal';
import WorkPlanView from '../Components/WorkPlan/WorkPlanView';
import { translate } from '../utils/translation.js';

function ProjectDetailsPage() {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [tasksToVerify, setTasksToVerify] = useState([]);
    const [allTasks, setAllTasks] = useState([]);
    const [issues, setIssues] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [checklists, setChecklists] = useState([]);
    const [checklistCompletions, setChecklistCompletions] = useState([]);
    const [editingDocument, setEditingDocument] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isIssueModalOpen, setIssueModalOpen] = useState(false);
    const [isTaskModalOpen, setTaskModalOpen] = useState(false);
    const [resolvingIssue, setResolvingIssue] = useState(null);
    const [verifyingIssue, setVerifyingIssue] = useState(null);
    const [activatingProject, setActivatingProject] = useState(null);
    const [riskData, setRiskData] = useState(null);
    const [isRiskModalOpen, setRiskModalOpen] = useState(false);
    const [viewingIssue, setViewingIssue] = useState(null);
    const [isAllTasksModalOpen, setAllTasksModalOpen] = useState(false);
    const [checklistToFill, setChecklistToFill] = useState(null);
    const [projectForChecklist, setProjectForChecklist] = useState(null);
    const [foremanEmail, setForemanEmail] = useState(null);
    const userRole = AuthService.getUserRole();

    const fetchData = useCallback(async (signal) => {
        try {
            setLoading(true);
            const [projectData, documentsData, checklistsData] = await Promise.all([
                ApiService.getProjectDetails(projectId, { signal }),
                ApiService.getProjectDocuments(projectId, { signal }),
                ApiService.getChecklists(null, { signal })
            ]);
            setProject(projectData);
            setDocuments(documentsData);
            
            const checklistsArray = Array.isArray(checklistsData) ? checklistsData : (checklistsData.checklists || []);
            setChecklists(checklistsArray);
            
            try {
                const [openingCompletions, dailyCompletions] = await Promise.all([
                    ApiService.getChecklistCompletions(projectId, 'opening', { signal }).catch(() => []),
                    ApiService.getChecklistCompletions(projectId, 'daily', { signal }).catch(() => [])
                ]);
                const allCompletions = [...(Array.isArray(openingCompletions) ? openingCompletions : []), ...(Array.isArray(dailyCompletions) ? dailyCompletions : [])];
                setChecklistCompletions(allCompletions);
            } catch (err) {
                console.error('Ошибка загрузки чек-листов:', err);
                setChecklistCompletions([]);
            }

            if (userRole === 'client') {
                const [tasksToVerifyData, allTasksData] = await Promise.all([
                    ApiService.getTasks({ project_id: projectId, status: 'completed' }, { signal }),
                    ApiService.getTasks({ project_id: projectId }, { signal })
                ]);
                setTasksToVerify(tasksToVerifyData);
                setAllTasks(allTasksData);
            }

            const issuesData = await ApiService.getIssues({ project_id: projectId, status: 'open' }, { signal });
            setIssues(issuesData);

            try {
                const riskResponse = await ApiService.getProjectRisk(projectId, { signal });
                setRiskData(riskResponse);
            } catch (err) {
                console.error('Ошибка загрузки данных о рисках:', err);
                setRiskData(null);
            }
            
        } catch (err) {
            if (err.name !== 'AbortError') {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    }, [projectId, userRole]);

    const handleDeleteDocument = async (documentId) => {
        try {
            const deliveries = await ApiService.getProjectDeliveries(projectId);
            const delivery = deliveries.find(d => d.document_id === documentId);
            
            if (delivery) {
                await ApiService.deleteMaterialDelivery(delivery.id);
                toast.success('Документ успешно удалён');
            } else {
                toast.error('Поставка не найдена для этого документа. Документ может быть не распознан.');
                console.error('Delivery not found for document:', documentId);
            }
            
            fetchData();
        } catch (err) {
            toast.error(err.message || 'Ошибка удаления документа');
            console.error('Delete error:', err);
        }
    };

    useEffect(() => {
        const controller = new AbortController();
        fetchData(controller.signal);
        return () => controller.abort();
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

            {resolvingIssue && (
                <ResolveIssueModal
                    issue={resolvingIssue}
                    onClose={() => setResolvingIssue(null)}
                    onUpdate={fetchData}
                />
            )}

            {verifyingIssue && (
                <VerifyResolutionModal
                    issue={verifyingIssue}
                    onClose={() => setVerifyingIssue(null)}
                    onUpdate={fetchData}
                />
            )}

            {activatingProject && (
                <ActivateProjectModal
                    project={activatingProject}
                    onClose={() => setActivatingProject(null)}
                    onSuccess={async (projectId, email) => {
                        setActivatingProject(null);
                        
                        try {
                            const data = await ApiService.getChecklists();
                            const checklistsArray = Array.isArray(data) ? data : (data.checklists || []);
                            const openingChecklist = checklistsArray.find(c => c.type === 'opening');
                            
                            if (openingChecklist) {
                                setChecklistToFill(openingChecklist);
                                setProjectForChecklist(projectId);
                                setForemanEmail(email);
                            } else {
                                toast.error('Чек-лист открытия объекта не найден');
                            }
                            
                            fetchData();
                        } catch (err) {
                            toast.error('Не удалось загрузить чек-лист: ' + err.message);
                            fetchData();
                        }
                    }}
                />
            )}

            {checklistToFill && projectForChecklist && (
                <ChecklistCompletionModal
                    checklist={checklistToFill}
                    projectId={projectForChecklist}
                    editingCompletion={null}
                    onClose={() => {
                        setChecklistToFill(null);
                        setProjectForChecklist(null);
                        setForemanEmail(null);
                        fetchData();
                    }}
                    onComplete={async () => {
                        const pId = projectForChecklist;
                        const email = foremanEmail;
                        
                        setChecklistToFill(null);
                        setProjectForChecklist(null);
                        setForemanEmail(null);
                        
                        if (email) {
                            try {
                                await ApiService.addProjectMember(pId, email, 'foreman');
                                await ApiService.activateProject(pId);
                                toast.success('Чек-лист отправлен на согласование! Прораб назначен.');
                            } catch (err) {
                                toast.error('Чек-лист отправлен, но ошибка при назначении прораба: ' + err.message);
                            }
                        } else {
                            toast.success('Чек-лист отправлен на согласование!');
                        }
                        
                        fetchData();
                    }}
                />
            )}

            {isRiskModalOpen && (
                <RiskDetailsModal
                    projectId={projectId}
                    onClose={() => setRiskModalOpen(false)}
                />
            )}

            {viewingIssue && (
                <IssueDetailsModal
                    issueId={viewingIssue.id}
                    onClose={() => setViewingIssue(null)}
                />
            )}

            {isAllTasksModalOpen && (
                <AllTasksModal
                    tasks={allTasks}
                    onClose={() => setAllTasksModalOpen(false)}
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
                    <div className="flex flex-col gap-2 sm:flex-row">
                        {userRole === 'client' && (
                            <>
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
                                <button 
                                    onClick={() => navigate(`/projects/${projectId}/materials`)}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-700"
                                >
                                    <Package size={16} />
                                    <span>Материалы</span>
                                </button>
                                {allTasks.length > 0 && (
                                    <button 
                                        onClick={() => setAllTasksModalOpen(true)}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
                                    >
                                        <ClipboardCheck size={16} />
                                        <span>Все задачи ({allTasks.length})</span>
                                    </button>
                                )}
                            </>
                        )}
                        {userRole === 'foreman' && (
                            <button 
                                onClick={() => navigate(`/projects/${projectId}/foreman-work`)}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-700"
                            >
                                <Package size={16} />
                                <span>Рабочий стол</span>
                            </button>
                        )}
                    </div>
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
                                        <span className="text-xs text-slate-600">Чек-листы</span>
                                        <span className="rounded-full bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-600">
                                            {new Set(checklistCompletions.map(c => c.checklist_id)).size} / {checklists.length}
                                        </span>
                                    </div>
                                    {userRole === 'client' && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-slate-600">Задачи</span>
                                            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-600">
                                                {allTasks.length}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-slate-600">Документы</span>
                                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600">
                                            {documents.length}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-slate-600">Нарушения</span>
                                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
                                            {issues.length}
                                        </span>
                                    </div>
                                    {userRole === 'client' && tasksToVerify.length > 0 && (
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

                {/* Блок Чек-листы */}
                <div className="rounded-3xl border border-slate-100 bg-white shadow-sm">
                    <div className="border-b border-slate-200 px-4 py-3 sm:px-6 sm:py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Чек-листы</h2>
                                <p className="text-xs text-slate-500 sm:text-sm">Контроль качества и готовности</p>
                            </div>
                            <button
                                onClick={() => navigate(`/projects/${projectId}/checklists`)}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100"
                            >
                                <ClipboardCheck size={14} />
                                Все чек-листы
                            </button>
                        </div>
                    </div>
                    <div className="space-y-3 p-4 sm:p-6">
                        {checklists.length > 0 ? (
                            checklists.slice(0, 3).map(checklist => {
                                const completion = checklistCompletions.find(c => c.checklist_id === checklist.id);
                                const completionStatus = completion?.approval_status || 'not_filled';
                                const canFill = userRole === 'client';
                                
                                return (
                                    <div key={checklist.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1">
                                                <h3 className="text-sm font-semibold text-slate-900">{checklist.name}</h3>
                                                <p className="mt-1 text-xs text-slate-600">{checklist.description}</p>
                                                <div className="mt-2 flex items-center gap-2">
                                                    <span
                                                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                                                            completionStatus === 'approved'
                                                                ? 'border-green-200 bg-green-100 text-green-700'
                                                                : completionStatus === 'pending'
                                                                ? 'border-amber-200 bg-amber-100 text-amber-700'
                                                                : completionStatus === 'rejected'
                                                                ? 'border-red-200 bg-red-100 text-red-700'
                                                                : 'border-slate-200 bg-slate-100 text-slate-600'
                                                        }`}
                                                    >
                                                        {completionStatus === 'approved' && '✓ Согласован'}
                                                        {completionStatus === 'pending' && '⏳ На согласовании'}
                                                        {completionStatus === 'rejected' && '✗ Отклонён'}
                                                        {completionStatus === 'not_filled' && '○ Не заполнен'}
                                                    </span>
                                                </div>
                                                {canFill && (
                                                    <button
                                                        onClick={() => {
                                                            if (checklist.type === 'opening' && completionStatus === 'not_filled') {
                                                                setActivatingProject(project);
                                                            } else {
                                                                navigate(`/projects/${projectId}/checklists`);
                                                            }
                                                        }}
                                                        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
                                                    >
                                                        <ClipboardCheck size={14} />
                                                        {completionStatus === 'not_filled' ? 'Заполнить' : 'Просмотреть'}
                                                    </button>
                                                )}
                                            </div>
                                            <ClipboardCheck size={18} className={
                                                completionStatus === 'approved' ? 'text-green-500' :
                                                completionStatus === 'pending' ? 'text-amber-500' :
                                                completionStatus === 'rejected' ? 'text-red-500' :
                                                'text-slate-400'
                                            } />
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="flex items-center justify-center rounded-xl bg-slate-50 p-6 text-center">
                                <p className="text-sm text-slate-500">Чек-листы недоступны</p>
                            </div>
                        )}
                        {checklists.length > 3 && (
                            <button
                                onClick={() => navigate(`/projects/${projectId}/checklists`)}
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                            >
                                Показать все ({checklists.length})
                            </button>
                        )}
                    </div>
                </div>

                <WorkPlanView projectId={projectId} userRole={userRole} />

                {riskData && (
                    <div className="rounded-3xl border border-orange-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 px-4 py-3 sm:px-6 sm:py-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Оценка рисков проекта</h2>
                                    <p className="text-xs text-slate-500 sm:text-sm">Анализ факторов, влияющих на успех проекта</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 sm:p-6">
                            <div className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-4">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                                    <div className="flex items-center gap-3 sm:gap-4">
                                        <div className="rounded-xl bg-orange-100 p-2.5 sm:p-3">
                                            <AlertTriangle size={20} className="text-orange-600 sm:hidden" />
                                            <AlertTriangle size={24} className="text-orange-600 hidden sm:block" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">Уровень риска</p>
                                            <div className="mt-1">
                                                <ProjectRiskIndicator 
                                                    riskLevel={riskData.risk_level} 
                                                    riskScore={riskData.risk_score} 
                                                    size="md"
                                                    showLabel={true}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-left sm:text-right">
                                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">Баллов риска</p>
                                        <p className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">{riskData.risk_score}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setRiskModalOpen(true)}
                                    className="mt-4 w-full rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-700"
                                >
                                    Подробности
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {userRole === 'foreman' && (
                    <MaterialDeliveryBlock projectId={projectId} onUpdate={fetchData} />
                )}

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
                                                                    : issue.status === 'pending_verification'
                                                                    ? 'border-amber-200 bg-amber-100 text-amber-700'
                                                                    : 'border-green-200 bg-green-100 text-green-700'
                                                            }`}
                                                        >
                                                            {translate(issue.status)}
                                                        </span>
                                                        {issue.due_date && (
                                                            <span className="text-xs text-slate-500">до {issue.due_date}</span>
                                                        )}
                                                    </div>
                                                    {}
                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        <button
                                                            onClick={() => setViewingIssue(issue)}
                                                            className="rounded-lg bg-slate-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 transition"
                                                        >
                                                            Подробнее
                                                        </button>
                                                        {userRole === 'foreman' && issue.status === 'open' && (
                                                            <button
                                                                onClick={() => setResolvingIssue(issue)}
                                                                className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition"
                                                            >
                                                                Устранить
                                                            </button>
                                                        )}
                                                        {userRole === 'inspector' && issue.status === 'pending_verification' && (
                                                            <button
                                                                onClick={() => setVerifyingIssue(issue)}
                                                                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition"
                                                            >
                                                                Верифицировать
                                                            </button>
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

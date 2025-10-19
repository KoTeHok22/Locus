import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import ApiService from '../apiService';
import { translate } from '../utils/translation';
import ActivateProjectModal from '../Components/Projects/ActivateProjectModal';
import ChecklistCompletionModal from '../Components/Checklists/ChecklistCompletionModal';
import CreateProjectFormOSM from '../Components/ObjectList/CreateProjectFormOSM';
import AuthService from '../authService';
import ProjectRiskIndicator from '../Components/Risk/ProjectRiskIndicator';

const CreateProjectModal = ({ onCancel, onUpdate }) => {
    const [error, setError] = useState('');

    const handleSubmit = async (projectData) => {
        setError('');
        try {
            await ApiService.createProject(projectData);
            toast.success('Проект успешно создан!');
            onUpdate();
            onCancel();
        } catch (err) {
            setError(err.message || 'Не удалось создать проект');
        }
    };

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
            <div className="w-full max-w-2xl rounded-3xl border border-slate-100 bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-semibold text-slate-900">Создать новый проект</h2>
                <p className="mt-1 text-sm text-slate-500 mb-4">Выберите местоположение на карте или введите адрес</p>
                <CreateProjectFormOSM 
                    onSubmit={handleSubmit}
                    onCancel={onCancel}
                    apiError={error}
                />
            </div>
        </div>
    );
};

const ProjectCard = ({ project, userRole, onNavigate, onActivate }) => {
    const showActivateButton = userRole === 'client' && project.status === 'pending' && !project.has_pending_checklist;
    const showPendingButton = userRole === 'client' && project.status === 'pending' && project.has_pending_checklist;

    return (
        <div className="group flex flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:border-blue-200 hover:shadow-lg">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-slate-900 group-hover:text-blue-700">
                        {project.name}
                    </h3>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                        <MapPin size={14} className="text-slate-400" />
                        {project.address || 'Адрес не указан'}
                    </p>
                </div>
            </div>
            
            <div className="mt-4 flex items-center gap-2">
                <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
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
                {project.status === 'active' && project.risk_level && (
                    <ProjectRiskIndicator 
                        riskLevel={project.risk_level} 
                        riskScore={project.risk_score}
                        size="sm"
                        showLabel={false}
                        showScore={true}
                    />
                )}
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button
                    onClick={() => onNavigate(project.id)}
                    className="flex-1 rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                >
                    Подробнее
                </button>
                {showActivateButton && (
                    <button
                        onClick={() => onActivate(project)}
                        className="flex-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 sm:flex-initial"
                    >
                        Активировать
                    </button>
                )}
                {showPendingButton && (
                    <button
                        disabled
                        className="flex-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm font-semibold text-amber-700 cursor-not-allowed sm:flex-initial"
                    >
                        Ожидаем одобрения
                    </button>
                )}
            </div>
        </div>
    );
};

const ProjectsPage = () => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [activatingProject, setActivatingProject] = useState(null);
    const [checklistToFill, setChecklistToFill] = useState(null);
    const [projectForChecklist, setProjectForChecklist] = useState(null);
    const [foremanEmail, setForemanEmail] = useState(null);
    const userRole = AuthService.getUserRole();

    const fetchProjects = useCallback(async (signal) => {
        setLoading(true);
        try {
            const data = await ApiService.getProjects({ signal });
            setProjects(data);
        } catch (err) {
            if (err.name !== 'AbortError') {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        fetchProjects(controller.signal);
        return () => controller.abort();
    }, [fetchProjects]);

    const handleActivationSuccess = async (projectId, email) => {
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
            
            fetchProjects();
        } catch (err) {
            toast.error('Не удалось загрузить чек-лист: ' + err.message);
            fetchProjects();
        }
    };

    if (error) {
        return (
            <div className="flex h-full items-center justify-center rounded-3xl border border-red-200 bg-red-50 p-6">
                <div className="text-center">
                    <p className="text-lg font-semibold text-red-600">Ошибка при загрузке проектов</p>
                    <p className="mt-1 text-sm text-red-500">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <>
            {showCreateModal && <CreateProjectModal onCancel={() => setShowCreateModal(false)} onUpdate={fetchProjects} />}
            {activatingProject && (
                <ActivateProjectModal
                    project={activatingProject}
                    onClose={() => setActivatingProject(null)}
                    onSuccess={handleActivationSuccess}
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
                        fetchProjects();
                    }}
                    onComplete={async () => {
                        const projectId = projectForChecklist;
                        const email = foremanEmail;
                        
                        setChecklistToFill(null);
                        setProjectForChecklist(null);
                        setForemanEmail(null);
                        
                        if (email) {
                            try {
                                await ApiService.addProjectMember(projectId, email, 'foreman');
                                await ApiService.activateProject(projectId);
                                toast.success('Чек-лист отправлен на согласование! Прораб назначен.');
                            } catch (err) {
                                toast.error('Чек-лист отправлен, но ошибка при назначении прораба: ' + err.message);
                            }
                        } else {
                            toast.success('Чек-лист отправлен на согласование!');
                        }
                        
                        fetchProjects();
                    }}
                />
            )}
            
            <div className="flex flex-col gap-6 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">Все проекты</h1>
                        <p className="mt-1 text-sm text-slate-500">Управление строительными объектами</p>
                    </div>
                    {userRole === 'client' && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                        >
                            <PlusCircle size={18} />
                            <span className="hidden sm:inline">Создать проект</span>
                            <span className="sm:hidden">Создать</span>
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center rounded-2xl bg-slate-50 p-6">
                        <p className="text-slate-500">Загрузка...</p>
                    </div>
                ) : projects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-50 p-10">
                        <p className="text-slate-500">Проекты не найдены</p>
                        {userRole === 'client' && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                            >
                                <PlusCircle size={18} />
                                Создать первый проект
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {projects.map(project => (
                            <ProjectCard
                                key={project.id}
                                project={project}
                                userRole={userRole}
                                onNavigate={(id) => navigate(`/projects/${id}`)}
                                onActivate={setActivatingProject}
                            />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

export { ProjectsPage };

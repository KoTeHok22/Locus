import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ClipboardCheck, ClipboardList, Calendar, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import ApiService from '../../apiService';
import AuthService from '../../authService';
import ChecklistCompletionModal from './ChecklistCompletionModal';
import ChecklistHistory from './ChecklistHistory';
import PendingApprovalsList from './PendingApprovalsList';
import ActivateProjectModal from '../Projects/ActivateProjectModal';

const ChecklistsList = () => {
    const { projectId: urlProjectId } = useParams();
    const navigate = useNavigate();
    const [checklists, setChecklists] = useState([]);
    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState(urlProjectId || '');
    const [loading, setLoading] = useState(true);
    const [selectedChecklist, setSelectedChecklist] = useState(null);
    const [showHistory, setShowHistory] = useState(false);
    const [historyType, setHistoryType] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [projectAccess, setProjectAccess] = useState(null);
    const [todayCompletions, setTodayCompletions] = useState({});
    const [editingCompletion, setEditingCompletion] = useState(null);
    const [activatingProject, setActivatingProject] = useState(null);
    const [checklistToFill, setChecklistToFill] = useState(null);
    const [projectForChecklist, setProjectForChecklist] = useState(null);
    const [foremanEmail, setForemanEmail] = useState(null);

    useEffect(() => {
        const role = AuthService.getUserRole();
        console.log('Loading user role:', role);
        console.log('localStorage user:', localStorage.getItem('user'));
        setUserRole(role);
        
        if (role !== 'inspector') {
            loadChecklists();
            loadProjects();
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        if (urlProjectId) {
            setSelectedProjectId(urlProjectId);
        }
    }, [urlProjectId]);

    useEffect(() => {
        if (userRole === 'foreman' && selectedProjectId) {
            checkAccess();
        }
        if (selectedProjectId) {
            checkTodayCompletions();
        }
    }, [selectedProjectId, userRole]);

    const loadProjects = async () => {
        try {
            const data = await ApiService.getProjects();
            setProjects(data || []);
        } catch (error) {
            console.error('Ошибка загрузки проектов:', error);
        }
    };

    const checkAccess = async () => {
        if (!selectedProjectId) return;
        try {
            const data = await ApiService.checkProjectAccess(selectedProjectId);
            setProjectAccess(data);
        } catch (error) {
            console.error('Ошибка проверки доступа:', error);
        }
    };

    const checkTodayCompletions = async () => {
        if (!selectedProjectId) return;
        const completions = {};
        try {
            for (const checklist of checklists.filter(c => c.type === 'daily')) {
                const result = await ApiService.getTodayCompletion(selectedProjectId, checklist.id);
                if (result.exists) {
                    completions[checklist.id] = result.completion;
                }
            }
            setTodayCompletions(completions);
        } catch (error) {
            console.error('Ошибка проверки заполненных чек-листов:', error);
        }
    };

    const handleProjectChange = (e) => {
        const newProjectId = e.target.value;
        setSelectedProjectId(newProjectId);
        setProjectAccess(null);
        
        if (newProjectId) {
            navigate(`/projects/${newProjectId}/checklists`);
        } else {
            navigate('/checklists');
        }
    };

    const loadChecklists = async () => {
        try {
            const data = await ApiService.getChecklists();
            const checklistsArray = Array.isArray(data) ? data : (data.checklists || []);
            
            if (Array.isArray(checklistsArray)) {
                setChecklists(checklistsArray);
            } else {
                console.error('API вернул неожиданный формат:', data);
                setChecklists([]);
                toast.error('Чек-листы не найдены');
            }
        } catch (error) {
            toast.error('Не удалось загрузить чек-листы');
            console.error(error);
            setChecklists([]);
        } finally {
            setLoading(false);
        }
    };

    const handleFillChecklist = (checklist) => {
        if (!selectedProjectId) {
            toast.error('Выберите проект');
            return;
        }

        if (checklist.type === 'opening' && userRole !== 'client') {
            toast.error('Чек-лист открытия объекта заполняет только ССК');
            return;
        }

        if (checklist.type === 'daily' && userRole !== 'client') {
            toast.error('Ежедневный чек-лист заполняет только ССК');
            return;
        }

        if (userRole === 'foreman' && projectAccess && !projectAccess.has_access) {
            toast.error(projectAccess.message || 'Объект не активирован');
            return;
        }

        if (checklist.type === 'opening') {
            const project = projects.find(p => p.id === parseInt(selectedProjectId));
            if (project) {
                setActivatingProject(project);
            }
            return;
        }

        if (checklist.type === 'daily') {
            const project = projects.find(p => p.id === parseInt(selectedProjectId));
            if (!project || project.status !== 'active') {
                toast.error('Объект должен быть активирован перед заполнением ежедневного чек-листа');
                return;
            }
        }

        if (todayCompletions[checklist.id]) {
            setEditingCompletion(todayCompletions[checklist.id]);
        } else {
            setEditingCompletion(null);
        }

        setSelectedChecklist(checklist);
    };

    const canFillChecklist = (checklist) => {
        console.log('canFillChecklist:', { userRole, checklistType: checklist.type });
        
        if (!userRole) {
            return false; // Роль еще не загружена
        }
        
        return userRole === 'client';
    };

    const handleGoToPendingApprovals = () => {
        navigate('/pending-approvals');
    };

    const handleViewHistory = (type) => {
        if (!selectedProjectId) {
            toast.error('Выберите проект');
            return;
        }
        setHistoryType(type);
        setShowHistory(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center rounded-2xl bg-slate-50 p-10">
                <p className="text-slate-500">Загрузка чек-листов...</p>
            </div>
        );
    }

    if (userRole === 'inspector') {
        return <PendingApprovalsList />;
    }

    const openingChecklists = Array.isArray(checklists) ? checklists.filter(c => c.type === 'opening') : [];
    const dailyChecklists = Array.isArray(checklists) ? checklists.filter(c => c.type === 'daily') : [];

    if (!loading && checklists.length === 0) {
        return (
            <div className="flex flex-col gap-6 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">Чек-листы</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Заполнение чек-листов для контроля качества строительства
                    </p>
                </div>
                
                <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-50 p-10">
                    <ClipboardList size={64} className="text-slate-300 mb-4" />
                    <p className="text-lg font-semibold text-slate-700">Чек-листы не найдены</p>
                    <p className="mt-1 text-sm text-slate-500">В системе пока нет доступных чек-листов</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                    <h1 className="text-2xl font-semibold text-slate-900">Чек-листы</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Заполнение чек-листов для контроля качества строительства
                    </p>
                    
                    <div className="mt-4 max-w-md">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Выберите проект
                        </label>
                        <select
                            value={selectedProjectId}
                            onChange={handleProjectChange}
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        >
                            <option value="">-- Выберите проект --</option>
                            {projects.map(project => (
                                <option key={project.id} value={project.id}>
                                    {project.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {userRole === 'foreman' && projectAccess && !projectAccess.has_access && (
                        <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                            <AlertCircle size={16} />
                            <span>{projectAccess.message}</span>
                        </div>
                    )}
                </div>
                
                {userRole === 'inspector' && (
                    <button
                        onClick={handleGoToPendingApprovals}
                        className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-700"
                    >
                        <ClipboardCheck size={18} />
                        <span className="hidden sm:inline">На согласование</span>
                        <span className="sm:hidden">Согласование</span>
                    </button>
                )}
            </div>

            <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-blue-50 to-white p-5">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                        <div className="rounded-xl bg-blue-100 p-2.5">
                            <CheckCircle size={20} className="text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-slate-900">
                                Чек-листы открытия объекта
                            </h2>
                            <p className="mt-0.5 text-sm text-slate-600">
                                Проверка готовности объекта к началу работ
                            </p>
                        </div>
                    </div>
                    {selectedProjectId && (
                        <button
                            onClick={() => handleViewHistory('opening')}
                            className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50"
                        >
                            <Clock size={16} />
                            <span className="hidden sm:inline">История</span>
                        </button>
                    )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    {openingChecklists.map(checklist => (
                        <div
                            key={checklist.id}
                            className="group flex flex-col rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
                        >
                            <div className="mb-3 flex items-start justify-between gap-2">
                                <h3 className="flex-1 text-sm font-semibold text-slate-900 group-hover:text-blue-700">
                                    {checklist.name}
                                </h3>
                                {checklist.requires_approval && (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-orange-100 bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-orange-600">
                                        <AlertCircle size={12} />
                                        Согласование
                                    </span>
                                )}
                            </div>
                            {checklist.description && (
                                <p className="mb-3 text-xs text-slate-500">{checklist.description}</p>
                            )}
                            <div className="mb-4 flex items-center gap-1.5 text-xs text-slate-600">
                                <ClipboardList size={14} className="text-slate-400" />
                                <span>{checklist.items?.length || 0} пунктов</span>
                            </div>
                            {todayCompletions[checklist.id] && (
                                <div className="mb-2 rounded-lg border border-emerald-100 bg-emerald-50 px-2 py-1.5 text-xs text-emerald-700">
                                    ✓ Заполнен сегодня
                                </div>
                            )}
                            <button
                                onClick={() => handleFillChecklist(checklist)}
                                disabled={!selectedProjectId || !canFillChecklist(checklist) || (userRole === 'foreman' && projectAccess && !projectAccess.has_access)}
                                className="mt-auto rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                            >
                                {!selectedProjectId ? 'Выберите проект' : 
                                 !canFillChecklist(checklist) ? '🔒 Нет прав доступа' :
                                 (userRole === 'foreman' && projectAccess && !projectAccess.has_access) ? '🔒 Нет доступа' :
                                 'Заполнить'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {}
            <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-emerald-50 to-white p-5">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                        <div className="rounded-xl bg-emerald-100 p-2.5">
                            <Calendar size={20} className="text-emerald-600" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-slate-900">
                                Ежедневные чек-листы
                            </h2>
                            <p className="mt-0.5 text-sm text-slate-600">
                                Ежедневный контроль работ на объекте
                            </p>
                        </div>
                    </div>
                    {selectedProjectId && (
                        <button
                            onClick={() => handleViewHistory('daily')}
                            className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"
                        >
                            <Clock size={16} />
                            <span className="hidden sm:inline">История</span>
                        </button>
                    )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    {dailyChecklists.map(checklist => (
                        <div
                            key={checklist.id}
                            className="group flex flex-col rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md"
                        >
                            <div className="mb-3 flex items-start justify-between gap-2">
                                <h3 className="flex-1 text-sm font-semibold text-slate-900 group-hover:text-emerald-700">
                                    {checklist.name}
                                </h3>
                                {checklist.requires_initialization && (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-600">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                            <circle cx="12" cy="10" r="3"/>
                                        </svg>
                                        GPS
                                    </span>
                                )}
                            </div>
                            {checklist.description && (
                                <p className="mb-3 text-xs text-slate-500">{checklist.description}</p>
                            )}
                            <div className="mb-4 flex items-center gap-1.5 text-xs text-slate-600">
                                <ClipboardList size={14} className="text-slate-400" />
                                <span>{checklist.items?.length || 0} пунктов</span>
                            </div>
                            {todayCompletions[checklist.id] && (
                                <div className="mb-2 rounded-lg border border-emerald-100 bg-emerald-50 px-2 py-1.5 text-xs text-emerald-700">
                                    ✓ Заполнен сегодня
                                </div>
                            )}
                            <button
                                onClick={() => handleFillChecklist(checklist)}
                                disabled={
                                    !selectedProjectId || 
                                    !canFillChecklist(checklist) || 
                                    (userRole === 'foreman' && projectAccess && !projectAccess.has_access) ||
                                    (() => {
                                        const project = projects.find(p => p.id === parseInt(selectedProjectId));
                                        return !project || project.status !== 'active';
                                    })()
                                }
                                className="mt-auto rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                            >
                                {!selectedProjectId ? 'Выберите проект' : 
                                 (() => {
                                    const project = projects.find(p => p.id === parseInt(selectedProjectId));
                                    if (!project || project.status !== 'active') return '🔒 Объект не активирован';
                                 })() ||
                                 !canFillChecklist(checklist) ? '🔒 Нет прав доступа' :
                                 (userRole === 'foreman' && projectAccess && !projectAccess.has_access) ? '🔒 Нет доступа' :
                                 todayCompletions[checklist.id] ? 'Редактировать' : 'Заполнить'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {selectedChecklist && (
                <ChecklistCompletionModal
                    checklist={selectedChecklist}
                    projectId={selectedProjectId}
                    editingCompletion={editingCompletion}
                    onClose={() => {
                        setSelectedChecklist(null);
                        setEditingCompletion(null);
                    }}
                    onComplete={() => {
                        setSelectedChecklist(null);
                        setEditingCompletion(null);
                        checkTodayCompletions(); // Обновляем список
                        toast.success(editingCompletion ? 'Чек-лист успешно обновлен!' : 'Чек-лист успешно заполнен!');
                    }}
                />
            )}

            {showHistory && (
                <ChecklistHistory
                    projectId={selectedProjectId}
                    checklistType={historyType}
                    onClose={() => setShowHistory(false)}
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
                        } catch (err) {
                            toast.error('Не удалось загрузить чек-лист: ' + err.message);
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
                        loadProjects();
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
                        
                        loadProjects();
                    }}
                />
            )}
        </div>
    );
};

export default ChecklistsList;

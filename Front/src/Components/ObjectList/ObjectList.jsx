import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, MapPin, ArrowRight } from 'lucide-react';
import ApiService from '../../apiService';
import AuthService from '../../authService';
import { translate } from '../../utils/translation';
import '../../index.css';
import CreateProjectFormOSM from './CreateProjectFormOSM';

function ObjectList({ onSwitchToPage }) {
    const navigate = useNavigate();
    const userRole = AuthService.getUserRole(); 
    const [projects, setProjects] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [formError, setFormError] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const projectsData = await ApiService.getProjects();
            setProjects(projectsData || []);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreateProject = async (projectData) => {
        try {
            setFormError(null); 
            await ApiService.createProject(projectData);
            setShowCreateForm(false);
            fetchData();
        } catch (error) {
            if (error.response && error.response.data && error.response.data.message) {
                setFormError(error.response.data.message);
            } else {
                setFormError('Произошла неизвестная ошибка при создании проекта.');
            }
        }
    };

    const handleOpenCreateForm = () => {
        setFormError(null);
        setShowCreateForm(true);
    };

    return (
        <>
            <div className="flex h-full flex-col gap-6 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h3 className="text-2xl font-semibold text-slate-900">Все объекты</h3>
                        <p className="mt-1 text-sm text-slate-500">Управление строительными проектами</p>
                    </div>
                    {(userRole !== 'inspector' && userRole !== 'foreman') && (
                        <button 
                            onClick={handleOpenCreateForm}
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                        >
                            <PlusCircle size={18} />
                            <span className="hidden sm:inline">Создать объект</span>
                            <span className="sm:hidden">Создать</span>
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex h-full items-center justify-center rounded-2xl bg-slate-50">
                            <p className="text-slate-500">Загрузка...</p>
                        </div>
                    ) : error ? (
                        <div className="flex h-full items-center justify-center rounded-2xl border border-red-200 bg-red-50">
                            <div className="text-center">
                                <p className="text-sm font-semibold text-red-600">Ошибка загрузки</p>
                                <p className="mt-1 text-xs text-red-500">{error}</p>
                            </div>
                        </div>
                    ) : projects.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center rounded-2xl bg-slate-50 py-10">
                            <p className="text-slate-500">Объектов пока нет</p>
                            {(userRole !== 'inspector' && userRole !== 'foreman') && (
                                <button 
                                    onClick={handleOpenCreateForm}
                                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                                >
                                    <PlusCircle size={18} />
                                    Создать объект
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {projects.map(project => (
                                <div
                                    key={project.id}
                                    className="group flex flex-col rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:border-blue-200 hover:shadow-lg"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <h4 className="text-base font-semibold text-slate-900 group-hover:text-blue-700">
                                                {project.name}
                                            </h4>
                                            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                                                <MapPin size={14} className="text-slate-400" />
                                                {project.address || 'Адрес не указан'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex items-center justify-between">
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
                                        
                                        <button 
                                            onClick={() => navigate(`/projects/${project.id}`)}
                                            className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-100"
                                        >
                                            <span>Подробнее</span>
                                            <ArrowRight size={12} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            {showCreateForm && (
                <CreateProjectFormOSM 
                    onSubmit={handleCreateProject}
                    onCancel={() => setShowCreateForm(false)}
                    apiError={formError}
                />
            )}
        </>
    );
}

export { ObjectList };

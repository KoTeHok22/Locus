import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, HardHat, AlertTriangle, Clock3, ArrowRight, MapPin, ClipboardCheck, ClipboardList } from 'lucide-react';
import ApiService from '../../apiService';
import { YandexMap } from '../Map/YandexMap';
import { translate } from '../../utils/translation.js';
import '../../index.css';

const StatCard = ({ title, value, icon, accentClass, hint }) => (
    <div className="relative overflow-hidden rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:shadow-md sm:rounded-2xl sm:p-5">
        <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-500 sm:text-sm">{title}</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900 sm:mt-2 sm:text-3xl">{value}</p>
                {hint && <p className="mt-1 hidden text-xs text-slate-400 sm:block sm:mt-2">{hint}</p>}
            </div>
            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg sm:h-12 sm:w-12 sm:rounded-xl ${accentClass}`}>
                {React.cloneElement(icon, { size: 18, className: 'sm:hidden' })}
                {React.cloneElement(icon, { size: 22, className: 'hidden sm:block' })}
            </div>
        </div>
    </div>
);

const getProjectStatus = (project) => {
    const issues = project.issues_count || 0;
    if (project.status === 'completed') {
        return {
            label: 'Завершен',
            badgeClass: 'bg-emerald-50 text-emerald-600 border-emerald-100',
            dotClass: 'bg-emerald-500'
        };
    }
    if (issues === 0) {
        return {
            label: translate(project.status) || 'В работе',
            badgeClass: 'bg-blue-50 text-blue-600 border-blue-100',
            dotClass: 'bg-blue-500'
        };
    }
    if (issues > 3) {
        return {
            label: 'Критический',
            badgeClass: 'bg-red-50 text-red-600 border-red-100',
            dotClass: 'bg-red-500'
        };
    }
    return {
        label: 'Под контролем',
        badgeClass: 'bg-amber-50 text-amber-600 border-amber-100',
        dotClass: 'bg-amber-500'
    };
};

const ProjectCard = ({ project }) => {
    const navigate = useNavigate();
    const status = useMemo(() => getProjectStatus(project), [project]);

    return (
        <div className="group rounded-xl border border-slate-100 bg-white p-3 shadow-sm transition-all hover:border-blue-200 hover:shadow-md sm:rounded-2xl sm:p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-slate-900 group-hover:text-blue-700 sm:text-base">
                        {project.name}
                    </h4>
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                        <MapPin size={12} className="flex-shrink-0 text-slate-400" />
                        <span className="truncate">{project.address || 'Адрес не указан'}</span>
                    </p>
                </div>
                <span className={`inline-flex flex-shrink-0 items-center gap-1 self-start rounded-full border px-2 py-1 text-[11px] font-semibold sm:gap-1.5 sm:px-2.5 sm:py-1 sm:text-[11px] ${status.badgeClass}`}>
                    <span className={`h-1.5 w-1.5 rounded-full sm:h-2 sm:w-2 ${status.dotClass}`} />
                    <span className="whitespace-nowrap">{status.label}</span>
                </span>
            </div>

            <div className="mt-3 flex flex-col gap-2 text-xs sm:flex-row sm:gap-3">
                <div className="flex-1 rounded-lg bg-slate-50 px-3 py-2 sm:rounded-xl">
                    <div className="flex items-center gap-2 text-slate-500">
                        <ClipboardList size={14} />
                        <span className="text-xs">Задачи</span>
                    </div>
                    <p className="mt-1 text-lg font-semibold text-slate-900">{project.tasks_count ?? 0}</p>
                </div>
                <div className="flex-1 rounded-lg bg-slate-50 px-3 py-2 sm:rounded-xl">
                    <div className="flex items-center gap-2 text-slate-500">
                        <AlertTriangle size={14} className={project.issues_count ? 'text-red-500' : ''} />
                        <span className="text-xs">Нарушения</span>
                    </div>
                    <p className={`mt-1 text-lg font-semibold ${project.issues_count ? 'text-red-600' : 'text-slate-900'}`}>
                        {project.issues_count ?? 0}
                    </p>
                </div>
            </div>

            <button
                onClick={() => navigate(`/projects/${project.id}`)}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 sm:rounded-xl sm:px-3 sm:py-2 sm:text-sm"
            >
                <span>Подробнее</span>
                <ArrowRight size={14} className="sm:size-4" />
            </button>
        </div>
    );
};

function ManagerDHB() {
    const [projects, setProjects] = useState([]);
    const [mapData, setMapData] = useState(null);
    const [stats, setStats] = useState({ total: 0, active: 0, issues: 0 });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const fetchedProjects = await ApiService.getProjects(); 
                setProjects(fetchedProjects);

                const total = fetchedProjects.length;
                const active = fetchedProjects.filter(p => p.status === 'active').length;
                const issues = fetchedProjects.reduce((acc, p) => acc + (p.issues_count || 0), 0);
                setStats({ total, active, issues });

                const geoJsonFeatures = fetchedProjects.map(p => ({
                    type: 'Feature',
                    geometry: p.polygon?.geometry,
                    properties: {
                        id: p.id,
                        name: p.name,
                        risk_level: 'low' 
                    }
                })).filter(f => f.geometry);

                setMapData({
                    type: 'FeatureCollection',
                    features: geoJsonFeatures
                });

            } catch (err) {
                setError(err.message);
                console.error("Ошибка при загрузке данных для дэшборда:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

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

    return (
        <div className="flex h-full flex-col gap-4 bg-slate-50 sm:gap-6" id="manager-dashboard">
            <section className="grid grid-cols-1 gap-3 px-4 pt-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4 lg:px-0">
                <StatCard
                    title="Всего"
                    value={stats.total}
                    icon={<TrendingUp className="text-blue-600" />}
                    accentClass="bg-blue-100 text-blue-600"
                    hint="Общее количество активных направлений"
                />
                <StatCard
                    title="Активных"
                    value={stats.active}
                    icon={<HardHat className="text-emerald-600" />}
                    accentClass="bg-emerald-100 text-emerald-600"
                    hint="Объекты в активной фазе работ"
                />
                <StatCard
                    title="Нарушений"
                    value={stats.issues}
                    icon={<AlertTriangle className="text-red-600" />}
                    accentClass="bg-red-100 text-red-600"
                    hint="Требуют немедленного внимания"
                />
                <StatCard
                    title="Задач"
                    value={projects.reduce((acc, p) => acc + (p.tasks_count || 0), 0)}
                    icon={<Clock3 className="text-amber-600" />}
                    accentClass="bg-amber-100 text-amber-600"
                    hint="Совокупно по всем объектам"
                />
            </section>

            <div className="flex-1 min-h-0 overflow-hidden px-4 lg:px-0">
                <div className="grid h-full gap-4 pb-4 sm:gap-6 sm:pb-6 lg:grid-cols-3">
                    <div className="hidden lg:flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm sm:rounded-3xl lg:col-span-2">
                        <div className="flex flex-col gap-1 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
                            <div>
                                <h3 className="text-base font-semibold text-slate-900 sm:text-lg">Карта объектов</h3>
                                <p className="text-xs text-slate-500 sm:text-sm">Статусы строек по регионам</p>
                            </div>
                            <span className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600 sm:mt-0 sm:gap-2 sm:px-3">
                                <ClipboardCheck size={12} className="sm:hidden" />
                                <ClipboardCheck size={14} className="hidden sm:block" />
                                {projects.length} объектов
                            </span>
                        </div>
                        <div className="relative flex-1 overflow-hidden bg-slate-100 min-h-[300px] sm:min-h-[400px]">
                            {mapData ? (
                                <YandexMap mapData={mapData} projects={projects} />
                            ) : (
                                <div className="flex h-full items-center justify-center text-xs text-slate-500 sm:text-sm">
                                    Нет данных карты
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-1 min-h-[300px] flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm sm:rounded-3xl lg:min-h-0 lg:col-span-1">
                        <div className="border-b border-slate-200 px-4 py-3 sm:px-6 sm:py-4">
                            <h3 className="text-base font-semibold text-slate-900 sm:text-lg">Все объекты</h3>
                            <p className="text-xs text-slate-500 sm:text-sm">Приоритет по нарушениям</p>
                        </div>
                        <div className="flex-1 min-h-0 space-y-3 overflow-y-auto px-4 py-4 sm:space-y-4 sm:px-6 sm:py-5">
                            {projects.length > 0 ? (
                                projects.map(project => <ProjectCard key={project.id} project={project} />)
                            ) : (
                                <div className="flex h-full items-center justify-center rounded-xl bg-slate-50 p-4 text-center text-xs text-slate-500 sm:rounded-2xl sm:p-6 sm:text-sm">
                                    Проекты не найдены
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export { ManagerDHB };

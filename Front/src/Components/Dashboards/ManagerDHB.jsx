import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, HardHat, AlertTriangle, Clock3, ArrowRight, MapPin, ClipboardCheck, ClipboardList } from 'lucide-react';
import ApiService from '../../apiService';
import { YandexMap } from '../Map/YandexMap';
import { translate } from '../../utils/translation.js';
import '../../index.css';

const StatCard = ({ title, value, icon, accentClass, hint }) => (
    <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-lg">
        <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
                <p className="text-sm font-medium text-slate-500">{title}</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
                {hint && <p className="mt-2 text-xs text-slate-400">{hint}</p>}
            </div>
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${accentClass}`}>
                {icon}
            </div>
        </div>
        <div className="pointer-events-none absolute right-5 top-5 h-14 w-14 rounded-full bg-gradient-to-br from-blue-100/60 to-transparent" />
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
        <div className="group rounded-2xl border border-slate-100 bg-white p-4 transition-all hover:border-blue-200 hover:shadow-lg">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h4 className="text-base font-semibold text-slate-900 group-hover:text-blue-700">
                        {project.name}
                    </h4>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                        <MapPin size={14} className="text-slate-400" />
                        <span className="truncate">{project.address || 'Адрес не указан'}</span>
                    </p>
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${status.badgeClass}`}>
                    <span className={`h-2 w-2 rounded-full ${status.dotClass}`} />
                    {status.label}
                </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <div className="flex items-center gap-2 text-slate-500">
                        <ClipboardList size={14} />
                        <span>Задачи</span>
                    </div>
                    <p className="mt-1 text-lg font-semibold text-slate-900">{project.tasks_count ?? 0}</p>
                </div>
                <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <div className="flex items-center gap-2 text-slate-500">
                        <AlertTriangle size={14} className={project.issues_count ? 'text-red-500' : ''} />
                        <span>Нарушения</span>
                    </div>
                    <p className={`mt-1 text-lg font-semibold ${project.issues_count ? 'text-red-600' : 'text-slate-900'}`}>
                        {project.issues_count ?? 0}
                    </p>
                </div>
            </div>

            <button
                onClick={() => navigate(`/projects/${project.id}`)}
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
                Подробнее
                <ArrowRight size={16} />
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
        return <div className="flex items-center justify-center h-full">Загрузка...</div>;
    }

    if (error) {
        return <div className="flex items-center justify-center h-full text-red-500">Ошибка: {error}</div>;
    }

    return (
        <div className="flex h-full flex-col gap-6 bg-slate-50" id="manager-dashboard">
            <section className="grid gap-3 px-4 pt-2 sm:grid-cols-2 xl:grid-cols-4 xl:px-0">
                <StatCard
                    title="Всего проектов"
                    value={stats.total}
                    icon={<TrendingUp size={22} className="text-blue-600" />}
                    accentClass="bg-blue-100 text-blue-600"
                    hint="Общее количество активных направлений"
                />
                <StatCard
                    title="Активных проектов"
                    value={stats.active}
                    icon={<HardHat size={22} className="text-emerald-600" />}
                    accentClass="bg-emerald-100 text-emerald-600"
                    hint="Объекты в активной фазе работ"
                />
                <StatCard
                    title="Открытых нарушений"
                    value={stats.issues}
                    icon={<AlertTriangle size={22} className="text-red-600" />}
                    accentClass="bg-red-100 text-red-600"
                    hint="Требуют немедленного внимания"
                />
                <StatCard
                    title="Задач в работе"
                    value={projects.reduce((acc, p) => acc + (p.tasks_count || 0), 0)}
                    icon={<Clock3 size={22} className="text-amber-600" />}
                    accentClass="bg-amber-100 text-amber-600"
                    hint="Совокупно по всем объектам"
                />
            </section>

            <div className="flex-1 px-0 xl:px-0">
                <div className="grid h-full gap-6 px-4 pb-6 lg:grid-cols-3 lg:px-0">
                    <div className="lg:col-span-2">
                        <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
                            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900">Карта объектов</h3>
                                    <p className="text-sm text-slate-500">Статусы строек и риски по регионам</p>
                                </div>
                                <span className="hidden items-center gap-2 rounded-lg bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 md:inline-flex">
                                    <ClipboardCheck size={14} />
                                    {projects.length} объектов
                                </span>
                            </div>
                            <div className="relative flex-1 overflow-hidden bg-slate-100">
                                {mapData ? (
                                    <YandexMap mapData={mapData} projects={projects} />
                                ) : (
                                    <div className="flex h-full items-center justify-center text-sm text-slate-500">
                                        Нет данных карты
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex h-full flex-col rounded-3xl border border-slate-100 bg-white shadow-sm">
                        <div className="border-b border-slate-200 px-6 py-4">
                            <h3 className="text-lg font-semibold text-slate-900">Все объекты</h3>
                            <p className="text-sm text-slate-500">Приоритет по количеству нарушений</p>
                        </div>
                        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
                            {projects.length > 0 ? (
                                projects.map(project => <ProjectCard key={project.id} project={project} />)
                            ) : (
                                <div className="flex h-full items-center justify-center rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">
                                    Проекты не найдены.
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
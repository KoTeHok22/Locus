import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import ApiService from '../apiService';
import { translate } from '../utils/translation';
import ActivateProjectModal from '../Components/Projects/ActivateProjectModal';
import AuthService from '../authService';

const CreateProjectModal = ({ onCancel, onUpdate }) => {
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`https://geocode-maps.yandex.ru/1.x/?apikey=${import.meta.env.VITE_YANDEX_MAPS_API_KEY}&format=json&geocode=${address}`);
            const data = await response.json();
            if (data.response.GeoObjectCollection.featureMember.length === 0) {
                throw new Error('Адрес не найден. Проверьте правильность ввода.');
            }
            const geoObject = data.response.GeoObjectCollection.featureMember[0].GeoObject;
            const [lon, lat] = geoObject.Point.pos.split(' ').map(Number);
            const offset = 0.001;
            const polygonCoordinates = [[ [lon - offset, lat - offset], [lon + offset, lat - offset], [lon + offset, lat + offset], [lon - offset, lat + offset], [lon - offset, lat - offset] ]];
            
            const projectData = {
                name,
                address,
                polygon: { type: 'Feature', geometry: { type: 'Polygon', coordinates: polygonCoordinates } }
            };

            await ApiService.createProject(projectData);
            toast.success('Проект успешно создан!');
            onUpdate();
            onCancel();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
            <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 shadow-xl">
                <h2 className="text-2xl font-semibold text-slate-900">Создать новый проект</h2>
                <p className="mt-1 text-sm text-slate-500">Введите основные данные для нового объекта</p>
                {error && (
                    <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                        {error}
                    </div>
                )}
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700">Название объекта*</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700">Адрес*</label>
                        <input
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                            placeholder="Город, улица, дом"
                            required
                        />
                    </div>
                    <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition-colors hover:border-slate-300"
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                            {loading ? 'Создание...' : 'Создать'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ProjectCard = ({ project, userRole, onNavigate, onActivate }) => {
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
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button
                    onClick={() => onNavigate(project.id)}
                    className="flex-1 rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                >
                    Подробнее
                </button>
                {userRole === 'client' && project.status === 'pending' && (
                    <button
                        onClick={() => onActivate(project)}
                        className="flex-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 sm:flex-initial"
                    >
                        Активировать
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
    const userRole = AuthService.getUserRole();

    const fetchProjects = useCallback(async () => {
        setLoading(true);
        try {
            const data = await ApiService.getProjects();
            setProjects(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const handleActivationSuccess = () => {
        fetchProjects();
        setActivatingProject(null);
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

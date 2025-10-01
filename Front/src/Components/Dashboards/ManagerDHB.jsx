import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../../apiService';
import { YandexMap } from '../Map/YandexMap';
import '../../index.css';

const StatCard = ({ title, value, icon, colorClass }) => (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
        <div className="flex items-start justify-between">
            <div className="flex-1">
                <p className="font-medium text-gray-700 mb-1 text-sm">{title}</p>
                <p className={`font-bold text-3xl mb-2 ${colorClass || 'text-gray-700'}`}>{value}</p>
            </div>
            <div className={`rounded-lg p-3 ${colorClass ? colorClass.replace('text', 'bg').replace('-600', '-100') : 'bg-gray-100'}`}>
                <i className={`fas ${icon} text-xl ${colorClass || 'text-gray-600'}`}></i>
            </div>
        </div>
    </div>
);

const ProjectCard = ({ project }) => {
    const navigate = useNavigate();

    return (
        <div className="border rounded-lg p-4 transition-all hover:shadow-md bg-white border-slate-200">
            <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 text-sm truncate mb-1">{project.name}</h4>
                <p className="text-xs text-gray-500 mb-3 truncate">{project.address}</p>
                
                <div className="flex items-center gap-4 text-xs text-gray-600">
                    <div><i className="fas fa-tasks mr-1"></i>{project.tasks_count || 0} задач</div>
                    <div><i className="fas fa-exclamation-triangle mr-1 text-red-500"></i>{project.issues_count || 0} нарушений</div>
                </div>
            </div>
            <div className="flex justify-end mt-3">
                <button onClick={() => navigate(`/projects/${project.id}`)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 px-2 text-xs flex items-center rounded">
                    <span>Подробнее</span>
                    <i className="fas fa-chevron-right ml-1 text-xs"></i>
                </button>
            </div>
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
        <div className="flex flex-col h-full bg-slate-50" id="manager-dashboard">
            <div className="flex-shrink-0 p-6 pb-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <StatCard title="Всего проектов" value={stats.total} icon="fa-building" />
                    <StatCard title="Активных проектов" value={stats.active} icon="fa-check-circle" colorClass="text-green-600" />
                    <StatCard title="Открытых нарушений" value={stats.issues} icon="fa-exclamation-triangle" colorClass="text-red-600" />
                    <StatCard title="Задач в работе" value="-" icon="fa-clock" colorClass="text-amber-600" />
                </div>
            </div>

            <div className="flex-1 p-6 pt-0 min-h-0">
                <div className="grid grid-cols-3 gap-6 h-full">
                    <div className="col-span-2 min-h-0">
                        <div className="bg-white rounded-lg border border-slate-200 shadow-sm h-full flex flex-col">
                            <div className="border-b border-slate-200 px-4 py-3 flex-shrink-0">
                                <h3 className="font-semibold text-gray-900">Карта объектов</h3>
                            </div>
                            <div className="relative flex-1 bg-slate-100 min-h-0">
                                {mapData && <YandexMap mapData={mapData} projects={projects} />}
                            </div>
                        </div>
                    </div>

                    <div className="col-span-1 min-h-0">
                        <div className="bg-white rounded-lg border border-slate-200 shadow-sm h-full flex flex-col">
                            <div className="border-b border-slate-200 px-4 py-3">
                                <h3 className="font-semibold text-gray-900">Все объекты</h3>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {projects.length > 0 ? (
                                    projects.map(project => <ProjectCard key={project.id} project={project} />)
                                ) : (
                                    <p className="text-center text-gray-500 pt-10">Проекты не найдены.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export { ManagerDHB };
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-xl font-bold mb-6">Создать новый проект</h2>
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Название объекта*</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full p-2 border rounded-md" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Адрес*</label>
                        <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1 w-full p-2 border rounded-md" placeholder="Город, улица, дом" required />
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onCancel} className="bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium">Отмена</button>
                        <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:bg-gray-400">
                            {loading ? 'Создание...' : 'Создать'}
                        </button>
                    </div>
                </form>
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
        return <div className="text-red-500 p-6">Ошибка при загрузке проектов: {error}</div>;
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
            
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
                <div className="border-b border-slate-200 p-4 flex items-center justify-between">
                    <h1 className="text-xl font-bold text-gray-900">Проекты</h1>
                    {userRole === 'client' && (
                        <button onClick={() => setShowCreateModal(true)} className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2">
                            <i className="fas fa-plus"></i>
                            <span>Создать проект</span>
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="p-6 text-center">Загрузка...</div>
                ) : (
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Название</th>
                                <th scope="col" className="px-6 py-3">Адрес</th>
                                <th scope="col" className="px-6 py-3">Статус</th>
                                <th scope="col" className="px-6 py-3">Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {projects.map(project => (
                                <tr key={project.id} className="bg-white border-b hover:bg-gray-50">
                                    <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                        {project.name}
                                    </th>
                                    <td className="px-6 py-4">{project.address}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                            project.status === 'active' ? 'bg-green-100 text-green-800' : 
                                            project.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {translate(project.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 space-x-4">
                                        <button onClick={() => navigate(`/projects/${project.id}`)} className="font-medium text-blue-600 hover:underline">Детали</button>
                                        {userRole === 'client' && project.status === 'pending' && (
                                            <button onClick={() => setActivatingProject(project)} className="font-medium text-green-600 hover:underline">Активировать</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </>
    );
};

export { ProjectsPage };
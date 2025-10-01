import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../../apiService';
import AuthService from '../../authService';
import '../../index.css';
import CreateProjectForm from './CreateProjectForm';

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
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col m-6 h-[calc(100%-3rem)] w-[calc(100%-3rem)]">
                <div className="border-b border-slate-200 px-4 py-3">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Все объекты</h3>
                        {(userRole !== 'inspector' && userRole !== 'foreman') && (
                            <button 
                                onClick={handleOpenCreateForm}
                                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded text-sm"
                            >
                                Создать объект
                            </button>
                        )}
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="flex justify-center items-center h-full">
                            <p className="text-gray-500">Загрузка...</p>
                        </div>
                    ) : projects.length === 0 ? (
                        <div className="text-center h-full flex flex-col justify-center items-center">
                            <p className="text-gray-500 mb-4">Объектов пока нет.</p>
                            {(userRole !== 'inspector' && userRole !== 'foreman') && (
                                <button 
                                    onClick={handleOpenCreateForm}
                                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                                >
                                    Создать объект
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {projects.map(project => (
                                <div key={project.id} className={`border rounded-lg p-3 sm:p-4 transition-all hover:shadow-md border-slate-200 bg-white`}>
                                    <div className="flex items-start justify-between mb-3 flex-col sm:flex-row gap-2 sm:gap-0">
                                        <div className="flex-1 min-w-0 w-full sm:w-auto">
                                            <div className="flex items-start justify-between sm:justify-start gap-2 mb-1">
                                                <h4 className="font-semibold text-gray-900 text-sm leading-tight flex-1">
                                                    {project.name}
                                                </h4>
                                            </div>
                                            <p className="text-xs text-gray-500 mb-3">{project.address}</p>
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <button 
                                            onClick={() => navigate(`/projects/${project.id}`)}
                                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 px-2 text-xs flex items-center">
                                            <span>Подробнее</span>
                                            <i className="fas fa-chevron-right ml-1 text-xs"></i>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            {showCreateForm && (
                <CreateProjectForm 
                    onSubmit={handleCreateProject}
                    onCancel={() => setShowCreateForm(false)}
                    apiError={formError}
                />
            )}
        </>
    );
}

export { ObjectList };

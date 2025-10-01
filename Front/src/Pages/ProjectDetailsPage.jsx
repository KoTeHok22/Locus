import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ApiService from '../apiService';
import { YandexMap } from '../Components/Map/YandexMap';

function ProjectDetailsPage() {
    const { projectId } = useParams();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProject = async () => {
            try {
                setLoading(true);
                const data = await ApiService.getProjectDetails(projectId);
                setProject(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProject();
    }, [projectId]);

    if (loading) {
        return <div className="p-8">Загрузка данных о проекте...</div>;
    }

    if (error) {
        return <div className="p-8 text-red-500">Ошибка: {error}</div>;
    }

    if (!project) {
        return <div className="p-8">Проект не найден.</div>;
    }

    return (
        <div className="p-4 sm:p-6 md:p-8 h-full flex flex-col gap-6">
            <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                <p className="text-sm text-gray-500 mt-1">{project.address}</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
                
                <div className="lg:col-span-2 border rounded-lg shadow-sm min-h-[300px] lg:min-h-0">
                    <YandexMap projects={[project]} />
                </div>

                
                <div className="border rounded-lg shadow-sm p-4 flex flex-col">
                    <h2 className="text-lg font-semibold mb-4 border-b pb-2">Детали проекта</h2>
                    <div className="space-y-3">
                        <div>
                            <span className="font-medium text-gray-700">Статус: </span>
                            <span className="capitalize px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">{project.status}</span>
                        </div>
                        <div>
                            <span className="font-medium text-gray-700">Дата создания: </span>
                            <span>{new Date(project.created_at).toLocaleDateString()}</span>
                        </div>
                        
                    </div>
                </div>
            </div>
        </div>
    );
}

export { ProjectDetailsPage };
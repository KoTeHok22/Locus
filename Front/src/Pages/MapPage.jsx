import React, { useState, useEffect, useCallback } from 'react';
import ApiService from "../apiService";
import YandexMap from '../Components/Map/YandexMap';

const MapPage = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchProjects = useCallback(async () => {
        setLoading(true);
        try {
            const data = await ApiService.getProjects();
            console.log('Проекты, полученные от API:', data);
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

    return (
        <div className="h-full flex flex-col">
            <div className="p-6 pb-4 bg-white border-b border-slate-200 rounded-t-lg">
                <h1 className="text-xl font-bold text-gray-900">Карта объектов</h1>
                <p className="text-sm text-gray-500">Глобальный обзор всех проектов и их статусов</p>
            </div>

            <div className="flex-1 bg-slate-100 relative">
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
                        Загрузка карты...
                    </div>
                )}
                {error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-red-50 text-red-600 z-10">
                        Ошибка при загрузке данных: {error}
                    </div>
                )}
                {!loading && !error && (
                    <YandexMap projects={projects} />
                )}
            </div>
        </div>
    );
};

export default MapPage;
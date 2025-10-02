import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, Layers } from 'lucide-react';
import ApiService from "../apiService";
import { OSMMap } from '../Components/Map/OSMMap';

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
        <div className="flex h-full flex-col gap-6">
            <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">Карта объектов</h1>
                        <p className="mt-1 text-sm text-slate-500">Глобальный обзор всех проектов и их статусов</p>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2">
                        <MapPin size={16} className="text-blue-600" />
                        <span className="text-sm font-semibold text-blue-600">{projects.length} объектов</span>
                    </div>
                </div>
            </div>

            <div className="relative flex-1 overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
                {loading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                        <div className="text-center">
                            <Layers className="mx-auto h-8 w-8 animate-pulse text-blue-600" />
                            <p className="mt-2 text-sm text-slate-500">Загрузка карты...</p>
                        </div>
                    </div>
                )}
                {error && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-red-50/90">
                        <div className="text-center">
                            <p className="text-sm font-semibold text-red-600">Ошибка при загрузке данных</p>
                            <p className="mt-1 text-xs text-red-500">{error}</p>
                        </div>
                    </div>
                )}
                {!loading && !error && (
                    <div className="h-full w-full bg-slate-100">
                        <OSMMap projects={projects} />
                    </div>
                )}
            </div>
        </div>
    );
};

export { MapPage };

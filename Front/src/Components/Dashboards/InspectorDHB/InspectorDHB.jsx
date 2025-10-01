import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import ApiService from '../../../apiService';
import '../../../index.css';
import CreateIssueModal from '../../Issues/CreateIssueModal';

const InspectorDHB = () => {
    const [data, setData] = useState({ projects: [], issues: [], classifiers: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [projects, issues, classifiers] = await Promise.all([
                ApiService.getProjects(),
                ApiService.getIssues({ status: 'open' }),
                ApiService.getClassifiers({ type: 'violation' })
            ]);
            setData({ projects, issues, classifiers });
        } catch (err) {
            setError(err.message);
            console.error("Ошибка при загрузке данных для инспектора:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) {
        return <div className="flex items-center justify-center h-full">Загрузка данных инспектора...</div>;
    }

    if (error) {
        return <div className="flex items-center justify-center h-full text-red-500">Ошибка: {error}</div>;
    }

    return (
        <div className="p-6 h-full bg-slate-50" id="inspector-dashboard">
            {isModalOpen && 
                <CreateIssueModal 
                    projects={data.projects} 
                    classifiers={data.classifiers}
                    onClose={() => setIsModalOpen(false)} 
                    onUpdate={fetchData} 
                    issueType='violation'
                />
            }
            <div className="grid grid-cols-2 gap-6 h-full">
                <div className="col-span-1 flex flex-col gap-6 min-h-0">
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Действия инспектора</h2>
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className="w-full bg-red-600 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2">
                            <i className="fas fa-plus-circle"></i>
                            Зафиксировать нарушение
                        </button>
                    </div>
                </div>
                <div className="col-span-1 bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col">
                    <div className="border-b border-slate-200 p-4">
                        <h2 className="text-lg font-semibold text-gray-900">Открытые нарушения ({data.issues.length})</h2>
                    </div>
                    <div className="p-4 overflow-y-auto space-y-4">
                        {data.issues.length > 0 ? (
                            data.issues.map(issue => (
                                <div key={issue.id} className="border-b pb-2">
                                    <p className="font-semibold text-sm">{issue.description}</p>
                                    <p className="text-xs text-gray-500">Проект: {issue.project_name}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-gray-500 pt-10">Нет открытых нарушений.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export { InspectorDHB };
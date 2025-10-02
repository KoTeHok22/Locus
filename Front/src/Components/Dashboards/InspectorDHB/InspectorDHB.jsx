import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, MapPin, PlusCircle, ClipboardList, ShieldAlert } from 'lucide-react';
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
        <div className="flex h-full flex-col gap-6 bg-slate-50" id="inspector-dashboard">
            {isModalOpen && (
                <CreateIssueModal
                    projects={data.projects}
                    classifiers={data.classifiers}
                    onClose={() => setIsModalOpen(false)}
                    onUpdate={fetchData}
                    issueType='violation'
                />
            )}

            <div className="grid flex-1 gap-6 px-4 pb-6 lg:grid-cols-[1fr_1.3fr] lg:px-0">
                <section className="flex flex-col gap-4">
                    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-2 text-red-500">
                            <ShieldAlert size={18} />
                            <span className="text-sm font-semibold">Действия инспектора</span>
                        </div>
                        <h2 className="mt-2 text-xl font-semibold text-slate-900">Фиксация и контроль нарушений</h2>
                        <p className="mt-1 text-sm text-slate-500">Создайте новый акт, приложите доказательства и передайте ответственным.</p>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700"
                        >
                            <PlusCircle size={18} />
                            Зафиксировать нарушение
                        </button>
                    </div>

                    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-2 text-blue-500">
                            <ClipboardList size={18} />
                            <span className="text-sm font-semibold">Статистика</span>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                            <div className="rounded-2xl bg-blue-50 px-4 py-3">
                                <p className="text-xs text-blue-700">Открыто</p>
                                <p className="mt-1 text-2xl font-semibold text-blue-900">{data.issues.length}</p>
                            </div>
                            <div className="rounded-2xl bg-slate-100 px-4 py-3">
                                <p className="text-xs text-slate-600">Проектов</p>
                                <p className="mt-1 text-2xl font-semibold text-slate-900">{data.projects.length}</p>
                            </div>
                        </div>
                        <p className="mt-4 text-xs text-slate-500">
                            {data.classifiers.length} классификаторов доступны для маркировки нарушений
                        </p>
                    </div>
                </section>

                <section className="flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900">Открытые нарушения</h2>
                            <p className="text-sm text-slate-500">{data.issues.length} элементов требуют проверки</p>
                        </div>
                        <span className="inline-flex h-9 items-center justify-center rounded-full bg-red-50 px-4 text-xs font-semibold text-red-600">
                            Срочный контроль
                        </span>
                    </div>
                    <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
                        {data.issues.length > 0 ? (
                            data.issues.map(issue => (
                                <div
                                    key={issue.id}
                                    className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:border-blue-200 hover:shadow-lg"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="flex items-center gap-2 text-red-500">
                                                <AlertTriangle size={16} />
                                                <span className="text-xs font-semibold uppercase">Нарушение #{issue.id}</span>
                                            </div>
                                            <p className="mt-2 text-sm font-medium text-slate-900">{issue.description}</p>
                                            {issue.project_name && (
                                                <p className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                                                    <MapPin size={14} className="text-slate-400" />
                                                    {issue.project_name}
                                                </p>
                                            )}
                                        </div>
                                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
                                            <ShieldAlert size={18} />
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex h-full flex-col items-center justify-center rounded-2xl bg-slate-50 py-10 text-center text-sm text-slate-500">
                                Нарушений не обнаружено.
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};

export { InspectorDHB };
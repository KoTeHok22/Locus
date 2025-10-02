import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, MapPin, PlusCircle, ClipboardList, ShieldAlert } from 'lucide-react';
import ApiService from '../../../apiService';
import '../../../index.css';
import CreateIssueModal from '../../Issues/CreateIssueModal';
import VerifyResolutionModal from '../../Issues/VerifyResolutionModal';
import { translate } from '../../../utils/translation.js';

const InspectorDHB = () => {
    const [data, setData] = useState({ projects: [], issues: [], classifiers: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [verifyingIssue, setVerifyingIssue] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [projects, issues, classifiers] = await Promise.all([
                ApiService.getProjects(),
                ApiService.getIssues(),
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
        return (
            <div className="flex h-full items-center justify-center">
                <p className="text-sm text-slate-500">Загрузка...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-full items-center justify-center rounded-2xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-500">Ошибка: {error}</p>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col gap-4 bg-slate-50 sm:gap-6" id="inspector-dashboard">
            {isModalOpen && (
                <CreateIssueModal
                    projects={data.projects}
                    classifiers={data.classifiers}
                    onClose={() => setIsModalOpen(false)}
                    onUpdate={fetchData}
                    issueType='violation'
                />
            )}

            <div className="grid flex-1 gap-4 px-4 pb-4 sm:gap-6 sm:pb-6 md:grid-cols-2 lg:grid-cols-[1fr_1.5fr] lg:px-0">
                <section className="flex flex-col gap-3 sm:gap-4">
                    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
                        <div className="flex items-center gap-1.5 text-red-500 sm:gap-2">
                            <ShieldAlert size={16} className="sm:hidden" />
                            <ShieldAlert size={18} className="hidden sm:block" />
                            <span className="text-xs font-semibold sm:text-sm">Действия инспектора</span>
                        </div>
                        <h2 className="mt-2 text-lg font-semibold text-slate-900 sm:text-xl">Фиксация нарушений</h2>
                        <p className="mt-1 text-xs text-slate-500 sm:text-sm">Создайте новый акт и приложите доказательства</p>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-red-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-red-700 sm:mt-5 sm:rounded-xl sm:px-4 sm:py-3 sm:text-sm"
                        >
                            <PlusCircle size={16} className="sm:hidden" />
                            <PlusCircle size={18} className="hidden sm:block" />
                            Зафиксировать нарушение
                        </button>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
                        <div className="flex items-center gap-1.5 text-blue-500 sm:gap-2">
                            <ClipboardList size={16} className="sm:hidden" />
                            <ClipboardList size={18} className="hidden sm:block" />
                            <span className="text-xs font-semibold sm:text-sm">Статистика</span>
                        </div>
                        <div className="mt-3 flex flex-col gap-2 text-sm sm:mt-4 sm:flex-row sm:gap-3">
                            <div className="flex-1 rounded-xl bg-blue-50 px-4 py-3 sm:rounded-2xl">
                                <p className="text-xs text-blue-700">Открыто</p>
                                <p className="mt-1 text-2xl font-semibold text-blue-900">{data.issues.length}</p>
                            </div>
                            <div className="flex-1 rounded-xl bg-slate-100 px-4 py-3 sm:rounded-2xl">
                                <p className="text-xs text-slate-600">Проектов</p>
                                <p className="mt-1 text-2xl font-semibold text-slate-900">{data.projects.length}</p>
                            </div>
                        </div>
                        <p className="mt-3 text-xs text-slate-500 sm:mt-4">
                            {data.classifiers.length} классификаторов для маркировки нарушений
                        </p>
                    </div>
                </section>

                <section className="flex max-h-[500px] flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm sm:rounded-3xl md:max-h-full">
                    <div className="flex flex-col gap-1 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">Открытые нарушения</h2>
                            <p className="text-xs text-slate-500 sm:text-sm">{data.issues.length} требуют проверки</p>
                        </div>
                        <span className="mt-2 inline-flex h-7 w-fit items-center justify-center rounded-full bg-red-50 px-3 text-[10px] font-semibold text-red-600 sm:mt-0 sm:h-9 sm:px-4 sm:text-xs">
                            Срочный контроль
                        </span>
                    </div>
                    <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:space-y-4 sm:px-6 sm:py-5">
                        {data.issues.length > 0 ? (
                            data.issues.map(issue => {
                                const statusColors = {
                                    'open': 'border-red-100 bg-white',
                                    'pending_verification': 'border-amber-100 bg-amber-50/30',
                                    'resolved': 'border-green-100 bg-green-50/30'
                                };
                                const statusBadges = {
                                    'open': 'bg-red-100 text-red-700 border-red-200',
                                    'pending_verification': 'bg-amber-100 text-amber-700 border-amber-200',
                                    'resolved': 'bg-green-100 text-green-700 border-green-200'
                                };
                                return (
                                    <div
                                        key={issue.id}
                                        className={`rounded-xl border p-3 shadow-sm transition-all hover:shadow-md sm:rounded-2xl sm:p-4 ${statusColors[issue.status] || statusColors['open']}`}
                                    >
                                        <div className="flex items-start justify-between gap-2 sm:gap-3">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <div className="flex items-center gap-1.5 text-red-500 sm:gap-2">
                                                        <AlertTriangle size={14} className="sm:hidden" />
                                                        <AlertTriangle size={16} className="hidden sm:block" />
                                                        <span className="text-[10px] font-semibold uppercase sm:text-xs">Нарушение #{issue.id}</span>
                                                    </div>
                                                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusBadges[issue.status] || statusBadges['open']}`}>
                                                        {translate(issue.status)}
                                                    </span>
                                                </div>
                                                <p className="mt-1.5 text-xs font-medium text-slate-900 sm:mt-2 sm:text-sm">{issue.description}</p>
                                                {issue.project_name && (
                                                    <p className="mt-1.5 flex items-center gap-1.5 text-[10px] text-slate-500 sm:mt-2 sm:text-xs">
                                                        <MapPin size={12} className="flex-shrink-0 text-slate-400 sm:hidden" />
                                                        <MapPin size={14} className="hidden flex-shrink-0 text-slate-400 sm:block" />
                                                        {issue.project_name}
                                                    </p>
                                                )}
                                            </div>
                                            <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 sm:h-10 sm:w-10">
                                                <ShieldAlert size={14} className="sm:hidden" />
                                                <ShieldAlert size={18} className="hidden sm:block" />
                                            </span>
                                        </div>
                                        {issue.status === 'pending_verification' && (
                                            <button
                                                onClick={() => setVerifyingIssue(issue)}
                                                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 sm:mt-4 sm:rounded-xl sm:px-3 sm:py-2 sm:text-sm"
                                            >
                                                <ClipboardList size={12} className="sm:hidden" />
                                                <ClipboardList size={14} className="hidden sm:block" />
                                                Верифицировать
                                            </button>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="flex h-full flex-col items-center justify-center rounded-xl bg-slate-50 py-10 text-center text-xs text-slate-500 sm:rounded-2xl sm:text-sm">
                                Нарушений не обнаружено
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {verifyingIssue && (
                <VerifyResolutionModal
                    issue={verifyingIssue}
                    onClose={() => setVerifyingIssue(null)}
                    onUpdate={fetchData}
                />
            )}
        </div>
    );
};

export { InspectorDHB };

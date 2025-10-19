import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Calendar, Users, CloudRain, Truck, Trash2, Edit2, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import ApiService from '../apiService';
import AuthService from '../authService';
import CreateDailyReportModal from '../Components/Reports/CreateDailyReportModal';

const ReportCard = ({ report, canEdit, onEdit, onDelete }) => {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!window.confirm('Вы уверены, что хотите удалить этот отчёт?')) return;
        
        setIsDeleting(true);
        try {
            await ApiService.deleteDailyReport(report.id);
            toast.success('Отчёт успешно удалён');
            onDelete();
        } catch (error) {
            toast.error(error.message || 'Ошибка удаления отчёта');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="group rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:border-blue-200 hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <FileText size={18} className="text-blue-600" />
                        <h3 className="text-base font-semibold text-slate-900">{report.project_name || 'Проект не указан'}</h3>
                    </div>
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
                        <Calendar size={14} className="text-slate-400" />
                        {new Date(report.report_date).toLocaleString('ru-RU', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </p>
                </div>
                {canEdit && (
                    <div className="flex gap-2">
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                            title="Удалить"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                )}
            </div>
            
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="flex items-center gap-2 text-slate-500">
                        <Users size={16} />
                        <span className="text-xs font-semibold">Рабочих</span>
                    </div>
                    <p className="mt-1.5 text-lg font-semibold text-slate-900">{report.workers_count || 0}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="flex items-center gap-2 text-slate-500">
                        <CloudRain size={16} />
                        <span className="text-xs font-semibold">Погода</span>
                    </div>
                    <p className="mt-1.5 text-base font-semibold text-slate-900">{report.weather_conditions || '-'}</p>
                </div>
            </div>

            {report.equipment && (
                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="flex items-center gap-2 text-slate-500">
                        <Truck size={16} />
                        <span className="text-xs font-semibold">Техника</span>
                    </div>
                    <p className="mt-1.5 text-sm text-slate-700">{report.equipment}</p>
                </div>
            )}

            {report.notes && (
                <div className="mt-3 rounded-xl border border-slate-200 bg-blue-50/50 px-4 py-3">
                    <p className="text-xs font-semibold text-slate-500">Заметки</p>
                    <p className="mt-1.5 text-sm text-slate-700">{report.notes}</p>
                </div>
            )}

            {report.geolocation && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                    <MapPin size={12} />
                    <span>Геолокация: {report.geolocation}</span>
                </div>
            )}
            
            <div className="mt-4 border-t border-slate-200 pt-3 text-xs text-slate-400">
                Автор: {report.author_name || 'Неизвестен'}
            </div>
        </div>
    );
};

const ReportsPage = () => {
    const [reports, setReports] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [creatingReport, setCreatingReport] = useState(null);
    const [selectedProject, setSelectedProject] = useState('');
    const userRole = AuthService.getUserRole();

    const fetchReports = useCallback(async () => {
        setLoading(true);
        try {
            const [reportsData, projectsData] = await Promise.all([
                ApiService.getDailyReports(),
                ApiService.getProjects()
            ]);
            setReports(reportsData);
            setProjects(projectsData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const filteredReports = selectedProject 
        ? reports.filter(r => r.project_id === parseInt(selectedProject))
        : reports;

    const groupedReports = filteredReports.reduce((acc, report) => {
        const date = new Date(report.report_date).toLocaleDateString('ru-RU');
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(report);
        return acc;
    }, {});

    const canEdit = userRole === 'foreman';
    const activeProjects = projects.filter(p => p.status === 'active');

    return (
        <>
            <div className="flex h-full flex-col gap-6">
                <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1">
                            <h1 className="text-2xl font-semibold text-slate-900">Ежедневные отчёты</h1>
                            <p className="mt-1 text-sm text-slate-500">Отчёты о ходе работ на объектах</p>
                            
                            <div className="mt-4 max-w-md">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Фильтр по проекту
                                </label>
                                <select
                                    value={selectedProject}
                                    onChange={(e) => setSelectedProject(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                >
                                    <option value="">Все проекты</option>
                                    {projects.map(project => (
                                        <option key={project.id} value={project.id}>
                                            {project.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-3">
                            <FileText size={20} className="text-blue-600" />
                            <span className="text-sm font-semibold text-blue-600">{filteredReports.length} отчётов</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
                    {loading && (
                        <div className="flex h-full items-center justify-center rounded-2xl bg-slate-50 p-6">
                            <p className="text-slate-500">Загрузка отчётов...</p>
                        </div>
                    )}
                    {error && (
                        <div className="flex h-full items-center justify-center rounded-2xl border border-red-200 bg-red-50 p-6">
                            <div className="text-center">
                                <p className="text-sm font-semibold text-red-600">Ошибка</p>
                                <p className="mt-1 text-xs text-red-500">{error}</p>
                            </div>
                        </div>
                    )}
                    {!loading && !error && (
                        <div className="space-y-6">
                            {Object.keys(groupedReports).length > 0 ? (
                                Object.entries(groupedReports)
                                    .sort((a, b) => new Date(b[0]) - new Date(a[0]))
                                    .map(([date, reportGroup]) => (
                                        <div key={date}>
                                            <div className="mb-4 flex items-center gap-3">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-base font-semibold text-white">
                                                    {new Date(reportGroup[0].report_date).getDate()}
                                                </div>
                                                <div>
                                                    <h2 className="text-base font-semibold text-slate-900">{date}</h2>
                                                    <p className="text-xs text-slate-500">{reportGroup.length} отчётов</p>
                                                </div>
                                            </div>
                                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                                {reportGroup.map(report => (
                                                    <ReportCard 
                                                        key={report.id} 
                                                        report={report}
                                                        canEdit={canEdit}
                                                        onDelete={fetchReports}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ))
                            ) : (
                                <div className="flex h-full flex-col items-center justify-center rounded-2xl bg-slate-50 py-20 text-center">
                                    <FileText className="mb-3 h-16 w-16 text-slate-300" />
                                    <p className="text-base font-semibold text-slate-700">Нет отчётов</p>
                                    <p className="mt-1 text-sm text-slate-500">
                                        {selectedProject ? 'По выбранному проекту отчёты не найдены' : 'Отчёты будут отображаться здесь'}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {creatingReport && (
                <CreateDailyReportModal
                    project={creatingReport}
                    onClose={() => setCreatingReport(null)}
                    onSuccess={() => {
                        setCreatingReport(null);
                        fetchReports();
                    }}
                />
            )}
        </>
    );
};

export { ReportsPage };

import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Calendar, Users, CloudRain } from 'lucide-react';
import ApiService from '../apiService.js';

const ReportCard = ({ report }) => (
    <div className="group rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:border-blue-200 hover:shadow-lg">
        <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <FileText size={16} className="text-blue-600" />
                    <p className="text-sm font-semibold text-slate-900">{report.project_name || 'Проект не указан'}</p>
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                    <Calendar size={14} className="text-slate-400" />
                    {report.report_date}
                </p>
            </div>
        </div>
        
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 px-3 py-2">
                <div className="flex items-center gap-2 text-slate-500">
                    <CloudRain size={14} />
                    <span className="text-xs">Погода</span>
                </div>
                <p className="mt-1 text-sm font-medium text-slate-900">{report.weather_conditions || '-'}</p>
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-2">
                <div className="flex items-center gap-2 text-slate-500">
                    <Users size={14} />
                    <span className="text-xs">Рабочих</span>
                </div>
                <p className="mt-1 text-sm font-medium text-slate-900">{report.workers_count || 0}</p>
            </div>
        </div>

        {report.notes && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs font-semibold text-slate-500">Заметки</p>
                <p className="mt-1 text-sm text-slate-600">{report.notes}</p>
            </div>
        )}
        
        <div className="mt-4 border-t border-slate-200 pt-3 text-xs text-slate-400">
            Автор: {report.author_name || 'Неизвестен'}
        </div>
    </div>
);

const ReportsPage = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchReports = useCallback(async () => {
        setLoading(true);
        try {
            const data = await ApiService.getDailyReports(); 
            setReports(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const groupedReports = reports.reduce((acc, report) => {
        const date = report.report_date;
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(report);
        return acc;
    }, {});

    return (
        <div className="flex h-full flex-col gap-6">
            <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">Ежедневные отчёты</h1>
                        <p className="mt-1 text-sm text-slate-500">Сводка о ходе работ на объектах</p>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2">
                        <FileText size={16} className="text-blue-600" />
                        <span className="text-sm font-semibold text-blue-600">{reports.length} отчётов</span>
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
                            Object.entries(groupedReports).map(([date, reportGroup]) => (
                                <div key={date}>
                                    <div className="mb-4 flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-semibold text-white">
                                            {new Date(date).getDate()}
                                        </div>
                                        <div>
                                            <h2 className="text-base font-semibold text-slate-900">{date}</h2>
                                            <p className="text-xs text-slate-500">{reportGroup.length} отчётов</p>
                                        </div>
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        {reportGroup.map(report => <ReportCard key={report.id} report={report} />)}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex h-full flex-col items-center justify-center rounded-2xl bg-slate-50 py-20 text-center">
                                <FileText className="mb-3 h-12 w-12 text-slate-300" />
                                <p className="text-slate-500">Нет доступных отчётов</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export { ReportsPage };

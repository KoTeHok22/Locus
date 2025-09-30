import React, { useState, useEffect, useCallback } from 'react';
import ApiService from '../apiService.js';

const ReportCard = ({ report }) => (
    <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-800">Отчёт по проекту: {report.project_name || 'Не указан'}</p>
            <p className="text-xs text-gray-500">{report.report_date}</p>
        </div>
        <div className="text-sm text-gray-600 space-y-2">
            <p><span className="font-medium">Погода:</span> {report.weather_conditions || '-'}</p>
            <p><span className="font-medium">Кол-во рабочих:</span> {report.workers_count || 0}</p>
            <p><span className="font-medium">Заметки:</span> {report.notes || 'Нет заметок'}</p>
        </div>
        <div className="text-xs text-gray-400 mt-3 pt-2 border-t">Автор: {report.author_name || 'Неизвестен'}</div>
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
        <div className="h-full flex flex-col">
            <div className="p-6 pb-4 bg-white border-b border-slate-200 rounded-t-lg">
                <h1 className="text-xl font-bold text-gray-900">Ежедневные отчёты</h1>
                <p className="text-sm text-gray-500">Сводка о ходе работ на объектах</p>
            </div>

            <div className="flex-1 p-6 bg-slate-50 overflow-y-auto">
                {loading && <div className="text-center">Загрузка отчётов...</div>}
                {error && <div className="text-center text-red-500">Ошибка: {error}</div>}
                {!loading && !error && (
                    <div className="space-y-6">
                        {Object.keys(groupedReports).length > 0 ? (
                            Object.entries(groupedReports).map(([date, reportGroup]) => (
                                <div key={date}>
                                    <h2 className="font-semibold text-gray-700 mb-2">{date}</h2>
                                    <div className="space-y-4">
                                        {reportGroup.map(report => <ReportCard key={report.id} report={report} />)}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-gray-500 pt-10">Нет доступных отчётов.</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportsPage;
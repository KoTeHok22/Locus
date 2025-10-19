import React, { useState, useEffect } from 'react';
import ApiService from '../../apiService';
import DailyReportCard from './DailyReportCard';
import CreateDailyReportModal from './CreateDailyReportModal';
import { PlusCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const DailyReportBlock = ({ project }) => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingReport, setEditingReport] = useState(null);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const data = await ApiService.getDailyReports({ project_id: project.id });
            setReports(data);
        } catch (error) {
            toast.error('Не удалось загрузить ежедневные отчеты.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (project) {
            fetchReports();
        }
    }, [project]);

    const handleEdit = (report) => {
        setEditingReport(report);
        setModalOpen(true);
    };

    const handleDelete = async (reportId) => {
        if (confirm('Вы уверены, что хотите удалить этот отчет?')) {
            try {
                await ApiService.deleteDailyReport(reportId);
                toast.success('Отчет успешно удален.');
                fetchReports();
            } catch (error) {
                toast.error(error.message || 'Не удалось удалить отчет.');
                console.error(error);
            }
        }
    };

    const handleModalClose = () => {
        setModalOpen(false);
        setEditingReport(null);
        fetchReports();
    };

    return (
        <>
            {isModalOpen && (
                <CreateDailyReportModal
                    projectId={project.id}
                    editingReport={editingReport}
                    onClose={handleModalClose}
                />
            )}
            <div className="rounded-3xl border border-slate-100 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-4 py-3 sm:px-6 sm:py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Ежедневные отчеты</h2>
                            <p className="text-xs text-slate-500 sm:text-sm">Отчеты о проделанной работе</p>
                        </div>
                        <button
                            onClick={() => setModalOpen(true)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                        >
                            <PlusCircle size={16} />
                            <span>Новый отчет</span>
                        </button>
                    </div>
                </div>
                <div className="max-h-96 space-y-3 overflow-y-auto p-4 sm:space-y-4 sm:p-6">
                    {loading ? (
                        <p className="text-slate-500">Загрузка отчетов...</p>
                    ) : reports.length > 0 ? (
                        reports.map(report => (
                            <DailyReportCard
                                key={report.id}
                                report={report}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        ))
                    ) : (
                        <div className="flex items-center justify-center rounded-xl bg-slate-50 p-6 text-center">
                            <p className="text-sm text-slate-500">Ежедневных отчетов нет</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default DailyReportBlock;

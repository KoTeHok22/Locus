import React from 'react';
import { Calendar, User, Cloud, Wind, Thermometer, Edit, Trash2 } from 'lucide-react';

const DailyReportCard = ({ report, onEdit, onDelete }) => {
    return (
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <p className="font-semibold text-gray-800">
                        Ежедневный отчет от {new Date(report.report_date).toLocaleDateString('ru-RU')}
                    </p>
                    <p className="text-xs text-gray-500">
                        Автор: {report.author_name}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {onEdit && (
                        <button onClick={() => onEdit(report)} className="text-blue-600 hover:text-blue-800">
                            <Edit size={16} />
                        </button>
                    )}
                    {onDelete && (
                        <button onClick={() => onDelete(report.id)} className="text-red-600 hover:text-red-800">
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            </div>

            <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                    <User size={14} className="text-gray-500" />
                    <span>Работников: {report.workers_count}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Cloud size={14} className="text-gray-500" />
                    <span>Погода: {report.weather_conditions}</span>
                </div>
                {report.equipment && (
                    <div className="flex items-center gap-2">
                        <Wind size={14} className="text-gray-500" />
                        <span>Техника: {report.equipment}</span>
                    </div>
                )}
                {report.notes && (
                    <div className="pt-2 border-t">
                        <p className="text-xs text-gray-500">Заметки:</p>
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">{report.notes}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DailyReportCard;

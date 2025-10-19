import React, { useState, useEffect } from 'react';
import { Chart } from 'react-google-charts';
import { Calendar, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import ApiService from '../../apiService';

const GanttChartNew = ({ projectId }) => {
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [planDates, setPlanDates] = useState({ start: null, end: null });

    useEffect(() => {
        loadTasksData();
    }, [projectId]);

    const loadTasksData = async () => {
        setIsLoading(true);
        try {
            const tasksData = await ApiService.getTasks({ project_id: projectId });
            const workPlan = await ApiService.getWorkPlan(projectId).catch(() => null);
            
            if (workPlan) {
                setPlanDates({
                    start: new Date(workPlan.start_date),
                    end: new Date(workPlan.end_date)
                });
            }
            
            setTasks(tasksData);
        } catch (error) {
            toast.error(`Ошибка загрузки задач: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
            case 'verified':
                return '#10B981'; // Зеленый - выполнено
            case 'in_progress':
                return '#3B82F6'; // Синий - в работе
            case 'pending':
                return '#6B7280'; // Серый - в плане
            default:
                return '#6B7280';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'completed':
                return 'Выполнено';
            case 'verified':
                return 'Проверено';
            case 'in_progress':
                return 'В работе';
            case 'pending':
                return 'В плане';
            default:
                return status;
        }
    };

    const isOverdue = (task) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endDate = new Date(task.end_date);
        endDate.setHours(0, 0, 0, 0);
        
        return endDate < today && task.status !== 'completed' && task.status !== 'verified';
    };

    const prepareGanttData = () => {
        if (!tasks || tasks.length === 0) {
            return null;
        }

        // Заголовок таблицы
        const headers = [
            { type: 'string', label: 'Task ID' },
            { type: 'string', label: 'Task Name' },
            { type: 'string', label: 'Resource' },
            { type: 'date', label: 'Start Date' },
            { type: 'date', label: 'End Date' },
            { type: 'number', label: 'Duration' },
            { type: 'number', label: 'Percent Complete' },
            { type: 'string', label: 'Dependencies' },
        ];

        // Преобразование задач в формат Google Charts
        const rows = tasks.map((task, index) => {
            const startDate = new Date(task.start_date);
            const endDate = new Date(task.end_date);
            const duration = null; // Google Charts рассчитает автоматически
            
            // Определяем прогресс на основе статуса
            let percentComplete = 0;
            if (task.status === 'in_progress') percentComplete = 50;
            if (task.status === 'completed' || task.status === 'verified') percentComplete = 100;

            const overdue = isOverdue(task);
            const statusLabel = getStatusLabel(task.status);
            const overdueText = overdue ? ' [ПРОСРОЧЕНО]' : '';

            return [
                `task-${task.id}`,
                `${index + 1}. ${task.name}${overdueText}`,
                statusLabel,
                startDate,
                endDate,
                duration,
                percentComplete,
                null // зависимости можно добавить позже
            ];
        });

        return [headers, ...rows];
    };

    const ganttData = prepareGanttData();

    const options = {
        height: Math.max(400, tasks.length * 50 + 100),
        gantt: {
            trackHeight: 40,
            barHeight: 30,
            barCornerRadius: 4,
            shadowEnabled: true,
            shadowColor: '#000',
            shadowOffset: 1,
            criticalPathEnabled: false,
            innerGridHorizLine: {
                stroke: '#E5E7EB',
                strokeWidth: 1
            },
            innerGridTrack: { fill: '#F9FAFB' },
            innerGridDarkTrack: { fill: '#F3F4F6' },
            labelStyle: {
                fontName: 'Arial',
                fontSize: 13,
                color: '#1F2937'
            },
            percentEnabled: true,
            percentStyle: {
                fill: '#fff'
            }
        },
        backgroundColor: '#fff',
        tooltip: {
            trigger: 'focus',
            isHtml: true,
            textStyle: {
                fontSize: 13
            }
        }
    };

    if (isLoading) {
        return (
            <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 p-4 sm:p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-slate-200 rounded w-1/3"></div>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-16 bg-slate-100 rounded-lg"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (!ganttData || tasks.length === 0) {
        return (
            <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2 mb-4">
                    <Calendar className="text-blue-600" size={24} />
                    График производства работ (Диаграмма Ганта)
                </h2>
                <div className="text-center py-12">
                    <Calendar size={48} className="mx-auto mb-3 text-slate-300" />
                    <p className="text-sm text-slate-500">Нет задач для отображения</p>
                    <p className="text-xs text-slate-400 mt-1">Создайте задачи в плане работ</p>
                </div>
            </div>
        );
    }

    const overdueCount = tasks.filter(isOverdue).length;

    return (
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 p-4 sm:p-6">
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Calendar className="text-blue-600" size={24} />
                        График производства работ (Диаграмма Ганта)
                    </h2>
                    {overdueCount > 0 && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-red-50 border border-red-200 rounded-lg">
                            <AlertTriangle size={16} className="text-red-600" />
                            <span className="text-sm font-semibold text-red-700">
                                Просрочено: {overdueCount}
                            </span>
                        </div>
                    )}
                </div>
                {planDates.start && planDates.end && (
                    <p className="text-sm text-slate-600">
                        Общий период проекта: {planDates.start.toLocaleDateString('ru-RU')} - {planDates.end.toLocaleDateString('ru-RU')}
                    </p>
                )}
                <p className="text-xs text-slate-500 mt-1">
                    Всего задач: {tasks.length}
                </p>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <Chart
                    chartType="Gantt"
                    width="100%"
                    height="auto"
                    data={ganttData}
                    options={options}
                />
            </div>

            <div className="mt-6 pt-6 border-t border-slate-200">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="text-xs font-semibold text-slate-600">Статусы задач:</div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: '#6B7280' }}></div>
                        <span className="text-xs text-slate-600">В плане</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: '#3B82F6' }}></div>
                        <span className="text-xs text-slate-600">В работе (50%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10B981' }}></div>
                        <span className="text-xs text-slate-600">Выполнено (100%)</span>
                    </div>
                </div>
                <div className="mt-3 text-xs text-slate-500">
                    <strong>Подсказка:</strong> Наведите курсор на задачу для просмотра подробной информации. 
                    Просроченные задачи отмечены меткой [ПРОСРОЧЕНО].
                </div>
            </div>
        </div>
    );
};

export default GanttChartNew;

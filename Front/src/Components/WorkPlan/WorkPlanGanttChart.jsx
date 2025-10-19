import React, { useState, useMemo, useCallback } from 'react';
import { Calendar, AlertTriangle } from 'lucide-react';

const WorkPlanGanttChart = React.memo(({ workPlan }) => {
    const [hoveredItem, setHoveredItem] = useState(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    
    const handleItemInteraction = useCallback((item, progress, overdue, x, y) => {
        setHoveredItem({ ...item, progress, overdue });
        setMousePos({ x, y });
    }, []);

    if (!workPlan || !workPlan.items || workPlan.items.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-slate-100 p-6">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
                    <Calendar className="text-blue-600" size={24} />
                    Диаграмма Ганта
                </h2>
                <div className="text-center py-12">
                    <Calendar size={48} className="mx-auto mb-3 text-slate-300" />
                    <p className="text-sm text-slate-500">Нет работ для отображения</p>
                </div>
            </div>
        );
    }

    const isOverdue = useCallback((item) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endDate = new Date(item.end_date);
        endDate.setHours(0, 0, 0, 0);
        
        const actualQuantity = item.actual_quantity || 0;
        const isComplete = actualQuantity >= item.quantity;
        
        return endDate < today && !isComplete;
    }, []);

    const planStart = useMemo(() => new Date(workPlan.start_date), [workPlan.start_date]);
    const planEnd = useMemo(() => new Date(workPlan.end_date), [workPlan.end_date]);
    const totalDays = useMemo(() => Math.ceil((planEnd - planStart) / (1000 * 60 * 60 * 24)) + 1, [planEnd, planStart]);
    const overdueCount = useMemo(() => workPlan.items.filter(isOverdue).length, [workPlan.items, isOverdue]);

    const timeScale = useMemo(() => {
        const months = [];
        let current = new Date(planStart);
        current.setDate(1);

        while (current <= planEnd) {
            const monthStart = new Date(current);
            const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
            
            const startOffset = Math.max(0, Math.ceil((monthStart - planStart) / (1000 * 60 * 60 * 24)));
            const endInRange = monthEnd < planEnd ? monthEnd : planEnd;
            const daysInMonth = Math.ceil((endInRange - Math.max(monthStart, planStart)) / (1000 * 60 * 60 * 24)) + 1;

            months.push({
                name: monthStart.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }),
                days: daysInMonth,
                offset: startOffset
            });

            current.setMonth(current.getMonth() + 1);
        }

        return months;
    }, [planStart, planEnd]);

    const calculateBarPosition = useCallback((item) => {
        const startDate = new Date(item.start_date);
        const endDate = new Date(item.end_date);
        
        const startOffset = Math.max(0, Math.ceil((startDate - planStart) / (1000 * 60 * 60 * 24)));
        const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
        
        const leftPercent = (startOffset / totalDays) * 100;
        const widthPercent = (duration / totalDays) * 100;
        
        return { left: leftPercent, width: widthPercent };
    }, [planStart, totalDays]);

    const getBarColor = useCallback((item) => {
        const actualQuantity = item.actual_quantity || 0;
        const percentComplete = (actualQuantity / item.quantity) * 100;
        
        if (isOverdue(item)) return { bg: 'bg-red-500', border: 'border-red-600' };
        if (percentComplete >= 100) return { bg: 'bg-emerald-500', border: 'border-emerald-600' };
        if (percentComplete > 0) return { bg: 'bg-blue-500', border: 'border-blue-600' };
        return { bg: 'bg-slate-400', border: 'border-slate-500' };
    }, [isOverdue]);

    const getProgressPercent = useCallback((item) => {
        const actualQuantity = item.actual_quantity || 0;
        return Math.min(100, Math.round((actualQuantity / item.quantity) * 100));
    }, []);

    return (
        <div 
            className="bg-white rounded-xl border border-slate-100 p-3 sm:p-6"
            onClick={() => setHoveredItem(null)}
        >
            <div className="mb-4 sm:mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-2">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Calendar className="text-blue-600" size={20} />
                        <span className="hidden sm:inline">Диаграмма Ганта плана работ</span>
                        <span className="sm:hidden">Диаграмма Ганта</span>
                    </h2>
                    {overdueCount > 0 && (
                        <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 bg-red-50 border border-red-200 rounded-lg">
                            <AlertTriangle size={14} className="text-red-600 sm:w-4 sm:h-4" />
                            <span className="text-xs sm:text-sm font-semibold text-red-700">
                                Просрочено: {overdueCount}
                            </span>
                        </div>
                    )}
                </div>
                <p className="text-xs sm:text-sm text-slate-600">
                    Период: {planStart.toLocaleDateString('ru-RU')} - {planEnd.toLocaleDateString('ru-RU')}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                    Всего работ: {workPlan.items.length}
                </p>
            </div>

            <div className="overflow-x-auto -mx-3 sm:mx-0">
                <div className="min-w-[600px] sm:min-w-[1000px]">
                    <div className="flex border-b border-slate-200">
                        <div className="w-[150px] sm:w-[300px] flex-shrink-0 px-2 sm:px-4 py-2 sm:py-3 bg-slate-50 border-r border-slate-200">
                            <span className="text-[10px] sm:text-xs font-semibold text-slate-600 uppercase">Работа</span>
                        </div>
                        <div className="flex-1 flex">
                            {timeScale.map((month, idx) => (
                                <div
                                    key={idx}
                                    className="border-r border-slate-200 bg-slate-50 px-1 sm:px-2 py-2 sm:py-3"
                                    style={{ width: `${(month.days / totalDays) * 100}%` }}
                                >
                                    <span className="text-[10px] sm:text-xs font-semibold text-slate-600 line-clamp-2">{month.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative">
                        {workPlan.items.map((item, index) => {
                            const position = calculateBarPosition(item);
                            const colors = getBarColor(item);
                            const progress = getProgressPercent(item);
                            const overdue = isOverdue(item);

                            return (
                                <div key={item.id} className="flex border-b border-slate-100 hover:bg-slate-50 transition-colors h-[50px] sm:h-[60px]">
                                    <div className="w-[150px] sm:w-[300px] flex-shrink-0 px-2 sm:px-4 py-2 sm:py-3 border-r border-slate-200">
                                        <div className="flex items-start gap-1 sm:gap-2">
                                            <span className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-600 text-white text-[10px] sm:text-xs font-bold flex-shrink-0">
                                                {index + 1}
                                            </span>
                                            <div 
                                                className="flex-1 min-w-0 cursor-pointer active:bg-slate-100 rounded"
                                                onMouseEnter={(e) => handleItemInteraction(item, progress, overdue, e.clientX, e.clientY)}
                                                onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
                                                onMouseLeave={() => setHoveredItem(null)}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleItemInteraction(item, progress, overdue, e.clientX, e.clientY);
                                                }}
                                                onTouchStart={(e) => {
                                                    e.stopPropagation();
                                                    const touch = e.touches[0];
                                                    handleItemInteraction(item, progress, overdue, touch.clientX, touch.clientY);
                                                }}
                                            >
                                                <p className="text-xs sm:text-sm font-medium text-slate-900 truncate">
                                                    {item.name}
                                                </p>
                                                <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">
                                                    {item.quantity} {item.unit}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 relative py-2 sm:py-3 px-1 sm:px-2">
                                        <div
                                            className={`absolute h-6 sm:h-8 rounded-md sm:rounded-lg border sm:border-2 ${colors.border} ${colors.bg} shadow-sm flex items-center justify-center transition-all hover:shadow-md active:shadow-lg cursor-pointer`}
                                            style={{
                                                left: `${position.left}%`,
                                                width: `${position.width}%`
                                            }}
                                            onMouseEnter={(e) => handleItemInteraction(item, progress, overdue, e.clientX, e.clientY)}
                                            onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
                                            onMouseLeave={() => setHoveredItem(null)}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleItemInteraction(item, progress, overdue, e.clientX, e.clientY);
                                            }}
                                            onTouchStart={(e) => {
                                                e.stopPropagation();
                                                const touch = e.touches[0];
                                                handleItemInteraction(item, progress, overdue, touch.clientX, touch.clientY);
                                            }}
                                        >
                                            <div
                                                className="absolute left-0 top-0 bottom-0 bg-white/30"
                                                style={{ width: `${progress}%` }}
                                            />
                                            <span className="relative z-10 text-[10px] sm:text-xs font-bold text-white drop-shadow px-1 sm:px-2 truncate">
                                                {progress}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-slate-200">
                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                    <div className="text-[10px] sm:text-xs font-semibold text-slate-600 w-full sm:w-auto mb-1 sm:mb-0">Статусы работ:</div>
                    <div className="flex items-center gap-1 sm:gap-2">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-slate-400"></div>
                        <span className="text-[10px] sm:text-xs text-slate-600">План</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-blue-500"></div>
                        <span className="text-[10px] sm:text-xs text-slate-600">В работе</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-emerald-500"></div>
                        <span className="text-[10px] sm:text-xs text-slate-600">Завершено</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-red-500"></div>
                        <span className="text-[10px] sm:text-xs text-slate-600">Просрочено</span>
                    </div>
                </div>
                <div className="mt-2 sm:mt-3 text-[10px] sm:text-xs text-slate-500">
                    <strong>Подсказка:</strong> <span className="hidden sm:inline">Наведите курсор на полосу работы, чтобы увидеть подробную информацию о задаче.</span><span className="sm:hidden">Нажмите на работу для подробной информации.</span>
                </div>
            </div>

            {hoveredItem && (
                <div 
                    className="fixed bg-slate-900 text-white text-xs sm:text-sm rounded-lg px-3 py-2 sm:px-4 sm:py-3 shadow-2xl pointer-events-auto sm:pointer-events-none"
                    style={{
                        left: typeof window !== 'undefined' && mousePos.x + 200 > window.innerWidth 
                            ? `${Math.max(10, mousePos.x - 200)}px` 
                            : `${Math.min(mousePos.x + 15, typeof window !== 'undefined' ? window.innerWidth - 220 : mousePos.x + 15)}px`,
                        top: typeof window !== 'undefined' && mousePos.y + 150 > window.innerHeight
                            ? `${Math.max(10, mousePos.y - 150)}px`
                            : `${Math.min(mousePos.y + 15, typeof window !== 'undefined' ? window.innerHeight - 160 : mousePos.y + 15)}px`,
                        zIndex: 10000,
                        maxWidth: '90vw',
                        width: 'auto',
                        minWidth: '200px'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-start justify-between gap-2 mb-1 sm:mb-2">
                        <div className="font-semibold text-xs sm:text-sm flex-1">{hoveredItem.name}</div>
                        <button 
                            className="sm:hidden text-slate-400 hover:text-white transition-colors p-1 -m-1"
                            onClick={() => setHoveredItem(null)}
                        >
                            ✕
                        </button>
                    </div>
                    <div className="text-slate-300 space-y-0.5 sm:space-y-1 text-[10px] sm:text-xs">
                        <div>📅 {new Date(hoveredItem.start_date).toLocaleDateString('ru-RU')} - {new Date(hoveredItem.end_date).toLocaleDateString('ru-RU')}</div>
                        <div>📊 {hoveredItem.quantity} {hoveredItem.unit}</div>
                        <div>✅ Прогресс: {hoveredItem.progress}%</div>
                        {hoveredItem.overdue && (
                            <div className="text-red-300 font-semibold mt-1 sm:mt-2 text-xs">⚠️ ПРОСРОЧЕНО</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
});

WorkPlanGanttChart.displayName = 'WorkPlanGanttChart';

export default WorkPlanGanttChart;

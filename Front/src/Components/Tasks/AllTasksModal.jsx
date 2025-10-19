import React, { useState } from 'react';
import { X, ListTodo } from 'lucide-react';
import TaskCard from './TaskCard';

const AllTasksModal = ({ tasks, onClose }) => {
    const [filterStatus, setFilterStatus] = useState('all');

    const filteredTasks = filterStatus === 'all' 
        ? tasks 
        : tasks.filter(task => task.status === filterStatus);

    const statusCounts = {
        all: tasks.length,
        pending: tasks.filter(t => t.status === 'pending').length,
        completed: tasks.filter(t => t.status === 'completed').length,
        verified: tasks.filter(t => t.status === 'verified').length,
    };

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
            <div className="w-full max-w-4xl max-h-[90vh] rounded-3xl border border-slate-100 bg-white shadow-xl flex flex-col">
                <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-purple-100 p-2">
                            <ListTodo size={20} className="text-purple-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900">Все задачи проекта</h2>
                            <p className="text-sm text-slate-500">Полный список задач с разными статусами</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="border-b border-slate-200 px-6 py-3">
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setFilterStatus('all')}
                            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                                filterStatus === 'all'
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            Все ({statusCounts.all})
                        </button>
                        <button
                            onClick={() => setFilterStatus('pending')}
                            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                                filterStatus === 'pending'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            Ожидают ({statusCounts.pending})
                        </button>
                        <button
                            onClick={() => setFilterStatus('completed')}
                            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                                filterStatus === 'completed'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            Выполнены ({statusCounts.completed})
                        </button>
                        <button
                            onClick={() => setFilterStatus('verified')}
                            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                                filterStatus === 'verified'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            Верифицированы ({statusCounts.verified})
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {filteredTasks.length > 0 ? (
                        <div className="space-y-3">
                            {filteredTasks.map(task => (
                                <TaskCard key={task.id} task={task} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex h-full items-center justify-center">
                            <div className="text-center">
                                <div className="mx-auto mb-3 rounded-full bg-slate-100 p-3 w-fit">
                                    <ListTodo size={24} className="text-slate-400" />
                                </div>
                                <p className="text-slate-500">
                                    {filterStatus === 'all' ? 'Задач не создано' : 'Нет задач с таким статусом'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="border-t border-slate-200 px-6 py-4">
                    <button
                        onClick={onClose}
                        className="w-full rounded-xl bg-slate-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
                    >
                        Закрыть
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AllTasksModal;

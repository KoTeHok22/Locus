import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Calendar, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';
import ApiService from '../apiService';
import AuthService from '../authService';

const WorkPlanView = lazy(() => import('../Components/WorkPlan/WorkPlanView'));
const CreateWorkPlanModal = lazy(() => import('../Components/WorkPlan/CreateWorkPlanModal'));
const MaterialManagement = lazy(() => import('../Components/Materials/MaterialManagement'));
const WorkPlanGanttChart = lazy(() => import('../Components/WorkPlan/WorkPlanGanttChart'));
const MaterialAnalytics = lazy(() => import('../Components/Materials/MaterialAnalytics'));

const ComponentLoader = () => (
    <div className="flex items-center justify-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
);

const MaterialManagementPage = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [workPlan, setWorkPlan] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('plan');
    const [userRole, setUserRole] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        const role = AuthService.getUserRole();
        if (role) {
            setUserRole(role);
        }
        loadData();
    }, [projectId]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [projectData, planData] = await Promise.all([
                ApiService.getProjectDetails(projectId),
                ApiService.getWorkPlan(projectId).catch(() => null)
            ]);
            setProject(projectData);
            setWorkPlan(planData);
        } catch (error) {
            toast.error(`Ошибка загрузки: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };



    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="animate-pulse space-y-6">
                        <div className="h-8 bg-slate-200 rounded w-1/3"></div>
                        <div className="h-64 bg-white rounded-2xl"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:flex-row sm:items-start sm:justify-between sm:p-6">
                    <div className="flex-1">
                        <button
                            onClick={() => navigate(`/projects/${projectId}`)}
                            className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                        >
                            <ArrowLeft size={16} />
                            Назад к проекту
                        </button>
                        <h1 className="text-2xl font-semibold text-slate-900">
                            {project?.name || 'Загрузка...'}
                        </h1>
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                            <Package size={16} className="text-slate-400" />
                            Управление материалами и планом работ
                        </p>
                    </div>
                </div>

                <div className="rounded-3xl border border-slate-100 bg-white shadow-sm">
                    <div className="border-b border-slate-200 px-4 py-3 sm:px-6 sm:py-4">
                        <div className="flex gap-2 overflow-x-auto">
                            {[
                                { key: 'plan', label: 'План работ', icon: Calendar },
                                { key: 'gantt', label: 'Диаграмма Ганта', icon: BarChart3 },
                                { key: 'analytics', label: 'Аналитика', icon: Package }
                            ].map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                                        activeTab === tab.key
                                            ? 'bg-blue-600 text-white'
                                            : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                                >
                                    <tab.icon size={16} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 sm:p-6">
                        <Suspense fallback={<ComponentLoader />}>
                            {activeTab === 'plan' && (
                                <div className="space-y-6">
                                    {!workPlan ? (
                                        <div className="text-center py-12">
                                            <Calendar size={64} className="mx-auto mb-4 text-slate-300" />
                                            <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                                План работ не создан
                                            </h3>
                                            <p className="text-sm text-slate-600 mb-6">
                                                Создайте план работ вручную или импортируйте из Excel
                                            </p>
                                            {userRole === 'client' && (
                                                <div className="flex justify-center gap-3">
                                                    <button
                                                        onClick={() => setShowCreateModal(true)}
                                                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                                                    >
                                                        <Calendar size={18} />
                                                        Создать план
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            <WorkPlanView projectId={projectId} userRole={userRole} />
                                            
                                            {workPlan.items && workPlan.items.length > 0 && userRole === 'client' && (
                                                <div>
                                                    <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-4">
                                                        Управление материалами для работ
                                                    </h3>
                                                    <div className="space-y-4">
                                                        {workPlan.items.map((item, index) => (
                                                            <div key={item.id} className="border border-slate-200 rounded-xl overflow-hidden">
                                                                <button
                                                                    onClick={() => setSelectedItem(selectedItem?.id === item.id ? null : item)}
                                                                    className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left flex items-center justify-between"
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                                                                            {index + 1}
                                                                        </div>
                                                                        <span className="text-sm font-semibold text-slate-900">
                                                                            {item.name}
                                                                        </span>
                                                                    </div>
                                                                    <Package size={16} className="text-slate-400" />
                                                                </button>
                                                                {selectedItem?.id === item.id && (
                                                                    <div className="p-4 border-t border-slate-200">
                                                                        <MaterialManagement
                                                                            workItem={item}
                                                                            onUpdate={loadData}
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            {activeTab === 'gantt' && (
                                workPlan ? (
                                    <WorkPlanGanttChart workPlan={workPlan} />
                                ) : (
                                    <div className="text-center py-12">
                                        <Calendar size={64} className="mx-auto mb-4 text-slate-300" />
                                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                            План работ не создан
                                        </h3>
                                        <p className="text-sm text-slate-600">
                                            Создайте план работ для отображения диаграммы Ганта
                                        </p>
                                    </div>
                                )
                            )}
                            {activeTab === 'analytics' && <MaterialAnalytics projectId={projectId} />}
                        </Suspense>
                    </div>
                </div>
            </div>

            {showCreateModal && (
                <Suspense fallback={null}>
                    <CreateWorkPlanModal
                        projectId={projectId}
                        onClose={() => setShowCreateModal(false)}
                        onSuccess={() => {
                            setShowCreateModal(false);
                            loadData();
                        }}
                    />
                </Suspense>
            )}
        </>
    );
};

export default MaterialManagementPage;

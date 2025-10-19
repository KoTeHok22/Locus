import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ClipboardList, Upload, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import ApiService from '../apiService';
import TTNUpload from '../Components/Materials/TTNUpload';
import ForemanWorkDesk from '../Components/Materials/ForemanWorkDesk';

const ForemanMaterialPage = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('work');
    const [materialBalance, setMaterialBalance] = useState(null);

    useEffect(() => {
        loadData();
    }, [projectId]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [projectData, balance] = await Promise.all([
                ApiService.getProjectDetails(projectId),
                ApiService.getMaterialBalance(projectId)
            ]);
            setProject(projectData);
            setMaterialBalance(balance);
        } catch (error) {
            toast.error(`Ошибка загрузки: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTTNSuccess = () => {
        toast.success('ТТН успешно обработана');
        loadData();
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
                            <ClipboardList size={16} className="text-slate-400" />
                            Рабочий стол прораба
                        </p>
                    </div>
                </div>

                <div className="rounded-3xl border border-slate-100 bg-white shadow-sm">
                    <div className="border-b border-slate-200 px-4 py-3 sm:px-6 sm:py-4">
                        <div className="flex gap-2 overflow-x-auto">
                            {[
                                { key: 'work', label: 'Мои работы', icon: ClipboardList },
                                { key: 'ttn', label: 'Загрузка ТТН', icon: Upload },
                                { key: 'balance', label: 'Склад', icon: Package }
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
                        {activeTab === 'work' && <ForemanWorkDesk projectId={projectId} />}
                        {activeTab === 'ttn' && <TTNUpload projectId={projectId} onSuccess={handleTTNSuccess} />}
                        {activeTab === 'balance' && <MaterialBalanceView balance={materialBalance} />}
                    </div>
                </div>
            </div>
        </>
    );
};

const MaterialBalanceView = ({ balance }) => {
    if (!balance || !balance.balance || balance.balance.length === 0) {
        return (
            <div className="text-center py-12">
                <Package size={64} className="mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Склад пуст
                </h3>
                <p className="text-sm text-slate-600">
                    Материалы появятся после оприходования ТТН
                </p>
            </div>
        );
    }

    return (
        <div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Package size={20} className="text-blue-600" />
                Остатки материалов на складе
            </h3>

            <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                                    Материал
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">
                                    Поставлено
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">
                                    Израсходовано
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">
                                    Остаток
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                            {balance.balance.map((mat) => (
                                <tr key={mat.material_id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">{mat.material_name}</p>
                                            <p className="text-xs text-slate-500">{mat.unit}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right text-sm text-slate-900">
                                        {mat.total_delivered.toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-sm text-blue-600 font-semibold">
                                        {mat.total_consumed.toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <span className={`text-sm font-bold ${
                                            mat.remaining > 0 ? 'text-emerald-600' : 'text-red-600'
                                        }`}>
                                            {mat.remaining.toFixed(2)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ForemanMaterialPage;

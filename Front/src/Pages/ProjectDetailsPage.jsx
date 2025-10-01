import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import ApiService from '../apiService';
import { YandexMap } from '../Components/Map/YandexMap';
import CreateIssueModal from '../Components/Issues/CreateIssueModal';
import AuthService from '../authService';
import VerificationTaskCard from '../Components/Tasks/VerificationTaskCard';
import TTNCard from '../Components/Documents/TTNCard';
import EditTTNModal from '../Components/Documents/EditTTNModal';
import { translate } from '../utils/translation.js';

function ProjectDetailsPage() {
    const { projectId } = useParams();
    const [project, setProject] = useState(null);
    const [tasksToVerify, setTasksToVerify] = useState([]);
    const [issues, setIssues] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [editingDocument, setEditingDocument] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isIssueModalOpen, setIssueModalOpen] = useState(false);
    const userRole = AuthService.getUserRole();

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            // Fetch all data in parallel
            const [projectData, documentsData] = await Promise.all([
                ApiService.getProjectDetails(projectId),
                ApiService.getProjectDocuments(projectId)
            ]);
            setProject(projectData);
            setDocuments(documentsData);

            if (userRole === 'client') {
                const tasksData = await ApiService.getTasks({ project_id: projectId, status: 'completed' });
                setTasksToVerify(tasksData);
            }

            if (userRole === 'inspector') {
                const issuesData = await ApiService.getIssues({ project_id: projectId });
                setIssues(issuesData);
            }
            
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [projectId, userRole]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) {
        return <div className="p-8">Загрузка данных о проекте...</div>;
    }

    if (error) {
        return <div className="p-8 text-red-500">Ошибка: {error}</div>;
    }

    if (!project) {
        return <div className="p-8">Проект не найден.</div>;
    }

    return (
        <>
            {isIssueModalOpen && (
                <CreateIssueModal
                    preselectedProjectId={projectId}
                    issueType='remark'
                    onClose={() => setIssueModalOpen(false)}
                    onUpdate={fetchData}
                />
            )}
            {editingDocument && (
                <EditTTNModal 
                    document={editingDocument}
                    onClose={() => setEditingDocument(null)}
                    onUpdate={() => {
                        setEditingDocument(null);
                        fetchData();
                    }}
                />
            )}
            <div className="p-4 sm:p-6 md:p-8 h-full flex flex-col gap-6">
                <div className="flex-shrink-0 flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                        <p className="text-sm text-gray-500 mt-1">{project.address}</p>
                    </div>
                    {userRole === 'client' && (
                        <button 
                            onClick={() => setIssueModalOpen(true)}
                            className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2">
                            <i className="fas fa-plus"></i>
                            <span>Добавить замечание</span>
                        </button>
                    )}
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
                    
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        <div className="border rounded-lg shadow-sm min-h-[300px] lg:min-h-0 flex-1">
                            <YandexMap projects={[project]} />
                        </div>
                        {userRole === 'client' && tasksToVerify.length > 0 && (
                            <div className="border rounded-lg shadow-sm">
                                <h2 className="text-lg font-semibold p-4 border-b">Задачи на верификацию ({tasksToVerify.length})</h2>
                                <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                                    {tasksToVerify.map(task => (
                                        <VerificationTaskCard key={task.id} task={task} onUpdate={fetchData} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    
                    <div className="border rounded-lg shadow-sm p-4 flex flex-col">
                        <h2 className="text-lg font-semibold mb-4 border-b pb-2">Детали проекта</h2>
                        <div className="space-y-3">
                            <div>
                                <span className="font-medium text-gray-700">Статус: </span>
                                <span className="capitalize px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">{translate(project.status)}</span>
                            </div>
                            <div>
                                <span className="font-medium text-gray-700">Дата создания: </span>
                                <span>{new Date(project.created_at).toLocaleDateString()}</span>
                            </div>
                            
                        </div>

                        {userRole === 'inspector' && issues.length > 0 && (
                            <div className="border-t mt-4 pt-4">
                                <h2 className="text-lg font-semibold mb-4">Нарушения на объекте ({issues.length})</h2>
                                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                    {issues.map(issue => (
                                        <div key={issue.id} className="border-b pb-2">
                                            <p className="text-sm font-medium text-gray-800">{issue.description}</p>
                                            <div className="flex justify-between items-center mt-1">
                                                <span className={`text-xs capitalize px-2 py-0.5 rounded-full ${issue.status === 'open' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {translate(issue.status)}
                                                </span>
                                                <span className="text-xs text-gray-500">{issue.due_date ? `до ${issue.due_date}` : ''}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {documents.length > 0 && (
                            <div className="border-t mt-4 pt-4">
                                <h2 className="text-lg font-semibold mb-4">Документы ({documents.length})</h2>
                                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                    {documents.map(doc => (
                                        <TTNCard key={doc.id} document={doc} onEdit={() => setEditingDocument(doc)} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

export { ProjectDetailsPage };
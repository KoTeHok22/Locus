import AuthService from './authService';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8501').replace(/\/$/, '') + '/api';

async function request(endpoint, options = {}) {
    const token = AuthService.getToken();
    const headers = {
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    const config = {
        ...options,
        headers,
        signal: options.signal,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (response.status === 204) {
        return null;
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || `Ошибка API: ${response.statusText}`);
    }

    return data;
}

class ApiService {

    getProjects(options = {}) {
        return request('/projects', options);
    }

    getProjectDetails(projectId, options = {}) {
        return request(`/projects/${projectId}`, options);
    }

    createProject(projectData) {
        return request('/projects', { 
            method: 'POST', 
            body: JSON.stringify(projectData) 
        });
    }

    getTasks(filters = {}, options = {}) {
        const query = new URLSearchParams(filters).toString();
        return request(`/tasks?${query}`, options);
    }

    createTask(taskData) {
        return request('/tasks', {
            method: 'POST',
            body: JSON.stringify(taskData)
        });
    }

    updateTaskStatus(projectId, taskId, status, photos, comment, geolocation, materials, actualQuantity) {
        const formData = new FormData();
        formData.append('status', status);
        
        if (comment) {
            formData.append('comment', comment);
        }
        
        if (geolocation) {
            formData.append('geolocation', geolocation);
        }
        
        if (photos && photos.length > 0) {
            photos.forEach(photo => {
                formData.append('photos', photo);
            });
        }
        
        if (materials && materials.length > 0) {
            formData.append('materials', JSON.stringify(materials));
        }
        
        if (actualQuantity !== undefined && actualQuantity !== null) {
            formData.append('actual_quantity', actualQuantity);
        }
        
        return request(`/projects/${projectId}/tasks/${taskId}`, {
            method: 'PATCH',
            body: formData
        });
    }

    getWorkPlan(projectId) {
        return request(`/projects/${projectId}/work-plan`);
    }

    getMaterials() {
        return request('/materials');
    }

    verifyTask(projectId, taskId, status) {
        return request(`/projects/${projectId}/tasks/${taskId}/verify`, {
            method: 'POST',
            body: JSON.stringify({ status })
        });
    }

    getIssues(filters = {}, options = {}) {
        const query = new URLSearchParams(filters).toString();
        return request(`/issues?${query}`, options);
    }

    createIssue(projectId, issueData, geolocation) {
        const options = {
            method: 'POST',
            body: JSON.stringify(issueData),
            headers: {}
        };

        if (geolocation) {
            options.headers['X-User-Geolocation'] = geolocation;
        }

        return request(`/projects/${projectId}/issues`, options);
    }

    resolveIssue(issueId, photos, comment = "") {
        const formData = new FormData();
        
        photos.forEach(photo => {
            formData.append("photos", photo);
        });
        
        if (comment) {
            formData.append("comment", comment);
        }

        return request(`/issues/${issueId}/resolve`, {
            method: "POST",
            body: formData,
            isFormData: true
        });
    }

    verifyIssueResolution(issueId, status, comment = "") {
        return request(`/issues/${issueId}/verify`, {
            method: "POST",
            body: JSON.stringify({ status, comment })
        });
    }

    getIssueDetails(issueId) {
        return request(`/issues/${issueId}`);
    }

    async getClassifiers(filters = {}) {
        const query = new URLSearchParams(filters).toString();
        const data = await request(`/classifiers?${query}`);
        return data.classifiers; 
    }

    recognizeDocument(projectId, file) {
        const formData = new FormData();
        formData.append('project_id', projectId);
        formData.append('file', file);
        return request('/recognize/document', {
            method: 'POST',
            body: formData,
        });
    }

    getRecognitionStatus(documentId) {
        return request(`/recognize/status/${documentId}`);
    }

    linkTtnToPlan(documentId) {
        return request(`/ttn/${documentId}/link-to-plan`, {
            method: 'POST'
        });
    }

    createDelivery(projectId, documentId, items) {
        return request(`/projects/${projectId}/deliveries`, {
            method: 'POST',
            body: JSON.stringify({ document_id: documentId, items })
        });
    }

    getDailyReports(filters = {}) {
        const query = new URLSearchParams(filters).toString();
        return request(`/daily-reports?${query}`);
    }

    createDailyReport(data) {
        return request('/daily-reports', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    updateDailyReport(reportId, data) {
        return request(`/daily-reports/${reportId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    deleteDailyReport(reportId) {
        return request(`/daily-reports/${reportId}`, {
            method: 'DELETE'
        });
    }

    getDailyReport(reportId) {
        return request(`/daily-reports/${reportId}`);
    }

    getProjectRisk(projectId, options = {}) {
        return request(`/projects/${projectId}/risk`, options);
    }

    recalculateProjectRisk(projectId) {
        return request(`/projects/${projectId}/risk/recalculate`, {
            method: 'POST'
        });
    }

    addProjectMember(projectId, email, role) {
        return request(`/projects/${projectId}/members`, {
            method: 'POST',
            body: JSON.stringify({ email, role }),
        });
    }

    activateProject(projectId) {
        return request(`/projects/${projectId}/activate`, {
            method: 'POST',
            body: JSON.stringify({}),
        });
    }

    getProjectDocuments(projectId, options = {}) {
        return request(`/projects/${projectId}/documents`, options);
    }

    updateDocument(documentId, newData) {
        return request(`/documents/${documentId}`, {
            method: 'PUT',
            body: JSON.stringify({ recognized_data: newData })
        });
    }

    getDocumentFileUrl(documentId) {
        const token = AuthService.getToken();
        return `${API_BASE_URL}/documents/${documentId}/file?token=${token}`;
    }

    async openDocumentFile(documentId) {
        const token = AuthService.getToken();
        const url = `${API_BASE_URL}/documents/${documentId}/file`;
        
        try {
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Не удалось открыть файл');
            }
            
            const blob = await response.blob();
            const fileUrl = window.URL.createObjectURL(blob);
            window.open(fileUrl, '_blank');
            
            setTimeout(() => window.URL.revokeObjectURL(fileUrl), 100);
        } catch (error) {
            throw error;
        }
    }
    getProjectDeliveries(projectId, options = {}) {
        return request(`/projects/${projectId}/deliveries`, options);
    }

    deleteMaterialDelivery(deliveryId) {
        return request(`/deliveries/${deliveryId}`, {
            method: 'DELETE',
        });
    }

    getChecklists(type = null, options = {}) {
        const query = type ? `?type=${type}` : '';
        return request(`/checklists${query}`, options);
    }

    getChecklistDetails(checklistId) {
        return request(`/checklists/${checklistId}`);
    }

    initializeChecklist(projectId, checklistId, geolocation) {
        return request(`/projects/${projectId}/checklists/${checklistId}/initialize`, {
            method: 'POST',
            body: JSON.stringify({ geolocation }),
            headers: {
                'X-User-Geolocation': geolocation
            }
        });
    }

    completeChecklist(projectId, checklistId, itemsResponses, notes, photos, geolocation, initializationGeolocation) {
        const data = {
            project_id: projectId,
            responses: itemsResponses,
            notes: notes || '',
            geolocation: geolocation || null,
            initialization_geolocation: initializationGeolocation || null,
            photos: photos || [],
            items_data: {}
        };

        itemsResponses.forEach(item => {
            data.items_data[item.item_id] = item.response === 'yes';
        });
        
        return request(`/checklists/${checklistId}/complete`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    getChecklistCompletions(projectId, checklistType, options = {}) {
        return request(`/projects/${projectId}/checklists/${checklistType}/completions`, options);
    }

    getChecklistCompletionDetails(completionId) {
        return request(`/checklist-completions/${completionId}/details`);
    }

    approveChecklist(completionId, status, rejectionReason = null, document = null) {
        if (status === 'approved') {
            return request(`/checklist-completions/${completionId}/approve`, {
                method: 'POST',
                body: JSON.stringify({})
            });
        } else if (status === 'rejected') {
            return request(`/checklist-completions/${completionId}/reject`, {
                method: 'POST',
                body: JSON.stringify({
                    reason: rejectionReason || ''
                })
            });
        }
    }

    checkProjectAccess(projectId) {
        return request(`/projects/${projectId}/check-access`);
    }

    getPendingApprovals() {
        return request('/checklists/pending-approval');
    }

    getTodayCompletion(projectId, checklistId) {
        return request(`/projects/${projectId}/checklists/${checklistId}/today`);
    }

    updateChecklistCompletion(completionId, itemsResponses, notes, photos, geolocation) {
        const data = {
            responses: itemsResponses,
            notes: notes || '',
            photos: photos || [],
            geolocation: geolocation || null
        };
        
        return request(`/checklist-completions/${completionId}/update`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async downloadChecklist(completionId) {
        const token = AuthService.getToken();
        const response = await fetch(`${API_BASE_URL}/checklist-completions/${completionId}/export`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Не удалось скачать чек-лист');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `checklist_${completionId}.docx`;
        if (contentDisposition) {
            const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
            if (matches != null && matches[1]) {
                filename = matches[1].replace(/['"]/g, '');
            }
        }

        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }

    createWorkPlan(projectId, workPlanData) {
        return request(`/projects/${projectId}/work-plan`, {
            method: 'POST',
            body: JSON.stringify(workPlanData)
        });
    }

    getWorkPlan(projectId) {
        return request(`/projects/${projectId}/work-plan`);
    }

    updateWorkPlan(projectId, workPlanData) {
        return request(`/projects/${projectId}/work-plan`, {
            method: 'PUT',
            body: JSON.stringify(workPlanData)
        });
    }

    deleteWorkPlan(projectId) {
        return request(`/projects/${projectId}/work-plan`, {
            method: 'DELETE'
        });
    }

    importWorkPlan(projectId, file) {
        const formData = new FormData();
        formData.append('file', file);
        return request(`/projects/${projectId}/work-plan/import`, {
            method: 'POST',
            body: formData
        });
    }

    getWorkPlanItem(itemId) {
        return request(`/work-plan-items/${itemId}`);
    }

    updateWorkPlanItem(itemId, data) {
        return request(`/work-plan-items/${itemId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    addRequiredMaterial(itemId, materialId, plannedQuantity) {
        return request(`/work-plan-items/${itemId}/materials`, {
            method: 'POST',
            body: JSON.stringify({ material_id: materialId, planned_quantity: plannedQuantity })
        });
    }

    updateRequiredMaterial(itemId, materialId, plannedQuantity) {
        return request(`/work-plan-items/${itemId}/materials/${materialId}`, {
            method: 'PUT',
            body: JSON.stringify({ planned_quantity: plannedQuantity })
        });
    }

    deleteRequiredMaterial(itemId, materialId) {
        return request(`/work-plan-items/${itemId}/materials/${materialId}`, {
            method: 'DELETE'
        });
    }

    getMaterials() {
        return request('/materials');
    }

    createMaterial(materialData) {
        return request('/materials', {
            method: 'POST',
            body: JSON.stringify(materialData)
        });
    }

    // removed duplicate incorrect overload

    getRecognitionStatus(documentId) {
        return request(`/recognize/status/${documentId}`);
    }

    suggestProjectForTTN(documentId) {
        return request(`/ttn/${documentId}/suggest-project`, {
            method: 'POST'
        });
    }

    verifyAndProcessTTN(documentId, verifiedData, projectId) {
        return request(`/ttn/${documentId}/verify`, {
            method: 'POST',
            body: JSON.stringify({ verified_data: verifiedData, project_id: projectId })
        });
    }

    getMaterialDeliveries(projectId) {
        return request(`/projects/${projectId}/material-deliveries`);
    }

    getMaterialBalance(projectId) {
        return request(`/projects/${projectId}/material-balance`);
    }

    getMyWorkItems(projectId, status = null) {
        const url = status 
            ? `/projects/${projectId}/my-work-items?status=${status}`
            : `/projects/${projectId}/my-work-items`;
        return request(url);
    }

    reportWorkProgress(itemId, progress, materialsUsed) {
        return request(`/work-items/${itemId}/report-progress`, {
            method: 'POST',
            body: JSON.stringify({ progress, materials_used: materialsUsed })
        });
    }

    getWorkItemConsumptionLogs(itemId) {
        return request(`/work-items/${itemId}/consumption-logs`);
    }

    getAvailableMaterials(projectId) {
        return request(`/projects/${projectId}/available-materials`);
    }

    deleteConsumptionLog(logId) {
        return request(`/consumption-logs/${logId}`, {
            method: 'DELETE'
        });
    }

    getGanttChart(projectId) {
        return request(`/projects/${projectId}/gantt-chart`);
    }

    getMaterialPlanFact(projectId) {
        return request(`/projects/${projectId}/material-plan-fact`);
    }

    getRiskAnalysis(projectId) {
        return request(`/projects/${projectId}/risk-analysis`);
    }

    getNotifications(page = 1, per_page = 20, options = {}) {
        return request(`/notifications?page=${page}&per_page=${per_page}`, options);
    }

    getUnreadNotificationCount(options = {}) {
        return request(`/notifications/unread-count`, options);
    }

    markNotificationsAsRead(ids) {
        return request(`/notifications/mark-as-read`, {
            method: 'POST',
            body: JSON.stringify({ ids })
        });
    }

}

export default new ApiService();
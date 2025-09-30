import AuthService from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

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

    getProjects() {
        return request('/projects');
    }

    createProject(projectData) {
        return request('/projects', { 
            method: 'POST', 
            body: JSON.stringify(projectData) 
        });
    }

    getTasks(filters = {}) {
        const query = new URLSearchParams(filters).toString();
        return request(`/tasks?${query}`);
    }

    updateTaskStatus(projectId, taskId, status) {
        return request(`/projects/${projectId}/tasks/${taskId}`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });
    }

    verifyTask(projectId, taskId, status) {
        return request(`/projects/${projectId}/tasks/${taskId}/verify`, {
            method: 'POST',
            body: JSON.stringify({ status })
        });
    }

    getIssues(filters = {}) {
        const query = new URLSearchParams(filters).toString();
        return request(`/issues?${query}`);
    }

    createIssue(projectId, issueData) {
        return request(`/projects/${projectId}/issues`, {
            method: 'POST',
            body: JSON.stringify(issueData)
        });
    }

    getClassifiers(filters = {}) {
        const query = new URLSearchParams(filters).toString();
        return request(`/classifiers?${query}`);
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
}

export default new ApiService();
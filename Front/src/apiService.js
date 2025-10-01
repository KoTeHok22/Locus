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

    getProjectDetails(projectId) {
        return request(`/projects/${projectId}`);
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

    updateTaskStatus(projectId, taskId, status, photos, comment) {
        const formData = new FormData();
        formData.append('status', status);
        
        if (comment) {
            formData.append('comment', comment);
        }
        
        if (photos && photos.length > 0) {
            photos.forEach(photo => {
                formData.append('photos', photo);
            });
        }
        
        return request(`/projects/${projectId}/tasks/${taskId}`, {
            method: 'PATCH',
            body: formData
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

    getProjectDocuments(projectId) {
        return request(`/projects/${projectId}/documents`);
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
}

export default new ApiService();
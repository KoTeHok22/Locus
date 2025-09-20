const API_BASE_URL = 'http://localhost:5000';

class AuthService {
  async register(email, password) {
    const response = await fetch(`${API_BASE_URL}/api/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Ошибка регистрации');
    }
    
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    
    return data;
  }

  async login(email, password) {
    const response = await fetch(`${API_BASE_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Ошибка входа');
    }
    
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    
    return data;
  }

  logout() {
    localStorage.removeItem('token');
  }

  async inviteUser(email, role, token) {
    const response = await fetch(`${API_BASE_URL}/api/invite-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ email, role }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Ошибка приглашения');
    }
    
    return data;
  }

  async setPassword(token, password) {
    const response = await fetch(`${API_BASE_URL}/api/set-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, password }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Ошибка установки пароля');
    }
    
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    
    return data;
  }

  async getProfile(token) {
    const response = await fetch(`${API_BASE_URL}/api/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Ошибка получения профиля');
    }
    
    return data;
  }

  isAuthenticated() {
    const token = this.getToken();
    return !!token;
  }

  getToken() {
    return localStorage.getItem('token');
  }

  getUserRole() {
    const token = this.getToken();
    if (!token) return null;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role;
    } catch (error) {
      return null;
    }
  }
}

export default new AuthService();
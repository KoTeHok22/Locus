import '../../index.css'
import authService from '../../authService.js'
import { useState, useEffect } from 'react'

function Dashboard({onSwitchToLogin}) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = authService.getToken();
                if (!token) {
                    onSwitchToLogin();
                    return;
                }
                
                const profile = await authService.getProfile(token);
                setUser(profile.user);
            } catch (err) {
                setError('Ошибка загрузки профиля');
                onSwitchToLogin();
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [onSwitchToLogin]);

    const handleLogout = () => {
        authService.logout();
        onSwitchToLogin();
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl">Загрузка...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl text-red-500">{error}</div>
            </div>
        );
    }

    return (
        <div className="w-full bg-gray-50">
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-900">Locus Dashboard</h1>
                    <div className="flex items-center space-x-4">
                        <span className="text-gray-700">Добро пожаловать, {user?.email}</span>
                        <button
                            onClick={handleLogout}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Выйти
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-2xl font-semibold mb-4">Панель управления</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-blue-50 p-6 rounded-lg">
                            <h3 className="text-lg font-medium text-blue-800 mb-2">Ваши проекты</h3>
                            <p className="text-blue-600">Управление строительными проектами</p>
                        </div>
                        
                        <div className="bg-green-50 p-6 rounded-lg">
                            <h3 className="text-lg font-medium text-green-800 mb-2">Отчеты</h3>
                            <p className="text-green-600">Просмотр и экспорт отчетов</p>
                        </div>
                        
                        <div className="bg-purple-50 p-6 rounded-lg">
                            <h3 className="text-lg font-medium text-purple-800 mb-2">Настройки</h3>
                            <p className="text-purple-600">Управление аккаунтом и настройками</p>
                        </div>
                    </div>
                    
                    <div className="mt-8">
                        <h3 className="text-xl font-semibold mb-4">Информация о пользователе</h3>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p><strong>Email:</strong> {user?.email}</p>
                            <p><strong>Роль:</strong> {user?.role}</p>
                            <p><strong>Статус:</strong> {user?.is_active ? 'Активен' : 'Неактивен'}</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export { Dashboard };
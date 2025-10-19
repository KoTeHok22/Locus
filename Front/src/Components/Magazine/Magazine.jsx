import '../../index.css'
import { useState, useEffect } from 'react';
import { NotificationIcon } from '../Notification/NotificationIcon';
import { Notifications } from '../Notification/Notifications';
import { useNotifications } from '../Notification/useNotification';
import { ForemanDHB } from '../Dashboards/ForemanDHB.jsx';
import InspectorDHB from '../Dashboards/InspectorDHB/InspectorDHB.jsx';
import { ManagerDHB } from '../Dashboards/ManagerDHB.jsx';
import { ObjectList } from '../ObjectList/ObjectList';
import authService from '../../authService.js';

function Magazine({ onLogout, userRole }) {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const mockNotifications = [
        { id: 1, title: 'Новое сообщение', text: 'У вас новое сообщение от службы строительного контроля (заказчика)', time: '5 мин назад', unread: true },
        { id: 2, title: 'Обновление системы', text: 'Система была обновлена до версии 2.1', time: '1 час назад', unread: true },
        { id: 3, title: 'Напоминание', text: 'Не забудьте проверить отчёты', time: '2 часа назад', unread: false },
    ];

    const {
        notifications,
        isNotificationsOpen,
        unreadCount,
        toggleNotifications,
        closeNotifications
    } = useNotifications(mockNotifications);

    const renderDashboardContent = () => {
        switch (userRole) {
            case 'client':
                return <ManagerDHB />;
            case 'foreman':
                return <ForemanDHB />;
            case 'inspector':
                return <InspectorDHB />;
            default:
                return <ManagerDHB />;
        }
    };

    const getRoleInfo = (role) => {
        const roleInfo = {
            'client': { title: 'Дашборд Службы строительного контроля', subtitle: 'Система управления объектами' },
            'foreman': { title: 'Боевой пост', subtitle: 'Управление объектом' },
            'inspector': { title: 'Карта нарушений', subtitle: 'Контроль соответствия нормам' }
        };
        return roleInfo[role] || roleInfo['client'];
    }

    const [userInfo, setUserInfo] = useState({ initials: '', name: '', position: '' });

    useEffect(() => {
        const fetchProfile = async () => {
            const token = authService.getToken();
            if (token) {
                try {
                    const data = await authService.getProfile(token);
                    const user = data.user;
                    setUserInfo({
                        initials: `${user.first_name[0]}${user.last_name[0]}`,
                        name: `${user.first_name} ${user.last_name}`,
                        position: user.role
                    });
                } catch (error) {
                    console.error("Failed to fetch profile", error);
                }
            }
        };

        fetchProfile();
    }, []);

    const handleLogout = () => {
        authService.logout();
        if (onLogout) onLogout();
    };

    const navigationItems = [
        { key: 'dashboard', label: 'Дашборд', icon: 'fa-home' },
        { key: 'objectList', label: 'Список объектов', icon: 'fa-list' },
        { key: 'map', label: 'Карта', icon: 'fa-map-marked-alt' },
        { key: 'analytics', label: 'Аналитика', icon: 'fa-chart-bar' },
        { key: 'settings', label: 'Настройки', icon: 'fa-cog' }
    ];

    const currentRoleInfo = getRoleInfo(userRole);

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return renderDashboardContent();
            case 'objectList':
                return <ObjectList />;
            default:
                return (
                    <div className="p-6 h-full flex items-center justify-center" id="other-sections">
                        <div className="text-center">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                                {navigationItems.find(item => item.key === activeTab)?.label}
                            </h2>
                            <p className="text-gray-600">Раздел в разработке</p>
                        </div>
                    </div>
                );
        }
    };

    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.classList.add('sidebar-open');
        } else {
            document.body.classList.remove('sidebar-open');
        }
    }, [isMobileMenuOpen]);

    return (
        <div className={`h-screen bg-slate-50 flex ${isMobileMenuOpen ? 'sidebar-open' : ''}`}>
            <div className="sidebar-overlay fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>
            
            <aside className="mobile-sidebar fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-slate-200 shadow-sm lg:relative lg:translate-x-0 lg:z-auto">
                <div className="flex flex-col h-full">
                    <div className="lg:hidden p-4 border-b border-slate-200">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-semibold text-sm">СК</span>
                            </div>
                            <div>
                                <h2 className="font-semibold text-gray-900">Меню</h2>
                            </div>
                        </div>
                    </div>

                    <nav className="flex-1 p-4">
                        <div className="space-y-1">
                            {navigationItems.map(item => (
                                <button 
                                    key={item.key}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg transition-colors ${activeTab === item.key ? 'text-blue-600 font-medium bg-blue-50' : 'text-gray-700 hover:bg-gray-50'}`}
                                    onClick={() => {
                                        setActiveTab(item.key);
                                        setIsMobileMenuOpen(false);
                                    }}
                                >
                                    <i className={`fas ${item.icon} text-xl`}></i>
                                    <span>{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </nav>

                    <div className="p-4 border-t border-slate-200">
                        <div className="text-xs text-gray-500">
                            © 2025 Система контроля
                        </div>
                    </div>
                </div>
            </aside>

            <div className="flex-1 flex flex-col">
                <header className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button id="menu-toggle" className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-full" onClick={() => setIsMobileMenuOpen(true)}>
                                <i className="fas fa-bars"></i>
                            </button>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                    <span className="text-white font-semibold text-sm">СК</span>
                                </div>
                                <div>
                                    <h1 id="role-title" className="font-semibold text-gray-900">{currentRoleInfo.title}</h1>
                                    <p id="role-subtitle" className="text-sm text-gray-500 hidden sm:block">{currentRoleInfo.subtitle}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className='relative'>
                                <NotificationIcon 
                                    unreadCount={unreadCount}
                                    onClick={toggleNotifications}
                                />
                                <Notifications 
                                    isOpen={isNotificationsOpen}
                                    onClose={closeNotifications}
                                    notifications={notifications}
                                />
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                    <span id="user-initials" className="text-blue-600 text-sm font-medium">{userInfo.initials}</span>
                                </div>
                                <div className="hidden sm:block">
                                    <p id="user-name" className="text-sm font-medium text-gray-900">{userInfo.name}</p>
                                    <p id="user-position" className="text-xs text-gray-500">{userInfo.position}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
}

export { Magazine };
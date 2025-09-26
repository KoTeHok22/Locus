import '../../index.css'
import { useState } from 'react';
import { RoleSelector } from '../RoleSelector/RoleSelector.jsx';
import { NotificationIcon } from '../Notification/NotificationIcon';
import { Notifications } from '../Notification/Notifications';
import { useNotifications } from '../Notification/useNotification';
import { ForemanDHB } from '../Dashboards/ForemanDHB.jsx';
import { InspectorDHB } from '../Dashboards/InspectorDHB.jsx';
import { ManagerDHB } from '../Dashboards/ManagerDHB.jsx';
import authService from '../../authService.js';

function Magazine({ onLogout }) {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState('managerDHB'); // Состояние для выбранной роли

    const mockNotifications = [
        { id: 1, title: 'Новое сообщение', text: 'У вас новое сообщение от менеджера', time: '5 мин назад', unread: true },
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

    // Функция для изменения роли
    const handleRoleChange = (newRole) => {
        console.log('Changing role to:', newRole);
        setSelectedRole(newRole);
    };

    // Функция рендеринга контента в зависимости от роли
    const renderDashboardContent = () => {
        console.log('Rendering dashboard for role:', selectedRole);
        
        switch (selectedRole) {
            case 'managerDHB':
                return <ManagerDHB />;
            case 'foremanDHB':
                return <ForemanDHB />;
            case 'inspectorDHB':
                return <InspectorDHB />;
            default:
                return <ManagerDHB />;
        }
    };

    // Главная функция рендеринга контента
    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <div>
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg hidden">
                            <h3 className="text-lg font-semibold text-blue-800">
                                Дашборд - {getRoleName(selectedRole)}
                            </h3>
                            <p className="text-blue-600">Текущая роль: {selectedRole}</p>
                        </div>
                        {renderDashboardContent()}
                    </div>
                );
            case 'objectList':
                return (
                    <div>
                        <h2 className="text-xl font-bold mb-4">Список объектов</h2>
                        <p>Роль: {getRoleName(selectedRole)}</p>
                        {/* Контент для списка объектов */}
                    </div>
                );
            case 'map':
                return (
                    <div>
                        <h2 className="text-xl font-bold mb-4">Карта объектов</h2>
                        <p>Роль: {getRoleName(selectedRole)}</p>
                        {/* Контент для карты */}
                    </div>
                );
            case 'reports':
                return (
                    <div>
                        <h2 className="text-xl font-bold mb-4">Отчёты</h2>
                        <p>Роль: {getRoleName(selectedRole)}</p>
                        {/* Контент для отчётов */}
                    </div>
                );
            case 'analytics':
                return (
                    <div>
                        <h2 className="text-xl font-bold mb-4">Аналитика</h2>
                        <p>Роль: {getRoleName(selectedRole)}</p>
                        {/* Контент для аналитики */}
                    </div>
                );
            case 'settings':
                return (
                    <div>
                        <h2 className="text-xl font-bold mb-4">Настройки</h2>
                        <p>Роль: {getRoleName(selectedRole)}</p>
                        {/* Контент для настроек */}
                    </div>
                );
            default:
                return (
                    <div>
                        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                            <h3 className="text-lg font-semibold">Дашборд по умолчанию</h3>
                        </div>
                        <ManagerDHB />
                    </div>
                );
        }
    };

    // Вспомогательная функция для получения имени роли
    const getRoleName = (role) => {
        switch (role) {
            case 'managerDHB': return 'Менеджер';
            case 'foremanDHB': return 'Прораб';
            case 'inspectorDHB': return 'Инспектор';
            default: return 'Менеджер';
        }
    };

    const handleLogout = () => {
        authService.logout();
        if (onLogout) onLogout();
    };

    const navigationItems = [
        { key: 'dashboard', label: 'Дашборд' },
        { key: 'objectList', label: 'Список объектов' },
        { key: 'map', label: 'Карта' },
        { key: 'reports', label: 'Отчёты' },
        { key: 'analytics', label: 'Аналитика' },
        { key: 'settings', label: 'Настройки' }
    ];

    return (
        <div className='size-full absolute'>
            {/* Header */}
            <div className='w-full h-[10%] bg-white border-b-[1px] border-gray-200 flex items-center justify-between px-4 md:px-6'>
                <div className='text-xl font-bold'>Locus</div>

                {/* RoleSelector - передаем текущую роль и функцию для ее изменения */}
                <RoleSelector 
                    selectedRole={selectedRole}
                    onRoleChange={handleRoleChange}
                />
                
                <div className='flex items-center space-x-4'>
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

                    <button 
                        onClick={handleLogout}
                        className='hidden md:block text-sm text-gray-600 hover:text-gray-900'
                    >
                        Выйти
                    </button>

                    <button 
                        className='md:hidden p-2 rounded-full hover:bg-gray-100' 
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" 
                                strokeWidth="2" d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}/>
                        </svg>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className='flex h-[90%]'>
                {/* Sidebar */}
                <div className='
                    hidden md:flex md:h-full md:w-[20%] 
                    flex-col bg-gray-50 border-r-[1px] border-gray-200 p-4 space-y-2
                '>
                    {navigationItems.map((item) => (
                        <button 
                            key={item.key}
                            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                                activeTab === item.key 
                                    ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-500' 
                                    : 'text-gray-700 hover:bg-gray-100'
                            }`}
                            onClick={() => setActiveTab(item.key)}
                        >
                            {item.label}
                        </button>
                    ))}
                    
                    <button 
                        onClick={handleLogout}
                        className='w-full text-left px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 mt-auto'
                    >
                        Выйти
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className='
                        absolute top-[10%] left-0 right-0 bg-white border-b border-gray-200 
                        md:hidden z-40 shadow-lg
                    '>
                        <div className='flex flex-col p-2 space-y-1'>
                            {navigationItems.map((item) => (
                                <button 
                                    key={item.key}
                                    className='w-full text-left px-4 py-3 rounded-lg bg-gray-50 hover:bg-gray-100 border-b border-gray-200 last:border-b-0 transition-colors'
                                    onClick={() => { 
                                        setActiveTab(item.key); 
                                        setIsMobileMenuOpen(false); 
                                    }}
                                >
                                    {item.label}
                                </button>
                            ))}
                            
                            <button 
                                onClick={() => { 
                                    handleLogout(); 
                                    setIsMobileMenuOpen(false); 
                                }}
                                className='w-full text-left px-4 py-3 rounded-lg bg-gray-50 hover:bg-gray-100 border-b border-gray-200 last:border-b-0 transition-colors text-red-600'
                            >
                                Выйти
                            </button>
                        </div>
                    </div>
                )}

                {/* Content Area */}
                <div className='
                    flex-1 h-full bg-gray-100 overflow-auto
                    p-4 md:p-6
                '>
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}

export { Magazine };
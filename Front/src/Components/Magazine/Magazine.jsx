import '../../index.css'
import { useNavigation } from './useNavigation';
import { MobileNavButton } from './MobileNavButton';
import { NavButton } from './NavButton';
import { useState } from 'react';
import { DashboardSelector } from '../DashboardSelector/DasboardSelector';
import { NotificationIcon } from '../Notification/NotificationIcon';
import { Notifications } from '../Notification/Notifications';
import { useNotifications } from '../Notification/useNotification';


function Magazine() {

    // Состояния для управления навигацией
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

    // Функция для отображения контента
    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <div>Контент Дашборда</div>;
            case 'objectList':
                return <div>Список объектов</div>;
            case 'map':
                return <div>Карта объектов</div>;
            case 'reports':
                return <div>Отчёты</div>;
            case 'analytics':
                return <div>Аналитика</div>;
            case 'settings':
                return <div>Настройки</div>;
            default:
                return <div>Дашборд</div>;
        }
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
            <div className='w-full h-[10%] bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6'>
                <div className='text-xl font-bold'>Locus</div>
                
                {/* Правая часть header */}
                <div className='flex items-center space-x-4'>
                    
                    {/* Иконка уведомлений */}
                    <div className='relative'>
                        <NotificationIcon 
                            unreadCount={unreadCount}
                            onClick={toggleNotifications}
                        />
                        
                        {/* Окно уведомлений */}
                        <Notifications 
                            isOpen={isNotificationsOpen}
                            onClose={closeNotifications}
                            notifications={notifications}
                        />
                    </div>

                    {/* Mobile menu button */}
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

            {/* Main content */}
            <div className='flex h-[90%]'>

                {/* Navigation - Desktop */}
                <div className='
                    hidden md:flex md:h-full md:w-[20%] 
                    flex-col bg-gray-50 border-r border-gray-200 p-4 space-y-2
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
                </div>

                {/* Mobile Navigation Menu */}
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
                        </div>
                    </div>
                )}

                {/* Content Area */}
                <div className='
                    flex-1 h-full bg-white overflow-auto
                    p-4 md:p-6
                '>
                    {renderContent()}
                </div>

            </div>

        </div>
    );
}

export { Magazine };
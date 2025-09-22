import "../../index.css"
import { useState } from "react";
import { useEffect } from "react";

function Notifications ({ isOpen, onClose, notifications: initialNotifications    }){

    const [notifications, setNotifications] = useState(initialNotifications || []);

    // Обновляем уведомления при изменении пропса
        useEffect(() => {
            setNotifications(initialNotifications || []);
        }, [initialNotifications]);

        const unreadCount = notifications.filter(n => n.unread).length;

        const markAsRead = (id) => {
            setNotifications(notifications.map(notification =>
                notification.id === id ? { ...notification, unread: false } : notification
            ));
        };

        const markAllAsRead = () => {
            setNotifications(notifications.map(notification => ({
                ...notification,
                unread: false
            })));
        };

        if (!isOpen) return null;

    return(
        <>
        
            {/* Overlay */}
            <div 
                className='fixed inset-0 z-40'
                onClick={onClose}
            />
            
            {/* Окно уведомлений */}
            <div className='absolute right-0 top-full mt-2 w-80 md:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50'>
                
                {/* Заголовок */}
                <div className='p-4 border-b border-gray-200 flex justify-between items-center'>
                    <div className='flex items-center space-x-2'>
                        <h3 className='font-semibold text-lg'>Уведомления</h3>
                        {unreadCount > 0 && (
                            <span className='bg-red-500 text-white text-xs rounded-full px-2 py-1'>
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    <div className='flex items-center space-x-2'>
                        {unreadCount > 0 && (
                            <button 
                                onClick={markAllAsRead}
                                className='text-sm text-blue-600 hover:text-blue-700'
                            >
                                Прочитать все
                            </button>
                        )}
                        <button 
                            onClick={onClose}
                            className='text-gray-400 hover:text-gray-600 p-1'
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Список уведомлений */}
                <div className='max-h-96 overflow-y-auto'>
                    {notifications.length > 0 ? (
                        notifications.map((notification) => (
                            <div 
                                key={notification.id}
                                className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                                    notification.unread ? 'bg-blue-50' : ''
                                }`}
                                onClick={() => {
                                    markAsRead(notification.id);
                                    onClose();
                                }}
                            >
                                <div className='flex justify-between items-start mb-1'>
                                    <span className={`font-medium ${
                                        notification.unread ? 'text-blue-600' : 'text-gray-700'
                                    }`}>
                                        {notification.title}
                                    </span>
                                    {notification.unread && (
                                        <span className='w-2 h-2 bg-blue-500 rounded-full'></span>
                                    )}
                                </div>
                                <p className='text-sm text-gray-600 mb-2'>{notification.text}</p>
                                <span className='text-xs text-gray-400'>{notification.time}</span>
                            </div>
                        ))
                    ) : (
                        <div className='p-8 text-center text-gray-500'>
                            <svg className="w-12 h-12 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                    d="M15 17h5l-5 5-5-5h5V7a5 5 0 1110 0v10h-5z"/>
                            </svg>
                            <p>Нет новых уведомлений</p>
                        </div>
                    )}
                </div>

                {/* Футер */}
                <div className='p-3 border-t border-gray-200 bg-gray-50 rounded-b-lg'>
                    <button className='w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium'>
                        Показать все уведомления
                    </button>
                </div>
            </div>
        </>
        
    )

}


export { Notifications }
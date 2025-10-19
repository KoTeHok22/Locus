import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle, Clock, X } from 'lucide-react';
import ApiService from '../../apiService';

const NotificationDropdown = ({ onClose, onUnreadCountChange }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (window.innerWidth >= 640 && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const data = await ApiService.getNotifications();
                setNotifications(data.notifications || []);
                
                const unreadIds = data.notifications
                    .filter(n => !n.is_read)
                    .map(n => n.id);
                
                if (unreadIds.length > 0) {
                    await ApiService.markNotificationsAsRead(unreadIds);
                    onUnreadCountChange(0);
                }
            } catch (error) {
                console.error('Failed to fetch notifications:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();
    }, [onUnreadCountChange]);

    const handleNotificationClick = (notification) => {
        if (notification.link) {
            navigate(notification.link);
            onClose();
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'только что';
        if (diffMins < 60) return `${diffMins} мин назад`;
        if (diffHours < 24) return `${diffHours} ч назад`;
        if (diffDays < 7) return `${diffDays} дн назад`;
        
        return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    };

    return (
        <div
            ref={dropdownRef}
            className="fixed inset-0 z-[100] flex flex-col bg-white sm:absolute sm:inset-auto sm:right-0 sm:mt-3 sm:w-96 sm:max-w-[calc(100vw-2rem)] sm:rounded-2xl sm:border sm:border-slate-200 sm:shadow-xl sm:shadow-slate-500/10"
        >
            <div className="border-b border-slate-200 px-4 py-3 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-slate-900">Уведомления</h3>
                <button onClick={onClose} className="sm:hidden p-1 text-slate-500 hover:text-slate-700">
                    <X size={18} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto sm:max-h-[400px]">
                {loading ? (
                    <div className="flex items-center justify-center p-8">
                        <div className="text-center">
                            <Clock size={24} className="mx-auto text-slate-400 animate-spin" />
                            <p className="mt-2 text-sm text-slate-500">Загрузка...</p>
                        </div>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex items-center justify-center p-8">
                        <div className="text-center">
                            <Bell size={32} className="mx-auto text-slate-300" />
                            <p className="mt-2 text-sm text-slate-500">Нет уведомлений</p>
                        </div>
                    </div>
                ) : (
                    <div>
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification)}
                                className={`border-b border-slate-100 px-4 py-3 transition-colors ${
                                    notification.link
                                        ? 'cursor-pointer hover:bg-slate-50'
                                        : ''
                                } ${
                                    !notification.is_read
                                        ? 'bg-blue-50/50'
                                        : 'bg-white'
                                }`}
                            >
                                <div className="flex gap-3">
                                    <div className="flex-shrink-0">
                                        <div className={`rounded-full p-2 ${
                                            !notification.is_read
                                                ? 'bg-blue-100 text-blue-600'
                                                : 'bg-slate-100 text-slate-500'
                                        }`}>
                                            {!notification.is_read ? (
                                                <Bell size={14} />
                                            ) : (
                                                <CheckCircle size={14} />
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-slate-900 leading-relaxed">
                                            {notification.message}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            {formatTime(notification.created_at)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {!loading && (
                <div className="border-t border-slate-200 px-4 py-2">
                    <button
                        onClick={() => {
                            navigate('/notifications');
                            onClose();
                        }}
                        className="w-full rounded-lg py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50"
                    >
                        Вся история
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full rounded-lg py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 mt-1 hidden sm:block"
                    >
                        Закрыть
                    </button>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;

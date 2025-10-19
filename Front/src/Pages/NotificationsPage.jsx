import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, Clock } from 'lucide-react';
import ApiService from '../apiService';

const NotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const data = await ApiService.getNotifications();
                setNotifications(data.notifications || []);
            } catch (error) {
                console.error('Failed to fetch notifications:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();
    }, []);

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h1 className="text-2xl font-semibold text-slate-900 mb-6">История уведомлений</h1>

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
                <div className="space-y-4">
                    {notifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={`border-b border-slate-100 p-4 rounded-lg ${
                                !notification.is_read ? 'bg-blue-50/50' : 'bg-white'
                            }`}
                        >
                            <div className="flex gap-3">
                                <div className="flex-shrink-0">
                                    <div className={`rounded-full p-2 ${
                                        !notification.is_read
                                            ? 'bg-blue-100 text-blue-600'
                                            : 'bg-slate-100 text-slate-500'
                                    }`}>
                                        {!notification.is_read ? <Bell size={14} /> : <CheckCircle size={14} />}
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-slate-900 leading-relaxed">
                                        {notification.message}
                                    </p>
                                    <div className="mt-2 flex items-center justify-between">
                                        <p className="text-xs text-slate-500">
                                            Отправлено: {formatTime(notification.created_at)}
                                        </p>
                                        <p className={`text-xs font-semibold ${!notification.is_read ? 'text-blue-600' : 'text-green-600'}`}>
                                            {!notification.is_read ? 'Не прочитано' : 'Прочитано'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NotificationsPage;

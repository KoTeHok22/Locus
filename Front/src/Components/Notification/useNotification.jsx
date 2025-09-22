// hooks/useNotifications.js
import { useState } from 'react';

export function useNotifications(initialNotifications = []) {
    const [notifications, setNotifications] = useState(initialNotifications);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

    const unreadCount = notifications.filter(n => n.unread).length;

    const addNotification = (notification) => {
        setNotifications(prev => [{
            id: Date.now(),
            time: 'Только что',
            unread: true,
            ...notification
        }, ...prev]);
    };

    const markAsRead = (id) => {
        setNotifications(prev => prev.map(notification =>
            notification.id === id ? { ...notification, unread: false } : notification
        ));
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(notification => ({
            ...notification,
            unread: false
        })));
    };

    const toggleNotifications = () => {
        setIsNotificationsOpen(prev => !prev);
    };

    const closeNotifications = () => {
        setIsNotificationsOpen(false);
    };

    return {
        notifications,
        isNotificationsOpen,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        toggleNotifications,
        closeNotifications
    };
}
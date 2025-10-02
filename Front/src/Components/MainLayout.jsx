import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, List, Map, FileText, Menu, Bell } from 'lucide-react';
import AuthService from "../authService.js";
import logo from '../logo/logo-mini.ico';
import { translate } from '../utils/translation.js';
import { MobileBottomNav } from './MobileBottomNav.jsx';

const navigationItems = [
    { key: '/', label: 'Дашборд', icon: Home },
    { key: '/projects', label: 'Объекты', icon: List },
    { key: '/map', label: 'Карта', icon: Map },
    { key: '/reports', label: 'Отчёты', icon: FileText, roles: ['client', 'foreman'] },
];

const UserMenu = ({ user, onLogout }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 rounded-full bg-slate-100/70 hover:bg-slate-100 px-2.5 py-1.5 transition-colors"
            >
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                    {user.initials || '??'}
                </div>
                <div className="hidden sm:block text-left">
                    <p className="text-sm font-semibold text-gray-900">{user.name || '—'}</p>
                    <p className="text-xs text-gray-500 capitalize">{translate(user.role) || 'роль не назначена'}</p>
                </div>
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-3 w-48 rounded-2xl border border-slate-100 bg-white shadow-xl shadow-slate-500/10 z-20">
                    <button
                        onClick={onLogout}
                        className="block w-full rounded-2xl px-4 py-3 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-slate-50"
                    >
                        Выход
                    </button>
                </div>
            )}
        </div>
    );
};

const MainLayout = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [userInfo, setUserInfo] = useState({ initials: '', name: '', role: '' });
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            const token = AuthService.getToken();
            if (token) {
                try {
                    const data = await AuthService.getProfile(token);
                    const user = data.user;
                    setUserInfo({
                        initials: `${user.first_name[0] || ''}${user.last_name[0] || ''}`,
                        name: `${user.first_name} ${user.last_name}`,
                        role: user.role
                    });
                } catch (error) {
                    console.error("Failed to fetch profile", error);
                    handleLogout();
                }
            }
        };
        fetchProfile();
    }, []);

    const handleLogout = () => {
        AuthService.logout();
        navigate('/login');
    };

    const availableNavigation = navigationItems.filter(item => !item.roles || item.roles.includes(userInfo.role));
    const currentNav = availableNavigation.find(item => item.key === location.pathname);

    return (
        <div className={`h-screen bg-slate-50 flex relative ${isSidebarOpen ? 'sidebar-open' : ''}`}>
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <aside
                className={`mobile-sidebar fixed inset-y-0 left-0 z-50 w-72 max-w-full bg-white border-r border-slate-200 shadow-xl shadow-slate-600/10 transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 lg:shadow-none lg:flex lg:flex-col ${
                    isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between gap-3 p-5 border-b border-slate-200">
                        <div className="flex items-center gap-3">
                            <img src={logo} alt="Locus Logo" className="w-9 h-9 rounded-lg" />
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900 leading-tight">Locus</h2>
                                <p className="text-xs text-gray-500">Контроль строительства</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:text-slate-900"
                            aria-label="Закрыть меню"
                        >
                            <Menu size={18} />
                        </button>
                    </div>

                    <nav className="flex-1 overflow-y-auto px-4 py-6">
                        <div className="space-y-1">
                            {availableNavigation.map(item => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.key;
                                return (
                                    <Link
                                        key={item.key}
                                        to={item.key}
                                        onClick={() => setIsSidebarOpen(false)}
                                        className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                                            isActive
                                                ? 'bg-blue-50 text-blue-600 shadow-sm shadow-blue-200'
                                                : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
                                        }`}
                                    >
                                        <span className={`flex h-9 w-9 items-center justify-center rounded-lg border ${
                                            isActive
                                                ? 'border-blue-200 bg-white text-blue-600'
                                                : 'border-transparent bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-blue-600'
                                        }`}>
                                            <Icon size={18} />
                                        </span>
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </nav>

                    <div className="border-t border-slate-200 p-5">
                        <div className="rounded-xl bg-slate-50 p-4">
                            <p className="text-xs text-slate-500">© 2024 Locus</p>
                            <p className="text-xs text-slate-400">Интеллектуальная платформа контроля</p>
                        </div>
                    </div>
                </div>
            </aside>

            <div className="flex-1 flex flex-col lg:pl-0">
                <header className="bg-white border-b border-slate-200 px-4 py-3 shadow-sm md:px-6">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsSidebarOpen(prev => !prev)}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:border-blue-200 hover:text-blue-600 lg:hidden"
                                aria-label="Открыть меню"
                            >
                                <Menu size={20} />
                            </button>
                            <div className="flex items-center gap-3">
                                <div className="hidden lg:flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-1.5">
                                    <img src={logo} alt="Locus Logo" className="w-6 h-6" />
                                    <span className="text-sm font-semibold text-blue-700">Locus</span>
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-slate-500">{translate(userInfo.role) || 'Дашборд'}</p>
                                    <h1 className="text-lg font-semibold text-slate-900 leading-snug">
                                        {currentNav?.label || 'Панель управления'}
                                    </h1>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:border-blue-200 hover:text-blue-600"
                                aria-label="Уведомления"
                            >
                                <Bell size={18} />
                                <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                                    3
                                </span>
                            </button>
                            <UserMenu user={userInfo} onLogout={handleLogout} />
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto px-4 pb-24 pt-4 md:px-6 md:pb-8 md:pt-6">
                    {children}
                </main>
            </div>

            <MobileBottomNav items={availableNavigation} />
        </div>
    );
};

export { MainLayout };
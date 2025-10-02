import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthService from "../authService.js";
import logo from '../logo/logo-mini.ico';
import { translate } from '../utils/translation.js';

const navigationItems = [
    { key: '/', label: 'Дашборд', icon: 'fa-home' },
    { key: '/projects', label: 'Объекты', icon: 'fa-list' },
    { key: '/map', label: 'Карта', icon: 'fa-map-marked-alt' },
    { key: '/reports', label: 'Отчёты', icon: 'fa-file-alt', roles: ['client', 'foreman'] },
];

const UserMenu = ({ user, onLogout }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-medium">{user.initials}</span>
                </div>
                <div className="hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{translate(user.role)}</p>
                </div>
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20">
                    <button
                        onClick={onLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
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

    return (
        <div className="h-screen bg-slate-50 flex">
            <aside className="w-64 bg-white border-r border-slate-200 flex-col hidden lg:flex">
                <div className="flex items-center gap-3 p-4 border-b border-slate-200">
                    <img src={logo} alt="Locus Logo" className='w-8 h-8' />
                    <h2 className="font-bold text-xl text-gray-900">Locus</h2>
                </div>
                <nav className="flex-1 p-4">
                    <div className="space-y-1">
                        {navigationItems
                            .filter(item => !item.roles || item.roles.includes(userInfo.role))
                            .map(item => (
                            <Link
                                key={item.key}
                                to={item.key}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg transition-colors ${
                                    location.pathname === item.key
                                        ? 'text-blue-600 font-medium bg-blue-50'
                                        : 'text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <i className={`fas ${item.icon} w-6 text-center text-lg`}></i>
                                <span>{item.label}</span>
                            </Link>
                        ))}
                    </div>
                </nav>
            </aside>

            <div className="flex-1 flex flex-col">
                <header className="bg-white border-b border-slate-200 px-6 py-3 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                        </div>
                        <UserMenu user={userInfo} onLogout={handleLogout} />
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    );
};

export { MainLayout };
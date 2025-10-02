import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const MobileBottomNav = ({ items }) => {
    const location = useLocation();
    const navigate = useNavigate();

    if (!items || items.length === 0) {
        return null;
    }

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur">
            <div className="flex">
                {items.map(item => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.key;

                    return (
                        <button
                            key={item.key}
                            onClick={() => navigate(item.key)}
                            className={`flex-1 py-3 text-xs font-medium transition-colors ${
                                isActive ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <div className="flex flex-col items-center gap-1">
                                <span className={`flex h-9 w-9 items-center justify-center rounded-full border ${
                                    isActive
                                        ? 'border-blue-200 bg-white'
                                        : 'border-transparent bg-slate-100'
                                }`}>
                                    <Icon size={20} />
                                </span>
                                <span className="leading-tight">{item.label}</span>
                            </div>
                        </button>
                    );
                })}
            </div>
            <div className="h-[env(safe-area-inset-bottom)]" />
        </nav>
    );
};

export { MobileBottomNav };

// components/NotificationIcon.jsx
export function NotificationIcon({ unreadCount, onClick, className = '' }) {
    return (
        <button 
            className={`relative p-2 rounded-full hover:bg-gray-100 transition-colors ${className}`}
            onClick={onClick}
        >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                      d="M15 17h5l-5 5-5-5h5V7a5 5 0 1110 0v10h-5z"/>
            </svg>
            {unreadCount > 0 && (
                <span className='absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center'>
                    {unreadCount > 9 ? '9+' : unreadCount}
                </span>
            )}
        </button>
    );
}
import '../../index.css'

function RoleSelector({ selectedRole, onRoleChange }) {
    
    // Функции для обработки нажатия на кнопки
    const handleManagerClick = () => {
        console.log('Manager button clicked');
        onRoleChange('managerDHB');
    };

    const handleForemanClick = () => {
        console.log('Foreman button clicked');
        onRoleChange('foremanDHB');
    };

    const handleInspectorClick = () => {
        console.log('Inspector button clicked');
        onRoleChange('inspectorDHB');
    };

    return (
        <div className="w-auto max-w-md">
            <div className="flex bg-gray-100 rounded-lg p-1">
                <button 
                    onClick={handleManagerClick}
                    className={`flex-1 py-2 px-3 rounded-md transition-colors text-xs md:text-sm ${
                        selectedRole === 'managerDHB' 
                            ? 'bg-white shadow-sm text-gray-900 font-medium' 
                            : 'bg-transparent hover:bg-white/50 text-gray-600'
                    }`}
                >
                    <i className="fas fa-users mr-1 md:mr-2"></i>
                    Менеджер
                </button>
                
                <button 
                    onClick={handleForemanClick}
                    className={`flex-1 py-2 px-3 rounded-md transition-colors text-xs md:text-sm ${
                        selectedRole === 'foremanDHB' 
                            ? 'bg-white shadow-sm text-gray-900 font-medium' 
                            : 'bg-transparent hover:bg-white/50 text-gray-600'
                    }`}
                >
                    <i className="fas fa-hard-hat mr-1 md:mr-2"></i>
                    Прораб
                </button>
                
                <button 
                    onClick={handleInspectorClick}
                    className={`flex-1 py-2 px-3 rounded-md transition-colors text-xs md:text-sm ${
                        selectedRole === 'inspectorDHB' 
                            ? 'bg-white shadow-sm text-gray-900 font-medium' 
                            : 'bg-transparent hover:bg-white/50 text-gray-600'
                    }`}
                >
                    <i className="fas fa-shield-alt mr-1 md:mr-2"></i>
                    Инспектор
                </button>
            </div>
            
        </div>
    );
}

export { RoleSelector };
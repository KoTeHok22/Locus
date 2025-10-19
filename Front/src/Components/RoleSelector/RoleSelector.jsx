import '../../index.css'

function RoleSelector({ selectedRole, onRoleChange }) {
    
    const handleManagerClick = () => {
        onRoleChange('managerDHB');
    };

    const handleForemanClick = () => {
        onRoleChange('foremanDHB');
    };

    const handleInspectorClick = () => {
        onRoleChange('inspectorDHB');
    };

    return (
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button 
                onClick={handleManagerClick}
                className={`role-toggle h-8 px-3 text-sm rounded-md flex items-center ${ 
                    selectedRole === 'managerDHB' 
                        ? 'bg-white shadow-sm text-gray-900' 
                        : 'bg-transparent hover:bg-white/50 text-gray-700'
                }`}
            >
                <i className="fas fa-users mr-2"></i>
                <span className="hidden sm:inline">Служба строительного контроля (заказчик)</span>
            </button>
            
            <button 
                onClick={handleForemanClick}
                className={`role-toggle h-8 px-3 text-sm rounded-md flex items-center ${ 
                    selectedRole === 'foremanDHB' 
                        ? 'bg-white shadow-sm text-gray-900' 
                        : 'bg-transparent hover:bg-white/50 text-gray-700'
                }`}
            >
                <i className="fas fa-hard-hat mr-2"></i>
                <span className="hidden sm:inline">Прораб</span>
            </button>
            
            <button 
                onClick={handleInspectorClick}
                className={`role-toggle h-8 px-3 text-sm rounded-md flex items-center ${ 
                    selectedRole === 'inspectorDHB' 
                        ? 'bg-white shadow-sm text-gray-900' 
                        : 'bg-transparent hover:bg-white/50 text-gray-700'
                }`}
            >
                <i className="fas fa-shield-alt mr-2"></i>
                <span className="hidden sm:inline">Инспектор</span>
            </button>
        </div>
    );
}

export { RoleSelector };

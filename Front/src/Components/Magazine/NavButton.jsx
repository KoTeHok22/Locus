import '../../index.css'

function NavButton({ children, active, onClick, name }) {
    return (
        <button 
            name={name}
            onClick={onClick}
            className={`
                w-full text-left px-4 py-3 rounded-lg transition-colors
                ${active 
                    ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-500' 
                    : 'text-gray-700 hover:bg-gray-100'
                }
            `}
        >
            {children}
        </button>
    );
}

export { NavButton }
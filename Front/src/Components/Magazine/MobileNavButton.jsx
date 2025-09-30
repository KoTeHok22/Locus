import '../../index.css'



function MobileNavButton({ children, onClick, name }) {
    return (
        <button 
            name={name}
            onClick={onClick}
            className='
                w-full text-left px-4 py-3 rounded-lg 
                bg-gray-50 hover:bg-gray-100 
                border-b border-gray-200 last:border-b-0
                transition-colors
            '
        >
            {children}
        </button>
    );
}


export { MobileNavButton }
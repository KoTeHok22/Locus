import '../../index.css'
import { useState } from 'react'

function Dashboard({onSwitchToLogin, onSwitchToPage}) {
    
    
    return (

        <div>
            
            <ForemanDHB />
            <InspectorDHB />
            <ManagerDHB />
        
        </div>

    );
}

export { Dashboard };
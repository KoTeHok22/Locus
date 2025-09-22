import '../../index.css'
import { ForemanDHB } from './ForemanDHB'
import { InspectorDHB } from './InspectorDHB'
import { ManagerDHB } from './ManagerDHB'
import { useState } from 'react'

function Dashboard({onSwitchToLogin, onSwitchToPage}) {
    
    {/* Здесь должна быть основная логика по dashboard */}
    
    return (

        <div>
            
            <ForemanDHB />
            <InspectorDHB />
            <ManagerDHB />
        
        </div>

    );
}

export { Dashboard };
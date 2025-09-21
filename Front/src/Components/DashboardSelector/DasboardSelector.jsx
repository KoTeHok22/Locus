import '../../index.css'
import { useState } from 'react';

function DashboardSelector({tabForeman, tabInspector, tabManager}){

        const [tab, setTab] = useState('managerDHB');

        function tabSwitcher (currentTab) {

            switch(currentTab){
                case 'foremanDHB':
                    switchToForemanDHB();
                    break;
                case 'inspectorDHB':
                    switchToInspectorDHB();
                    break;
                case 'ManagerDHB':
                    switchToManagerDHB();
                    break;
                default:
                    alert("Такой должности нет");
                    break;
            }
            
        }

        const switchToForemanDHB = () => (setTab('foremanDHB'));
        const switchToInspectorDHB = () => (setTab('inspectorDHB'));
        const switchToManagerDHB = () => (setTab('ManagerDHB'));
        



    return(

        <div>

        </div>

    )

}


export { DashboardSelector }
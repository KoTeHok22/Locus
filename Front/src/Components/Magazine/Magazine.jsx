import '../../index.css'
import { Dashboard } from '../Dashboards/Dashboard';
import { Analytics } from '../Analytics/Analytics';
import { Map } from '../Map/Map';
import { ObjectList } from '../ObjectList/ObjectList';
import { Reports } from '../Reports/Reports';
import { Settings } from '../Settings/Settings';
import { ForemanDHB } from '../Dashboards/ForemanDHB';
import { InspectorDHB } from '../Dashboards/InspectorDHB';
import { ManagerDHB } from '../Dashboards/ManagerDHB';
import { useState } from 'react';
import { DashboardSelector } from '../DashboardSelector/DasboardSelector';


function Magazine ({ onSwitchToLogin }){

    
    const [currentPage, setCurrentPage] = useState('dashboard');
    
    const switchToDashBoard = () => (setCurrentPage('dashboard'));
    const switchToAnalytics = () => (setCurrentPage('analytics'));
    const switchToMap = () => (setCurrentPage('map'));
    const switchToObjectList = () => (setCurrentPage('objectList'));
    const switchToReports = () => (setCurrentPage('reports'));
    const switchToSettings = () => (setCurrentPage('settings'));

    return(

        <div className='size-full bg-red-500 absolute flex justify-center'>

            <div className='navigation'>

                <button className='dashboard'>

                </button>

                <button className='analytics'>
                    
                </button>

                <button className='map'>
                    
                </button>

                <button className='objectList'>
                    
                </button>

                <button className='reports'>
                    
                </button >
                
                <button className='settings'>
                    
                </button>

            </div>


            
            {currentPage === 'dashboard' && (

                <Dashboard onSwitchToPage={switchToDashBoard} />

            )}

            {currentPage === 'analytics' && (

                <Analytics onSwitchToPage={switchToAnalytics}/>

            )}

            {currentPage === 'map' && (

                <Map onSwitchToPage={switchToMap}/>

            )}

            {currentPage === 'objectList' && (

                <ObjectList onSwitchToPage={switchToObjectList}/>

            )}

            {currentPage === 'reports' && (

                <Reports onSwitchToPage={switchToReports}/>

            )}

            {currentPage === 'settings' && (

                <Settings onSwitchToPage={switchToSettings}/>

            )}




        </div>

    )

}

export { Magazine };
import { useState } from 'react'
import './App.css'
import './Components/LoginForm/LoginForm.jsx'
import { Magazine } from './Components/Magazine/Magazine.jsx'
import { LoginForm } from './Components/LoginForm/LoginForm.jsx'
import { RegistrationForm } from './Components/RegistrationForm/RegistrationForm.jsx'

function App() {

  const[currentPage, setCurrentPage] = useState('login');

  const switchToLogin = () => setCurrentPage('login');
  const switchToRegistration = () => setCurrentPage('registration');
  const switchToMagaz = () => setCurrentPage('magaz');


  return (
    
    <div className='mainApp'>
    <div className='back'></div>
    
    {currentPage === 'login' && (

        <LoginForm 

            onSwitchToRegistration={switchToRegistration}
            onSwitchToMagaz={switchToMagaz}
            
        />
    )}
    
    {currentPage === 'registration' && (

        <RegistrationForm 

            onSwitchToLogin={switchToLogin}
            onSwitchToMagaz={switchToMagaz}
            
        />
    )}
    
    {currentPage === 'magaz' && (

        <Magazine 

            onSwitchToLogin={switchToLogin}
        />
    )}

    
    </div>
    

  )
}

export default App

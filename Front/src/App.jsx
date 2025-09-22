import { useState } from 'react'
import './App.css'
import { LoginForm } from './Components/LoginForm/LoginForm.jsx'
import { RegistrationForm } from './Components/RegistrationForm/RegistrationForm.jsx'
import { Magazine } from './Components/Magazine/Magazine.jsx'

function App() {
  const [currentPage, setCurrentPage] = useState('login');

  const switchToLogin = () => setCurrentPage('login');
  const switchToRegistration = () => setCurrentPage('registration');
  const switchToDashboard = () => setCurrentPage('dashboard');

  return (
    <div className='mainApp'>
      {/*
      {currentPage !== 'dashboard' && <div className='back'></div>}
      
      {currentPage === 'login' && (
        <LoginForm 
          onSwitchToRegistration={switchToRegistration}
          onSwitchToMagaz={switchToDashboard}
        />
      )}
      
      {currentPage === 'registration' && (
        <RegistrationForm 
          onSwitchToLogin={switchToLogin}
        />
      )}
      
      {currentPage === 'dashboard' && (
        <Dashboard 
          onSwitchToLogin={switchToLogin}
        />
      )}
      */}

      <Magazine></Magazine>
    </div>
  )
}

export default App

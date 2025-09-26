import { useState, useEffect } from 'react'
import './App.css'
import { LoginForm } from './Components/LoginForm/LoginForm.jsx'
import { RegistrationForm } from './Components/RegistrationForm/RegistrationForm.jsx'
import { Magazine } from './Components/Magazine/Magazine.jsx'
import authService from './authService.js'


function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = authService.getToken();
      if (token) {
        if (authService.isAuthenticated()) {
          const isVerified = await authService.verifyToken(token);
          if (isVerified) {
            setIsAuthenticated(true);
            setCurrentPage('dashboard');
            return;
          }
        }
      }
      setIsAuthenticated(false);
      setCurrentPage('login');
    };

    checkAuthStatus();
  }, []);

  const switchToLogin = () => {
    setCurrentPage('login');
    setIsAuthenticated(false);
  };
  
  const switchToRegistration = () => setCurrentPage('registration');
  
  const switchToDashboard = () => {
    setCurrentPage('dashboard');
    setIsAuthenticated(true);
  };

  return (
    
    <div className='mainApp'>
      {!isAuthenticated && <div className='back'></div>}
      
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
        <Magazine onLogout={switchToLogin} />
      )}
      
    </div>
  )
}

export default App

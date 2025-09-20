import { useState } from 'react'
import './App.css'
import './Components/LoginForm/LoginForm.jsx'
import { Magazine } from './Components/Magazine/Magazine.jsx'
import { LoginForm } from './Components/LoginForm/LoginForm.jsx'


function App() {


  const[currentPage, setCurrentPage] = useState('login');

  const pageChanger = () => {
    setCurrentPage(prevPage => prevPage === 'magaz' ? 'login' : 'magaz');
  }


  return (
    
    <div className='mainApp'>
    <div className='back'></div>
    
    {currentPage === 'login' ? (

      <LoginForm onEnter = {pageChanger}/>

      ) : (

      <Magazine onEnter={pageChanger}/>

      )}

    
    </div>
    

  )
}

export default App

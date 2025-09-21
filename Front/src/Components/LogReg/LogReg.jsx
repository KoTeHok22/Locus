import { LoginForm } from "../LoginForm/LoginForm"
import { RegistrationForm } from "../RegistrationForm/RegistrationForm"
import { useState } from "react"
import '../../index.css'

function LogReg(){

    const [currentPage, setCurrentPage] = useState("registration");

    const switchToLogin = () => setCurrentPage('login');
    const switchToRegistration = () => setCurrentPage('registration');


    return(

        <div className="min-h-screen flex items-center justify-center p-4">

            {currentPage === 'login' ? (<LoginForm switchToRegistration={switchToRegistration}/>) : (<RegistrationForm switchToLogin={switchToLogin}/>)}

        </div>

    )
}

export { LogReg };
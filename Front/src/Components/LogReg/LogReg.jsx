import { LoginForm } from "../LoginForm/LoginForm"
import { RegistrationForm } from "../RegistrationForm/RegistrationForm"
import { useState } from "react"
import '../../index.css'

function LogReg(){

    const [currentPage, setCurrentPage] = useState("login");

    const changePage = () => {
    setCurrentPage(prevPage => prevPage === 'registration' ? 'login' : 'registration');
    };

    return(

        <div className="min-h-screen flex items-center justify-center p-4">

            {currentPage === 'login' ? (<LoginForm onSwitch={changePage}/>) : (<RegistrationForm onSwitch={changePage}/>)}

        </div>

    )
}

export { LogReg };
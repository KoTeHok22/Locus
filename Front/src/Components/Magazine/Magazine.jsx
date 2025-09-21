import '../../index.css'

function Magazine ({ onSwitchToLogin }){

    return(

        <div className='size-full bg-red-500 absolute flex justify-center'>
            <button className='w-4 h-4 cursor-pointer' onClick={onSwitchToLogin}>ЕСЛИ ЕСТЬ, ЗНАЧИТ РАБОТАЕТ</button>
        </div>

    )

}

export { Magazine };
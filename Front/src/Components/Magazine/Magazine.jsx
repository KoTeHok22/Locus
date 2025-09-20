import '../../index.css'

function Magazine ({onEnter}){

    return(

        <div className='size-full bg-red-500 absolute flex justify-center'>
            <button className='w-4 h-4 cursor-pointer' onClick={onEnter}>ЕСЛИ ЕСТЬ, ЗНАЧИТ РАБОТАЕТ</button>
        </div>

    )

}

export { Magazine };
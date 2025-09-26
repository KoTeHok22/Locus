import '../../index.css'


function ManagerDHB({ onSwitch }){
    {/* Dashboard для Заказчика */}
    return(

        <div className='flex flex-col'>
            
            <div className='flex flex-[0.3] flex-row gap-[15px]'>

                <div className='flex-[0.25] flex bg-white border-[2px] border-gray-200 rounded-[10px]'>
                    
                    <div className='flex flex-col justify-center gap-2 pl-5 flex-[0.7]'>
                        <p className='text-[15px] text-gray-600 font-[500]'>Всего объектов:</p>
                        <p className='text-[30px] font-bold'>6</p>
                    </div>
                    <div className='flex flex-col justify-center text-center flex-[0.3]'>
                        a
                    </div>
                </div>

                <div className='flex-[0.25] flex bg-white border-[2px] border-gray-200 rounded-[10px]'>
                    
                    <div className='flex flex-col justify-center gap-2 pl-5 py-3 flex-[0.7]'>
                        <p className='text-[15px] text-gray-600 font-[500]'>В графике:</p>
                        <p className='text-[30px] font-bold text-green-600'>2</p>
                        <div className='inline-flex items-center rounded-md font-medium text-green-600 bg-green-50 text-sm'>
                            <p className='bg-green-100 w-[50%] pl-1 flex gap-[5px]'>+2 <p className='text-gray-500 font-normal'>за неделю</p></p>
                        </div>
                        
                    </div>
                    <div className='flex flex-col justify-center text-center flex-[0.3]'>  
                        b 
                    </div>
                </div>

                <div className='flex-[0.25] flex bg-white border-[2px] border-gray-200 rounded-[10px]'>

                    <div className='flex flex-col justify-center gap-2 pl-5 py-3 flex-[0.7]'>
                        <p className='text-[15px] text-gray-600 font-[500]'>В зоне риска:</p>
                        <p className='text-[30px] font-bold text-yellow-500'>2</p>
                        <div className='inline-flex items-center rounded-md font-medium text-yellow-500 bg-green-50 text-sm'>
                            <p className='bg-green-100 w-[50%] pl-1 flex gap-[5px]'>-1 <p className='text-gray-500 font-normal'>за неделю</p></p>
                        </div>
                    </div>
                    <div className='flex flex-col justify-center text-center flex-[0.3]'> 
                        c 
                    </div>
                </div>

                <div className='flex-[0.25] flex bg-white border-[2px] border-gray-200 rounded-[10px]'>
                    
                    <div className='flex flex-col justify-center gap-2 pl-5 py-3 flex-[0.7]'>
                        <p className='text-[15px] text-gray-600 font-[500]'>Критично:</p>
                        <p className='text-[30px] font-bold text-red-500'>2</p>
                        <div className='inline-flex items-center rounded-md font-medium text-red-500 bg-green-50 text-sm'>
                            <p className='bg-green-100 w-[50%] pl-1 flex gap-[5px]'>+1 <p className='text-gray-500 font-normal'>за неделю</p></p>
                        </div>
                    </div>
                    <div className='flex flex-col justify-center text-center flex-[0.3]'>
                        d
                    </div>
                </div>

            </div>


            <div className='flex flex-row flex-[0.7] justify-between m-4 p-4'>

            <div className=''>
                <p>Карта объектов</p>
            </div>


            <div className='flex flex-col'>
                <p className='border-gray-200 border-[2px] rounded-t-[10px]'>Приоритетные объекты</p>
                <div className='border-gray-200 border-[2px] border-t-[0px] rounded-b-[10px]'>
                    dsadas
                </div>
            </div>


            </div>


        </div>

    )
}

export { ManagerDHB }
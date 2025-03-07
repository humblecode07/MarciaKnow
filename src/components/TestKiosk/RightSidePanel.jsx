import DangoMenuIcon from "../../assets/Icons/DangoMenuIcon"
import SentIcon from "../../assets/Icons/SentIcon"
import yangaLogo from '../../../public/Photos/yangaLogo.png'

const RightSidePanel = () => {
   return (
      <section className='w-[18.75rem] h-[49.4375rem] flex flex-col bg-[#FBFCF8] shadow-md relative font-righteous'>
         <div className='w-full h-[3.5rem] bg-[#FBF9F6] shadow-md flex items-center justify-between px-[.75rem]'>
            <div className='flex gap-[0.625rem] items-center'>
               <img
                  src={yangaLogo}
                  alt=""
                  className='w-[2.3125rem] h-[2.3125rem] object-cover'
               />
               <span className='text-[.875rem]'>Virtual AI Assistant</span>
            </div>
            <div className='pr-[.625rem]'>
               <DangoMenuIcon />
            </div>
         </div>
         <div className='h-full py-[1.3125rem] px-[.75rem] flex flex-col gap-[1.3125rem] font-roboto font-light overflow-y-auto'>
            <div className='flex gap-[0.8125rem]'>
               <img
                  src={yangaLogo}
                  alt=""
                  className='w-[1.5rem] h-[1.5rem] object-cover'
               />
               <div className=' px-[0.625rem] py-[.5rem] bg-[#F5F5F5] overflow-hidden'>
                  <span className='text-[.75rem]'>
                     Ayaw ko yung lasa ng C2 na kulay green
                  </span>
               </div>
            </div>
            <div className='flex gap-[0.8125rem] justify-end'>
               <div className=' px-[0.625rem] py-[.5rem] bg-[#F5F5F5] overflow-hidden'>
                  <span className='text-[.75rem]'>
                     Ayos lang naman yung lasa ng kulay dilaw 
                  </span>
               </div>
               <img
                  src={yangaLogo}
                  alt=""
                  className='w-[1.5rem] h-[1.5rem] object-cover'
               />
            </div>
            <div className='flex gap-[0.8125rem]'>
               <img
                  src={yangaLogo}
                  alt=""
                  className='w-[1.5rem] h-[1.5rem] object-cover'
               />
               <div className=' px-[0.625rem] py-[.5rem] bg-[#F5F5F5] overflow-hidden'>
                  <span className='text-[.75rem]'>
                     Yung tinikman ko yung color green yoko ng uliten
                  </span>
               </div>
            </div>
            <div className='flex gap-[0.8125rem] justify-end'>
               <div className=' px-[0.625rem] py-[.5rem] bg-[#F5F5F5] overflow-hidden'>
                  <span className='text-[.75rem]'>
                     Pag bibili ako sa labas alam ko na yung sasabihen
                  </span>
               </div>
               <img
                  src={yangaLogo}
                  alt=""
                  className='w-[1.5rem] h-[1.5rem] object-cover'
               />
            </div>
            <div className='flex gap-[0.8125rem]'>
               <img
                  src={yangaLogo}
                  alt=""
                  className='w-[1.5rem] h-[1.5rem] object-cover'
               />
               <div className=' px-[0.625rem] py-[.5rem] bg-[#F5F5F5] overflow-hidden'>
                  <span className='text-[.75rem]'>
                     Ateh, pabili nga po C2 na red
                  </span>
               </div>
            </div>
            <div className='flex gap-[0.8125rem] justify-end'>
               <div className=' px-[0.625rem] py-[.5rem] bg-[#F5F5F5] overflow-hidden'>
                  <span className='text-[.75rem]'>
                  WALA NG RED, GREEN NALANG!
                  </span>
               </div>
               <img
                  src={yangaLogo}
                  alt=""
                  className='w-[1.5rem] h-[1.5rem] object-cover'
               />
            </div>
            <div className='flex gap-[0.8125rem]'>
               <img
                  src={yangaLogo}
                  alt=""
                  className='w-[1.5rem] h-[1.5rem] object-cover'
               />
               <div className=' px-[0.625rem] py-[.5rem] bg-[#F5F5F5] overflow-hidden'>
                  <span className='text-[.75rem]'>
                     Hindi pwede yaan~!
                  </span>
               </div>
            </div>
            <div className='flex gap-[0.8125rem]'>
               <img
                  src={yangaLogo}
                  alt=""
                  className='w-[1.5rem] h-[1.5rem] object-cover'
               />
               <div className=' px-[0.625rem] py-[.5rem] bg-[#F5F5F5] overflow-hidden'>
                  <span className='text-[.75rem]'>
                     Ayaw ko uminom niyaaaaaaaaan....~
                  </span>
               </div>
            </div>
         </div>
         <div className='w-[18.75rem] h-[2.9375rem] bg-[#FBF9F6] shadow-md flex items-center justify-center gap-[0.625rem] border-solid border-t-[1px] border-black'>
            <div className='w-[14.8125rem] h-[1.625rem] px-[0.625rem] flex items-center font-roboto font-light text-[.75rem] border-solid border-[1px] border-black'>
               <input
                  type="text"
                  placeholder='Type your message...'
                  className='w-[13.5625rem] outline-none'
               />
            </div>
            <div className='w-[1.8125rem] h-[1.625rem] flex justify-center items-center bg-[#D1D6FA]'>
               <SentIcon />
            </div>
         </div>
      </section>
   )
}

export default RightSidePanel

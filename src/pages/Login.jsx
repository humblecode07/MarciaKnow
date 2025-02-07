import { useEffect, useRef } from 'react';
import Carousel from "../components/Carousel";
import yangaLogo from '../../public/Photos/yangaLogo.png';

const Login = () => {
   const containerRef = useRef(null);

   useEffect(() => {
      const container = containerRef.current;
      if (container) {
         container.style.transition = 'opacity 1s';
         container.style.opacity = 1;
      }
   }, []);

   return (
      <div className='relative'>
         <div 
            ref={containerRef}
            className='w-full md:w-[45.78vw] h-screen absolute bg-white z-[1] flex flex-col justify-center items-center gap-[1.5rem] p-4 md:p-0 shadow-2xl'
            style={{ opacity: 0 }}
         >
            <img 
               src={yangaLogo}
               className="w-[4rem] h-[4rem] md:w-[6.25rem] md:h-[6.25rem]"
               alt="Yanga Logo"
            />
            <span className="font-roboto font-light text-[1rem] md:text-[1.25rem]">More than a School, a Family</span>
            <input 
               type="text" 
               name="email"
               className="w-[80dvw] md:w-[22.0625rem] h-[3rem] md:h-[3.5625rem] border-solid border-[1px] border-[#A8A8A8] rounded-full outline-none p-[1rem] md:p-[1.625rem] text-[1rem] md:text-[1.125rem] font-light"
               placeholder="Email"
            />
            <input 
               type="password" 
               name="password"
               className="w-[80dvw] md:w-[22.0625rem] h-[3rem] md:h-[3.5625rem] border-solid border-[1px] border-[#A8A8A8] rounded-full outline-none p-[1rem] md:p-[1.625rem] text-[1rem] md:text-[1.125rem] font-light"
               placeholder="Password"   
            />
            <button
               className="w-[40dvw] md:w-[9.125rem] h-[2.5rem] md:h-[2.6875rem] border-solid border-[1px] border-[#4E9AFF] rounded-full text-[1rem] font-bold text-[#4E9AFF] cursor-pointer"
            >
               Log in
            </button>
         </div>
         <Carousel />
      </div>
   )
}

export default Login;
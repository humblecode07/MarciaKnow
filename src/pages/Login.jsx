import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Carousel from "../components/Carousel";
import yangaLogo from '../../public/Photos/yangaLogo.png';
import { axiosPrivate } from '../api/api';
import { jwtDecode } from 'jwt-decode';  
import useAuth from '../hooks/useAuth';

const superAdminRole = Number(import.meta.env.VITE_ROLE_SUPER_ADMIN);
const adminRole = Number(import.meta.env.VITE_ROLE_ADMIN);

const Login = () => {
   const { admin, setAdmin } = useAuth();
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [error, setError] = useState('');
   const navigate = useNavigate();

   const containerRef = useRef(null);

   useEffect(() => {
      const container = containerRef.current;
      if (container) {
         container.style.transition = 'opacity 1s';
         container.style.opacity = 1;
      }
   }, []);

   useEffect(() => {
      if (admin?.accessToken) {
         navigate('/admin/');
      }
   }, [admin, navigate]);

   const handleLogin = async (e) => {
      e.preventDefault();
      setError(''); // clear previous error
      try {
         const response = await axiosPrivate.post(
            '/auth',
            JSON.stringify({ email, password }),
            {
               headers: { 'Content-Type': 'application/json' },
               withCredentials: true,
            }
         );

         const accessToken = response.data.accessToken;
         const decodedToken = jwtDecode(accessToken);
         const { roles } = decodedToken;

         localStorage.setItem("jwt", response.data.refreshToken);
         setAdmin({ email, accessToken, roles });

         if (roles.includes(adminRole) || roles.includes(superAdminRole)) {
            navigate('/admin/');
         } 
         else {
            setError('Unknown role.');
         }
      } catch (error) {
         console.error(error);
         setError('Invalid email or password. Please try again.');
      }
   };

   return (
      <div className='relative'>
         <form
            ref={containerRef}
            onSubmit={handleLogin}
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
               value={email}
               onChange={e => setEmail(e.target.value)}
               className="w-[80dvw] md:w-[22.0625rem] h-[3rem] md:h-[3.5625rem] border-solid border-[1px] border-[#A8A8A8] rounded-full outline-none p-[1rem] md:p-[1.625rem] text-[1rem] md:text-[1.125rem] font-light"
               placeholder="Email"
            />
            <input
               type="password"
               name="password"
               value={password}
               onChange={e => setPassword(e.target.value)}
               className="w-[80dvw] md:w-[22.0625rem] h-[3rem] md:h-[3.5625rem] border-solid border-[1px] border-[#A8A8A8] rounded-full outline-none p-[1rem] md:p-[1.625rem] text-[1rem] md:text-[1.125rem] font-light"
               placeholder="Password"
            />

            {error && <p className="text-red-500 font-light text-sm">{error}</p>}

            <button
               type="submit"
               className="w-[40dvw] md:w-[9.125rem] h-[2.5rem] md:h-[2.6875rem] border-solid border-[1px] border-[#4E9AFF] rounded-full text-[1rem] font-bold text-[#4E9AFF] cursor-pointer"
            >
               Log in
            </button>
         </form>

         <Carousel />
      </div>
   );
};

export default Login;

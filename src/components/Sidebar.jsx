import React, { useState } from 'react'
import { NavLink, useLocation, useNavigate, useParams } from 'react-router-dom';
import useLogout from '../hooks/useLogout';
import LogoutModal from '../modals/LogoutModal';
import useAuth from '../hooks/useAuth';

const Sidebar = () => {
   const { admin } = useAuth();
   const { adminID } = useParams();

   const logout = useLogout();

   const [isOpen, setIsOpen] = useState(false);
   const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
   const location = useLocation();

   const [isKioskToggled, setIsKioskToggled] = useState(false);

   const toggleSidebar = () => {
      setIsOpen(!isOpen)
   }

   const isActivePath = (path) => {
      const currentPath = location.pathname;

      if (path === '') {
         console.log(path);
         return currentPath === '/admin';
      }

      // For other paths, check if currentPath includes the path string
      return currentPath.includes(path);
   }

   const handleLogoutClick = () => {
      setIsLogoutModalOpen(true);
   }

   const handleLogoutConfirm = () => {
      setIsLogoutModalOpen(false);
      logout();
   }

   const handleLogoutCancel = () => {
      setIsLogoutModalOpen(false);
   }  

   console.log(adminID);

   return (
      <>
         <button
            className="fixed top-4 left-4 z-50 p-2 bg-gray-800 text-white rounded-md md:hidden"
            onClick={toggleSidebar}
         >
            ☰
         </button>
         <div
            className={`fixed top-0 left-0 h-full w-64 flex flex-col gap-[1.3125rem] bg-[#FBFCF8] shadow-lg transform ${isOpen ? 'translate-x-0' : '-translate-x-full'
               } transition-transform duration-300 ease-in-out md:translate-x-0`}
         >
            <span className='text-[#110d79] font-righteous text-[2rem] pt-[2rem] text-center'>Marcia<span className='text-[#dbb341]'>Know</span></span>
            <div className='flex flex-col gap-[0.375rem] text-white'>
               <ul className='flex flex-col justify-center items-center'>
                  <NavLink to={''} className={`w-[12.3125rem] h-[3.1156rem] rounded-[1rem] flex items-center cursor-pointer select-none ${isActivePath('') ? 'bg-[#dbb341]' : 'bg-white hover:bg-gray-200'}`}>
                     <div className='w-[10.5625rem] flex items-center gap-[0.875rem] px-[.875rem]'>
                        <div className='w-[1.875rem] h-[1.875rem] rounded-full bg-[#110d79] flex justify-center items-center'>
                           <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M7.77778 4.66667V0H14V4.66667H7.77778ZM0 7.77778V0H6.22222V7.77778H0ZM7.77778 14V6.22222H14V14H7.77778ZM0 14V9.33333H6.22222V14H0Z" fill="#ffffff" />
                           </svg>
                        </div>
                        <span className={`font-roboto text-[.875rem] ${isActivePath('') ? 'text-white' : 'text-black'}`}>Dashboard</span>
                     </div>
                  </NavLink>
                  <li
                     className={`w-[12.3125rem] h-[3.1156rem] rounded-[1rem] flex items-center cursor-pointer select-none 
                        ${isActivePath('/test-kiosk') || isActivePath('/map-editor') || isActivePath('/kiosk-settings') ? 'bg-[#dbb341]' : 'bg-white hover:bg-gray-200'}`}
                     onClick={() => {
                        setIsKioskToggled(!isKioskToggled);
                     }}
                  >
                     <div className='w-[10.5625rem] flex items-center gap-[0.875rem] px-[.875rem] shrink-0'>
                        <div className='w-[1.875rem] h-[1.875rem] rounded-full bg-[#110d79] flex justify-center items-center shrink-0'>
                           <svg width="12" height="15" viewBox="0 0 12 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M1.575 0.851501C1.15728 0.851501 0.756677 1.01744 0.461307 1.31281C0.165937 1.60818 0 2.00879 0 2.4265V6.9765C0 7.39422 0.165937 7.79482 0.461307 8.09019C0.756677 8.38556 1.15728 8.5515 1.575 8.5515H3.85V13.8015H2.625C2.48576 13.8015 2.35223 13.8568 2.25377 13.9553C2.15531 14.0537 2.1 14.1873 2.1 14.3265C2.1 14.4657 2.15531 14.5993 2.25377 14.6977C2.35223 14.7962 2.48576 14.8515 2.625 14.8515H8.575C8.71424 14.8515 8.84777 14.7962 8.94623 14.6977C9.04469 14.5993 9.1 14.4657 9.1 14.3265C9.1 14.1873 9.04469 14.0537 8.94623 13.9553C8.84777 13.8568 8.71424 13.8015 8.575 13.8015H7.35V8.5515H9.625C9.83183 8.5515 10.0366 8.51076 10.2277 8.43161C10.4188 8.35246 10.5924 8.23645 10.7387 8.09019C10.8849 7.94394 11.001 7.77032 11.0801 7.57923C11.1593 7.38814 11.2 7.18333 11.2 6.9765V2.4265C11.2 2.21967 11.1593 2.01486 11.0801 1.82378C11.001 1.63269 10.8849 1.45906 10.7387 1.31281C10.5924 1.16656 10.4188 1.05054 10.2277 0.971391C10.0366 0.89224 9.83183 0.851501 9.625 0.851501H1.575ZM4.9 13.8015V8.5515H6.3V13.8015H4.9Z" fill="#ffffff" />
                           </svg>

                        </div>
                        <div className={`w-[90%] flex justify-between items-center shrink-0`}>
                           <span className={`font-roboto text-[.875rem] ${isActivePath('/test-kiosk') || isActivePath('/map-editor') || isActivePath('/kiosk-settings') ? 'text-white' : 'text-black'}`}>Kiosk</span>
                           <svg className={`transform ${isKioskToggled ? 'rotate-90' : 'rotate-0'}`} width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M0.336442 0.700625C0.195838 0.832915 0.116852 1.01232 0.116852 1.19937C0.116852 1.38643 0.195838 1.56583 0.336442 1.69812L4.04894 5.19008L0.336442 8.68204C0.199823 8.81508 0.124227 8.99328 0.125936 9.17825C0.127645 9.36321 0.206522 9.54015 0.345578 9.67094C0.484634 9.80174 0.672743 9.87593 0.869391 9.87754C1.06604 9.87914 1.25549 9.80804 1.39694 9.67954L5.63969 5.68883C5.78029 5.55654 5.85928 5.37714 5.85928 5.19008C5.85928 5.00302 5.78029 4.82362 5.63969 4.69133L1.39694 0.700625C1.2563 0.568374 1.06556 0.49408 0.866692 0.49408C0.667818 0.49408 0.477087 0.568374 0.336442 0.700625Z" fill="black" />
                           </svg>
                        </div>
                     </div>
                  </li>
                  {isKioskToggled && (
                     <div className="flex flex-col gap-4 text-black py-3 text-sm">
                        <NavLink
                           to="test-kiosk"
                           className={`flex items-center gap-6 select-none`}
                        >
                           <svg
                              className="min-w-[5px]"
                              width="5"
                              height="5"
                              viewBox="0 0 5 5"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              style={{ transform: isActivePath('/test-kiosk') ? 'scale(1.5)' : 'scale(1)' }}
                           >
                              <circle cx="2.5" cy="2.5" r="2.5" fill="#BABABA" />
                           </svg>
                           <span className={`${isActivePath('/test-kiosk') ? 'font-semibold' : 'font-normal'}`}>
                              TEST KIOSK
                           </span>
                        </NavLink>

                        <NavLink
                           to="map-editor"
                           className="flex items-center gap-6 select-none"
                        >
                           <svg
                              className="min-w-[5px]"
                              width="5" height="5"
                              viewBox="0 0 5 5"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              style={{ transform: isActivePath('/map-editor') ? 'scale(1.5)' : 'scale(1)' }}
                           >
                              <circle cx="2.5" cy="2.5" r="2.5" fill="#BABABA" />
                           </svg>
                           <span className={`${isActivePath('/map-editor') ? 'font-semibold' : 'font-normal'}`}>
                              MAP EDITOR
                           </span>
                        </NavLink>

                        <NavLink
                           to="kiosk-settings"
                           className="flex items-center gap-6 select-none"
                        >
                           <svg
                              className="min-w-[5px]"
                              width="5" height="5"
                              viewBox="0 0 5 5"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              style={{ transform: isActivePath('/kiosk-settings') ? 'scale(1.5)' : 'scale(1)' }}
                           >
                              <circle cx="2.5" cy="2.5" r="2.5" fill="#BABABA" />
                           </svg>
                           <span className={`${isActivePath('/kiosk-settings') ? 'font-semibold' : 'font-normal'}`}>
                              KIOSK SETTINGS
                           </span>
                        </NavLink>
                     </div>

                  )}
                  <NavLink to={'reports'} className={`w-[12.3125rem] h-[3.1156rem] rounded-[1rem] flex items-center cursor-pointer select-none  ${isActivePath('/reports') ? 'bg-[#dbb341]' : 'bg-white hover:bg-gray-200'}`}>
                     <div className='w-[10.5625rem] flex items-center gap-[0.875rem] px-[.875rem]'>
                        <div className='w-[1.875rem] h-[1.875rem] rounded-full bg-[#110d79] flex justify-center items-center'>
                           <svg width="14" height="15" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12.4444 0.702972H11.6666C10.8075 0.702972 10.1111 1.39942 10.1111 2.25853V13.1474C10.1111 14.0065 10.8075 14.703 11.6666 14.703H12.4444C13.3035 14.703 14 14.0065 14 13.1474V2.25853C14 1.39942 13.3035 0.702972 12.4444 0.702972Z" fill="#ffffff" />
                              <path d="M7.38888 5.36963H6.6111C5.75199 5.36963 5.05554 6.06607 5.05554 6.92518V13.1474C5.05554 14.0065 5.75199 14.703 6.6111 14.703H7.38888C8.24799 14.703 8.94443 14.0065 8.94443 13.1474V6.92518C8.94443 6.06607 8.24799 5.36963 7.38888 5.36963Z" fill="#ffffff" />
                              <path d="M2.33333 10.8141H1.55556C0.696446 10.8141 0 11.5105 0 12.3696V13.1474C0 14.0065 0.696446 14.703 1.55556 14.703H2.33333C3.19244 14.703 3.88889 14.0065 3.88889 13.1474V12.3696C3.88889 11.5105 3.19244 10.8141 2.33333 10.8141Z" fill="#ffffff" />
                           </svg>

                        </div>
                        <span className={`font-roboto text-[.875rem] ${isActivePath('/reports') ? 'text-white' : 'text-black'}`}>Reports</span>
                     </div>
                  </NavLink>
                  <NavLink
                     to={'users'}
                     className={`w-[12.3125rem] h-[3.1156rem] rounded-[1rem] flex items-center cursor-pointer select-none ${(isActivePath('/users') || (isActivePath(`/${adminID}`) && adminID !== admin.adminId))
                        ? 'bg-[#dbb341]'
                        : 'bg-white hover:bg-gray-200'
                        }`}
                  >
                     <div className='w-[10.5625rem] flex items-center gap-[0.875rem] px-[.875rem]'>
                        <div className='w-[1.875rem] h-[1.875rem] rounded-full bg-[#110d79] flex justify-center items-center'>
                           <svg width="14" height="12" viewBox="0 0 14 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M9.8 9.85003V11.25H0V9.85003C0 9.85003 0 7.05003 4.9 7.05003C9.8 7.05003 9.8 9.85003 9.8 9.85003ZM7.35 3.20003C7.35 2.71546 7.20631 2.24178 6.9371 1.83888C6.66789 1.43598 6.28525 1.12196 5.83757 0.936521C5.38989 0.751086 4.89728 0.702568 4.42203 0.797102C3.94677 0.891636 3.51023 1.12498 3.16759 1.46761C2.82495 1.81025 2.59161 2.2468 2.49708 2.72205C2.40254 3.19731 2.45106 3.68992 2.6365 4.1376C2.82193 4.58528 3.13595 4.96792 3.53885 5.23713C3.94175 5.50634 4.41544 5.65003 4.9 5.65003C5.54978 5.65003 6.17295 5.3919 6.63241 4.93244C7.09188 4.47297 7.35 3.84981 7.35 3.20003ZM9.758 7.05003C10.1883 7.38305 10.5404 7.80633 10.7896 8.29008C11.0387 8.77383 11.1788 9.3063 11.2 9.85003V11.25H14V9.85003C14 9.85003 14 7.30903 9.758 7.05003ZM9.1 0.750026C8.61825 0.747785 8.14715 0.891798 7.749 1.16303C8.17421 1.75714 8.40284 2.46943 8.40284 3.20003C8.40284 3.93063 8.17421 4.64291 7.749 5.23703C8.14715 5.50825 8.61825 5.65227 9.1 5.65003C9.74978 5.65003 10.3729 5.3919 10.8324 4.93244C11.2919 4.47297 11.55 3.84981 11.55 3.20003C11.55 2.55025 11.2919 1.92708 10.8324 1.46761C10.3729 1.00815 9.74978 0.750026 9.1 0.750026Z" fill="#ffffff" />
                           </svg>
                        </div>
                        <span className={`font-roboto text-[.875rem] ${(isActivePath('/users') || (isActivePath(`/${adminID}`) && adminID !== admin.adminId))
                              ? 'text-white'
                              : 'text-black'
                           }`}>Admin Users</span>
                     </div>
                  </NavLink>
               </ul>
               <span className='pl-[2.375rem] text-[0.75rem] font-bold text-black'>ACCOUNT</span>
               <ul className='flex flex-col justify-center items-center'>
                  <NavLink to={`${admin.adminId}`} className={`w-[12.3125rem] h-[3.1156rem] rounded-[1rem] flex items-center cursor-pointer select-none ${isActivePath(`${admin.adminId}`) ? 'bg-[#dbb341]' : 'bg-white hover:bg-gray-200'}`}>
                     <div className='w-[10.5625rem] flex items-center gap-[0.875rem] px-[.875rem] cursor-pointer'>
                        <div className='w-[1.875rem] h-[1.875rem] rounded-full bg-[#110d79] flex justify-center items-center'>
                           <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M7 0C7.92826 0 8.8185 0.368749 9.47487 1.02513C10.1313 1.6815 10.5 2.57174 10.5 3.5C10.5 4.42826 10.1313 5.3185 9.47487 5.97487C8.8185 6.63125 7.92826 7 7 7C6.07174 7 5.1815 6.63125 4.52513 5.97487C3.86875 5.3185 3.5 4.42826 3.5 3.5C3.5 2.57174 3.86875 1.6815 4.52513 1.02513C5.1815 0.368749 6.07174 0 7 0ZM7 8.75C10.8675 8.75 14 10.3162 14 12.25V14H0V12.25C0 10.3162 3.1325 8.75 7 8.75Z" fill="#ffffff" />
                           </svg>
                        </div>
                        <span className={`font-roboto text-[.875rem] ${isActivePath(`${admin.adminId}`) ? 'text-white' : 'text-black'}`}>Profile</span>
                     </div>
                  </NavLink>
                  <button className={`w-[12.3125rem] h-[3.1156rem] rounded-[1rem] flex items-center cursor-pointer bg-white select-none hover:bg-gray-200`}>
                     <button onClick={handleLogoutClick} className={`w-[12.3125rem] h-[3.1156rem] rounded-[1rem] flex items-center cursor-pointer bg-white select-none hover:bg-gray-200`}>
                        <div className='w-[10.5625rem] flex items-center gap-[0.875rem] px-[.875rem]'>
                           <div className='w-[1.875rem] h-[1.875rem] rounded-full bg-[#110d79] flex justify-center items-center'>
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                 <path d="M1.55556 14C1.12778 14 0.761704 13.8478 0.457333 13.5434C0.152963 13.2391 0.000518519 12.8727 0 12.4444V1.55556C0 1.12778 0.152444 0.761704 0.457333 0.457333C0.762222 0.152963 1.1283 0.000518519 1.55556 0H7V1.55556H1.55556V12.4444H7V14H1.55556ZM10.1111 10.8889L9.04167 9.76111L11.025 7.77778H4.66667V6.22222H11.025L9.04167 4.23889L10.1111 3.11111L14 7L10.1111 10.8889Z" fill="#ffffff" />
                              </svg>
                           </div>
                           <span className={`font-roboto text-[.875rem] text-black`}>Logout</span>
                        </div>
                     </button>
                  </button>
               </ul>
            </div>
         </div>
         <LogoutModal
            isOpen={isLogoutModalOpen}
            onClose={handleLogoutCancel}
            onConfirm={handleLogoutConfirm}
         />
      </>
   )
}

export default Sidebar
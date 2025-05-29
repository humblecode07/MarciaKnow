import React, { useState } from 'react'
import XTwoIcon from '../assets/Icons/XTwoIcon';
import { useQuery } from '@tanstack/react-query';
import { fetchNavigationIcons } from '../api/api';

const NavigationIconsModal = ({ icon, index, updateIcon }) => {
   const { data: navigationIcons, error: navigationIconsError, isLoading: navigationIconsLoading } = useQuery({
      queryKey: ['navigationIcons'],
      queryFn: fetchNavigationIcons,
   });

   const [isOpen, setIsOpen] = useState(false);

   const openModal = () => setIsOpen(true);
   const closeModal = () => setIsOpen(false);
   if (navigationIconsLoading) return <div>Loading...</div>;

   if (navigationIconsError) {
      console.error('Error fetching navigation icons:', navigationIconsError);
      return <div>Error loading navigation icons data.</div>;
   }

   return (
      <>
         <button
            onClick={openModal}
            className='w-[2.5rem] h-[2.5rem] border-solid border-[1px] border-black flex items-center justify-center cursor-pointer'
         >
            <img
               src={icon}
               alt=""
            />
         </button>

         {isOpen && (
            <div className='fixed inset-0 z-50 flex items-center justify-center font-roboto'>
               <div className="w-full h-full absolute bg-white opacity-50"></div>
               <div className="w-[39.6875rem] px-[1.625rem] py-[1.75rem] flex flex-col gap-[1.5625rem] bg-white border-solid border-[1px] border-black shadow-lg relative">
                  <div className='w-full flex justify-between items-center'>
                     <div className='flex flex-col'>
                        <h2 className="text-[1rem] font-bold">Select Navigation Icon</h2>
                        <p className='text-[.875rem] text-gray-400'>Select an icon that best represents the navigation item's purpose.</p>
                     </div>
                     <button
                        onClick={closeModal}
                        className="w-[2.0625rem] h-[2.0625rem] bg-[#C9C9C9] flex items-center justify-center cursor-pointer"
                     >
                        <XTwoIcon />
                     </button>
                  </div>
                  <div className='flex gap-[0.914375rem] flex-wrap'>
                     {navigationIcons.data.map((icons) => {
                        return (
                           <div
                              className='w-[3rem] h-[3rem] border border-black flex items-center justify-center transition-transform duration-200 ease-in-out hover:border-[#A855F7] hover:scale-110 cursor-pointer'
                              key={icons._id}
                              onClick={() => updateIcon("ICON", index, icons.icon)}
                           >
                              <img
                                 src={icons.icon}
                                 alt="nav_icon"
                                 className='w-[1.75rem] h-[1.75rem]'
                              />
                           </div>
                        );
                     })}
                  </div>
               </div>
            </div>
         )}
      </>
   )
}

export default NavigationIconsModal

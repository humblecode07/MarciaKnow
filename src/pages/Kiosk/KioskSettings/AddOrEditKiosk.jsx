import React, { useState } from 'react'
import CampusMap from '../../../components/TestKiosk/CampusMap'
import { useNavigate } from 'react-router-dom'
import { createKiosk } from '../../../api/api';

const AddOrEditKiosk = () => {
   const navigate = useNavigate();
   const [kioskName, setKioskName] = useState('');
   const [location, setLocation] = useState('');
   const [position, setPosition] = useState({ x: '', y: '' });

   const handleMapClick = (x, y) => {
      setPosition({ x, y });
   };

   const handleCancel = () => {
      navigate(-1);
   };

   const handleSubmit = async () => {
      if (!kioskName.trim()) {
         alert('Please enter a kiosk name');
         return;
      }

      if (!location.trim()) {
         alert('Please enter a location');
         return;
      }

      if (!position.x || !position.y) {
         alert('Please select a position on the map');
         return;
      }

      try {
         // Prepare data for API
         const kioskData = {
            name: kioskName,
            location: location,
            coordinates: position
         };

         const newKiosk = await createKiosk(kioskData);

         console.log(newKiosk);

         alert('Kiosk successfully created!');
         navigate('/admin/kiosk-settings');
      }
      catch (error) {
         console.error('Error submitting kiosk: ', error);
         alert(`Failed to submit kiosk: ${error.message}`);
      }
   };

   console.log(position);

   return (
      <div className="flex flex-col gap-[1.1875rem] ml-[19.5625rem] mt-[1.875rem] font-roboto">
         <div className='flex flex-col gap-[0.1875rem]'>
            <h1 className='font-poppins font-bold text-[1.125rem]'>ADD KIOSK</h1>
            <span className='font-roboto text-[.875rem] text-[#4B5563]'>Add a new kiosk with a unique ID, name, location, and coordinates, and automatically update all buildings to include the new kiosk in their navigation data.</span>
         </div>
         <div className='w-full px-[1rem] py-[.875rem] flex gap-[.0.8125rem] bg-[#FBFCF8] shadow-md'>
            <div className='flex flex-col justify-between p-[0.375rem]'>
               <div className='flex flex-col gap-[1rem]'>
                  <div className='flex flex-col gap-[.5rem]'>
                     <span className='font-bold'>Kiosk Name</span>
                     <div className='w-[25.31dvw] h-[2.25rem] flex items-center border-solid border-[1px] border-black'>
                        <input
                           type="text"
                           name="kiosk-name"
                           className='px-[1rem] text-[.875rem] outline-none w-full'
                           value={kioskName}
                           onChange={(e) => setKioskName(e.target.value)}
                        />
                     </div>
                  </div>
                  <div className='flex flex-col gap-[.5rem]'>
                     <span className='font-bold'>Location</span>
                     <div className='w-[25.31dvw] h-[2.25rem] flex items-center border-solid border-[1px] border-black'>
                        <input
                           type="text"
                           name="location"
                           className='px-[1rem] text-[.875rem] outline-none w-full'
                           value={location}
                           onChange={(e) => setLocation(e.target.value)}
                        />
                     </div>
                  </div>
                  <div className='flex flex-col gap-[.5rem]'>
                     <span className='font-bold'>Position</span>
                     <span className='text-[.875rem] text-[#4B5563]'>Click on the map to position the kiosk</span>
                  </div>
               </div>
               <div className='flex gap-[1rem]'>
                  <button
                     className="w-[12.03dvw] h-[2.5rem] border-solid border-[1px] border-[#4B5563] shadow-md cursor-pointer 
              transition duration-300 ease-in-out transform hover:scale-105 hover:bg-gray-100 
              active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                     onClick={handleCancel}
                  >
                     <span className="text-[.875rem]">Cancel</span>
                  </button>
                  <button
                     className="w-[12.03dvw] h-[2.5rem] bg-[#4329D8] border-solid border-[1px] border-[#4B5563] 
              shadow-md disabled:bg-gray-400 cursor-pointer transition duration-300 ease-in-out transform 
              hover:scale-105 hover:bg-[#3621a9] active:scale-95 focus:outline-none 
              focus:ring-2 focus:ring-indigo-500"
                     onClick={handleSubmit}
                  >
                     <span className="text-[.875rem] text-white">Submit</span>
                  </button>

               </div>
            </div>
            <div className='w-[48rem] h-[48rem] bg-[#FBFCF8] p-[1rem] shadow-md overflow-auto'>
               <CampusMap mode={import.meta.env.VITE_ADD_KIOSK} onPositionSelect={handleMapClick} />
            </div>
         </div>
      </div>
   )
}

export default AddOrEditKiosk

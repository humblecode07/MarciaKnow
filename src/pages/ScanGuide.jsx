import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import CampusMap from '../components/TestKiosk/CampusMap';
import { fetchBuilding, fetchKiosk, fetchRoom, logQrCodeScan } from '../api/api';
import SearchIcon from '../assets/Icons/SearchIcon';
import LibraryIcon from '../assets/Icons/LibraryIcon';
import BuildingIcon from '../assets/Icons/BuildingIcon';
import RegisterIcon from '../assets/Icons/RegisterIcon';
import yangaLogo from '../../public/Photos/yangaLogo.png'

const ScanGuide = () => {
   const { buildingID, kioskID, roomID } = useParams();

   const [currentPath, setCurrentPath] = useState([]);
   const [kiosk, setKiosk] = useState();
   const [room, setRoom] = useState();
   const [building, setBuilding] = useState();
   const [showSidebar, setShowSidebar] = useState(false);
   const [scanLogged, setScanLogged] = useState(false);

   useEffect(() => {
      const logScan = async () => {
         if (buildingID && kioskID && !scanLogged) {
            try {
               await logQrCodeScan(buildingID, kioskID, building?.name);
               setScanLogged(true);
               console.log('QR scan logged successfully');
            } 
            catch (error) {
               console.error('Failed to log QR scan:', error);
            }
         }
      };

      logScan();
   }, [buildingID, kioskID, building?.name, scanLogged]);

   useEffect(() => {
      if (roomID) {
         const fetchRoomData = async () => {
            try {
               const response = await fetchRoom(buildingID, roomID);

               setRoom(response);
               setCurrentPath(response.navigationPath)
            }
            catch (error) {
               console.error(error);
            }
         }

         fetchRoomData();
      }
      const fetchBuildingData = async () => {
         try {
            const response = await fetchBuilding(buildingID);
            setBuilding(response);
            setCurrentPath(response.navigationPath[kioskID])
         }
         catch (error) {
            console.error(error);
         }
      }

      const fetchKioskData = async () => {
         try {
            const response = await fetchKiosk(kioskID);
            setKiosk(response);
         }
         catch (error) {
            console.error(error);
         }
      }

      fetchBuildingData();
      fetchKioskData();

   }, [buildingID, roomID, kioskID])

   console.log(kiosk);

   return (
      <div className='flex flex-col lg:flex-row min-h-screen bg-gray-50'>
         {/* Mobile Header */}
         <div className='lg:hidden bg-[#FBFCF8] shadow-md p-4 relative z-20'>
            <div className="flex items-center justify-between">
               <div className="flex gap-2 items-center">
                  <img
                     src={yangaLogo}
                     alt=""
                     className='w-12 h-12 object-cover'
                  />
                  <div className='flex flex-col font-righteous'>
                     <span className='text-lg text-[#110D79]'>Marcia<span className='text-[#DBB341]'>Know</span></span>
                     <span className='text-xs text-[#00AF26]'>Your way around campus</span>
                  </div>
               </div>
               <button
                  onClick={() => setShowSidebar(!showSidebar)}
                  className='w-10 h-10 bg-[#4329D8] text-white rounded-lg flex items-center justify-center'
               >
                  <span className='text-lg'>☰</span>
               </button>
            </div>

            {/* Mobile Status Bar */}
            <div className='mt-3 flex items-center justify-between bg-[#DBB341] px-4 py-2 rounded-lg text-white text-sm'>
               <div className='flex gap-2 items-center'>
                  <span className='font-medium'>{kiosk?.name || 'Loading...'}</span>
                  <span className={`font-semibold text-xs px-2 py-1 rounded ${kiosk?.status === 'online' ? 'bg-[#1EAF34]' : 'bg-red-500'}`}>
                     {kiosk?.status ? kiosk.status.charAt(0).toUpperCase() + kiosk.status.slice(1) : 'Unknown'}
                  </span>
               </div>
               <div className="text-right text-xs">
                  <div>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  <div>{new Date().toLocaleDateString()}</div>
               </div>
            </div>
         </div>

         {/* Sidebar - Mobile Overlay / Desktop Static */}
         <div className={`
            fixed lg:static inset-y-0 left-0 z-30 
            w-full sm:w-80 lg:w-[18.75rem] 
            bg-[#FBFCF8] shadow-lg lg:shadow-md
            transform ${showSidebar ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
            transition-transform duration-300 ease-in-out
            flex flex-col
            ${showSidebar ? 'lg:mt-0' : 'lg:mt-[3.25rem]'}
         `}>
            {/* Desktop Header */}
            <div className="hidden lg:flex gap-2 px-4 py-4">
               <img
                  src={yangaLogo}
                  alt=""
                  className='w-[6.25rem] h-[6.25rem] object-cover'
               />
               <div className='w-40 flex flex-col font-righteous text-center'>
                  <span className='text-[1.75rem] text-[#110D79]'>Marcia<span className='text-[#DBB341]'>Know</span></span>
                  <span className='text-[1.125rem] text-[#00AF26]'>Your way around the campus</span>
               </div>
            </div>

            {/* Mobile Close Button */}
            <div className='lg:hidden flex justify-between items-center p-4 border-b'>
               <span className='font-righteous text-lg text-[#110D79]'>Navigation Guide</span>
               <button
                  onClick={() => setShowSidebar(false)}
                  className='w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center'
               >
                  ✕
               </button>
            </div>

            {/* Search Bar */}
            <div className='mx-4 mt-4 lg:mt-8'>
               <div className='h-9 lg:h-[2.25rem] border border-black flex items-center gap-3 px-4 bg-white'>
                  <SearchIcon />
                  <input
                     type="text"
                     placeholder='Search for a building or room...'
                     className='flex-1 outline-none font-roboto text-sm'
                     value={building?.name || ''}
                     readOnly
                  />
               </div>
            </div>

            {/* Navigation Guide */}
            <div className='flex-1 flex flex-col font-righteous px-4 mt-6 overflow-y-auto'>
               <span className='text-lg mb-4'>Navigation Guide:</span>
               <div className='flex flex-col gap-4 flex-1'>
                  {building?.navigationGuide?.[kioskID]?.length > 0 ? (
                     building.navigationGuide[kioskID].map((path, index) => (
                        <div
                           className='flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 border border-gray-100'
                           key={path.id || `path-${index}`}
                        >
                           <div className='w-10 h-10 border border-black rounded-md flex items-center justify-center flex-shrink-0 bg-white'>
                              <img
                                 src={path.icon}
                                 alt={path.iconAlt || `Navigation step ${index + 1}`}
                                 className='w-6 h-6 object-contain'
                                 onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'block';
                                 }}
                              />
                              <span className='hidden text-xs text-gray-400'>📍</span>
                           </div>
                           <div className='flex-1 min-w-0'>
                              <p className='font-roboto text-sm leading-relaxed break-words'>
                                 {path.description}
                              </p>
                           </div>
                        </div>
                     ))
                  ) : (
                     <div className='flex flex-col items-center justify-center py-8 text-center'>
                        <div className='w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3'>
                           <span className='text-gray-400 text-xl'>🗺️</span>
                        </div>
                        <p className='text-gray-500 font-medium mb-1'>No navigation available</p>
                        <p className='text-gray-400 text-sm'>
                           Navigation guide for this location is currently unavailable.
                        </p>
                     </div>
                  )}
               </div>
            </div>

            {/* Bottom Buttons */}
            <div className='mt-auto'>
               {/* Help Buttons */}
               <div className='flex flex-col sm:flex-row font-righteous text-sm'>
                  <button className='flex-1 h-12 lg:h-14 bg-[#4329D8] flex justify-center items-center border border-black text-white hover:bg-[#3620b8] transition-colors'>
                     Need Help?
                  </button>
                  <button className='flex-1 h-12 lg:h-14 bg-[#4329D8] flex justify-center items-center border border-black text-white hover:bg-[#3620b8] transition-colors'>
                     Reports & Feedback
                  </button>
               </div>

               {/* Desktop Status Bar */}
               <div className='hidden lg:flex h-14 items-center justify-between bg-[#DBB341] px-5 text-white'>
                  <div className='flex gap-4'>
                     <span>{kiosk?.name}</span>
                     <span className={`font-semibold ${kiosk?.status === 'online' ? 'text-[#1EAF34]' : 'text-red-500'}`}>
                        {kiosk?.status ? kiosk.status.charAt(0).toUpperCase() + kiosk.status.slice(1) : 'Unknown'}
                     </span>
                  </div>
                  <div className="flex flex-col text-center text-sm">
                     <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                     <span>{new Date().toLocaleDateString()}</span>
                  </div>
               </div>
            </div>
         </div>

         {/* Overlay for mobile sidebar */}
         {showSidebar && (
            <div
               className='fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden'
               onClick={() => setShowSidebar(false)}
            />
         )}

         {/* Map Container */}
         <div className='flex-1 flex flex-col lg:ml-0'>
            {/* Mobile Map Toggle Button */}
            <div className='lg:hidden bg-white shadow-sm p-3 border-b'>
               <button
                  onClick={() => setShowSidebar(true)}
                  className='w-full py-2 px-4 bg-[#4329D8] text-white rounded-lg font-medium hover:bg-[#3620b8] transition-colors'
               >
                  View Navigation Guide
               </button>
            </div>

            {/* Map */}
            <div className='flex-1 relative min-h-[60vh] lg:min-h-0'>
               <div className='absolute inset-0 w-full h-full'>
                  <CampusMap
                     mode={import.meta.env.VITE_QR_CODE_KIOSK}
                     currentPath={currentPath}
                     setCurrentPath={setCurrentPath}
                     width={'80dvw'}
                     height={'100dvh'}
                  />
               </div>
            </div>
         </div>
      </div>
   )
}

export default ScanGuide
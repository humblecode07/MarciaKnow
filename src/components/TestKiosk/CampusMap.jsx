import { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import * as d3 from 'd3';
import XIcon from '../../assets/Icons/XIcon';
import InfoIcon from '../../assets/Icons/InfoIcon';
import QRCodeIcon from '../../assets/Icons/QRCodeIcon';
import SentIconSMIcon from '../../assets/Icons/SentIconSMIcon';
import FullscreenIcon from '../../assets/Icons/FullscreenIcon';
import { fetchBuilding, fetchBuildings, fetchRoom } from '../../api/api';
import { useLocation } from 'react-router-dom';
import useRenderMap from '../../hooks/useRenderMap';
import usePathNavigation from '../../hooks/usePathNavigation';
import QRCode from "react-qr-code";

// Panel types enum for better state management
const PANEL_TYPES = {
   NONE: 'none',
   BUILDING_OVERVIEW: 'buildingOverview',
   BUILDING_INFO: 'buildingInfo',
   BUILDING_QR: 'buildingQR',
   ROOM_DETAIL: 'roomDetail',
   ROOM_QR: 'roomQR',
   FULLSCREEN_GALLERY: 'fullscreenGallery'
};

const CampusMap = ({
   mode,
   coordinates,
   onPositionSelect,
   data,
   currentPath,
   setCurrentPath,
   kiosk,
   setKiosk,
   setRoom,
   setBuilding,
   height,
   width,
   kiosksData
}) => {
   const location = useLocation();
   const path = location.pathname;
   const svgRef = useRef(null);

   // Consolidated state management
   const [buildings, setBuildings] = useState([]);
   const [selectedBuilding, setSelectedBuilding] = useState(null);
   const [selectedRoom, setSelectedRoom] = useState(null);
   const [currentPanel, setCurrentPanel] = useState(PANEL_TYPES.NONE);
   const [isLoadingBuildings, setIsLoadingBuildings] = useState(true);

   // Gallery state
   const [galleryImages, setGalleryImages] = useState([]);
   const [currentImageIndex, setCurrentImageIndex] = useState(0);
   const [galleryTitle, setGalleryTitle] = useState('');

   // Memoized values for performance
   const shouldShowBuildingPanels = useMemo(() => {
      return selectedBuilding && mode !== import.meta.env.VITE_ADD_KIOSK;
   }, [selectedBuilding, mode]);

   const currentKiosk = useMemo(() => {
      return data?.selectedKiosk || kiosk;
   }, [data?.selectedKiosk, kiosk]);

   const availableRooms = useMemo(() => {
      if (!selectedBuilding?.existingRoom?.[currentKiosk?.kioskID]) return [];
      return selectedBuilding.existingRoom[currentKiosk.kioskID];
   }, [selectedBuilding, currentKiosk]);

   // Event handlers
   const handleSelectBuilding = useCallback((building) => {
      setSelectedBuilding(building);
      setCurrentPanel(PANEL_TYPES.BUILDING_OVERVIEW);
   }, []);

   const closeAllPanels = useCallback(() => {
      setSelectedBuilding(null);
      setSelectedRoom(null);
      setCurrentPanel(PANEL_TYPES.NONE);
      setGalleryImages([]);
      setCurrentImageIndex(0);
      setGalleryTitle('');
   }, []);

   const handleShowQRCode = useCallback((mode) => {
      if (mode === 'building') setCurrentPanel(PANEL_TYPES.BUILDING_QR);
      else if (mode === 'room') setCurrentPanel(PANEL_TYPES.ROOM_QR);
   }, []);

   const handleShowBuildingInfo = useCallback(() => {
      setCurrentPanel(PANEL_TYPES.BUILDING_INFO);
   }, []);

   const handleKioskChange = useCallback((e) => {
      const newKioskId = e.target.value;
      const newKiosk = kiosksData?.find(k => k.kioskID === newKioskId);

      if (!newKiosk) return;

      // Store current navigation state before switching
      const currentNavigationState = {
         selectedRoom,
         selectedBuilding,
         currentPanel
      };

      // Update the kiosk
      setKiosk(newKiosk);

      // If we have an active room navigation, update it for the new kiosk
      if (selectedRoom && selectedBuilding) {
         updateRoomNavigationForNewKiosk(newKiosk, selectedRoom, selectedBuilding);
      }
      // If we have an active building navigation, update it for the new kiosk
      else if (selectedBuilding && currentPanel === PANEL_TYPES.BUILDING_OVERVIEW) {
         updateBuildingNavigationForNewKiosk(newKiosk, selectedBuilding);
      }
   }, [kiosksData, setKiosk, selectedRoom, selectedBuilding, currentPanel]);

   const updateRoomNavigationForNewKiosk = useCallback((newKiosk, room, building) => {
      const roomsForNewKiosk = building.existingRoom?.[newKiosk.kioskID];

      if (!roomsForNewKiosk) {
         console.log(`No rooms available for kiosk ${newKiosk.kioskID} in building ${building.name}`);
         // Clear navigation if room doesn't exist for this kiosk
         setCurrentPath(null);
         return;
      }

      // Find the same room in the new kiosk's data
      const updatedRoomData = roomsForNewKiosk.find(r => r._id === room._id);

      if (updatedRoomData) {
         // Room exists for new kiosk, update navigation
         const roomWithBuilding = {
            ...updatedRoomData,
            building: building.name
         };

         setSelectedRoom(roomWithBuilding);

         // Update navigation path if it exists
         if (updatedRoomData.navigationPath && updatedRoomData.navigationPath.length > 0) {
            console.log(`✅ Updated room navigation for kiosk ${newKiosk.kioskID}:`, updatedRoomData.navigationPath);
            setCurrentPath([...updatedRoomData.navigationPath]);
            setRoom(roomWithBuilding); // Update parent state
         } else {
            // No navigation path for this kiosk, use kiosk position as starting point
            const kioskPosition = getKioskPosition(newKiosk);
            console.log(`⚠ No navigation path for room from kiosk ${newKiosk.kioskID}, using kiosk position`);
            setCurrentPath([kioskPosition]);
         }
      } else {
         console.log(`Room ${room.name} not available from kiosk ${newKiosk.kioskID}`);
         // Room doesn't exist for this kiosk, clear navigation
         setCurrentPath(null);
         // Optionally, you could show a message to the user or redirect to building overview
      }
   }, [setSelectedRoom, setCurrentPath, setRoom]);

   const updateBuildingNavigationForNewKiosk = useCallback((newKiosk, building) => {
      if (building.navigationPath && building.navigationPath[newKiosk.kioskID]) {
         const newPath = building.navigationPath[newKiosk.kioskID];
         console.log(`✅ Updated building navigation for kiosk ${newKiosk.kioskID}:`, newPath);
         setCurrentPath([...newPath]);
         setBuilding(building); // Update parent state
      } else {
         // No navigation path for this kiosk to the building
         console.log(`⚠ No navigation path to building ${building.name} from kiosk ${newKiosk.kioskID}`);
         const kioskPosition = getKioskPosition(newKiosk);
         setCurrentPath([kioskPosition]);
      }
   }, [setCurrentPath, setBuilding]);

   // Utility function to extract kiosk position consistently
   const getKioskPosition = useCallback((kiosk) => {
      return {
         x: kiosk.x || kiosk.positionX || kiosk.position?.x || kiosk.coordinates?.x || 0,
         y: kiosk.y || kiosk.positionY || kiosk.position?.y || kiosk.coordinates?.y || 0
      };
   }, []);

   const handleRoomClick = useCallback((room) => {
      // Prevent room selection when building info panel is open
      if (currentPanel === PANEL_TYPES.BUILDING_INFO) return;

      setSelectedRoom({ ...room, building: selectedBuilding.name });
      setCurrentPanel(PANEL_TYPES.ROOM_DETAIL);
   }, [currentPanel, selectedBuilding]);

   const handleFullscreenGallery = useCallback((images, title, startIndex = 0) => {
      setGalleryImages(images);
      setGalleryTitle(title);
      setCurrentImageIndex(startIndex);
      setCurrentPanel(PANEL_TYPES.FULLSCREEN_GALLERY);
   }, []);

   const navigateGallery = useCallback((direction) => {
      setCurrentImageIndex(prev => {
         if (direction === 'next') {
            return prev >= galleryImages.length - 1 ? 0 : prev + 1;
         } else {
            return prev <= 0 ? galleryImages.length - 1 : prev - 1;
         }
      });
   }, [galleryImages.length]);

   // Navigation handlers
   const handleRoomNavigation = useCallback(() => {
      if (!selectedRoom?.navigationPath || !currentKiosk) return;

      // Ensure we're using the most up-to-date navigation path for current kiosk
      const roomsForCurrentKiosk = selectedBuilding?.existingRoom?.[currentKiosk.kioskID];
      const currentRoomData = roomsForCurrentKiosk?.find(room => room._id === selectedRoom._id);

      if (currentRoomData?.navigationPath) {
         console.log('🚀 Starting room navigation from current kiosk:', currentKiosk.kioskID);
         setCurrentPath([...currentRoomData.navigationPath]);
         setRoom({ ...currentRoomData, building: selectedBuilding.name });
         closeAllPanels();
      } else {
         console.log('⚠ No navigation path available for this room from current kiosk');
         // Optionally show a message to user
      }
   }, [selectedRoom, currentKiosk, selectedBuilding, setCurrentPath, setRoom, closeAllPanels]);

   const handleBuildingNavigation = useCallback(() => {
      if (!selectedBuilding?.navigationPath?.[currentKiosk?.kioskID]) {
         console.log('⚠ No navigation path available to this building from current kiosk');
         return;
      }

      const newPath = selectedBuilding.navigationPath[currentKiosk.kioskID];
      console.log('🚀 Starting building navigation from current kiosk:', currentKiosk.kioskID);
      setCurrentPath([...newPath]);
      setBuilding(selectedBuilding);
      closeAllPanels();
   }, [selectedBuilding, currentKiosk, setCurrentPath, setBuilding, closeAllPanels]);

   const searchParams = new URLSearchParams(location.search);

   useEffect(() => {
      const searchParams = new URLSearchParams(location.search);
      const roomId = searchParams.get('roomId');
      const buildingId = searchParams.get('buildingId');
      const kioskId = searchParams.get('kioskId');
      const shouldShowPath = searchParams.get('showPath') === 'true';

      // Only proceed if we have all required parameters
      if (roomId && buildingId && kioskId && shouldShowPath && buildings.length > 0) {
         const initializeFromURL = async () => {
            try {
               // First, find and set the kiosk
               const targetKiosk = kiosksData?.find(k => k.kioskID === kioskId);
               if (targetKiosk && targetKiosk.kioskID !== currentKiosk?.kioskID) {
                  setKiosk(targetKiosk);
               }

               // Find the building
               const targetBuilding = buildings.find(b => b._id === buildingId);
               if (!targetBuilding) {
                  console.error('Building not found:', buildingId);
                  return;
               }

               // Set the building
               setSelectedBuilding(targetBuilding);

               // Find the room in the building's rooms for the specific kiosk
               const roomsForKiosk = targetBuilding.existingRoom?.[kioskId];
               if (!roomsForKiosk) {
                  console.error('No rooms found for kiosk:', kioskId);
                  return;
               }

               const targetRoom = roomsForKiosk.find(room => room._id === roomId);
               if (!targetRoom) {
                  console.error('Room not found:', roomId);
                  return;
               }

               // Set the room with building info
               const roomWithBuilding = {
                  ...targetRoom,
                  building: targetBuilding.name
               };
               setSelectedRoom(roomWithBuilding);

               // Set the navigation path if it exists
               if (targetRoom.navigationPath) {
                  setCurrentPath(targetRoom.navigationPath);
                  setRoom(roomWithBuilding); // Update the parent component's room state
               }

               // Optionally, you can also set the building in parent state
               setBuilding(targetBuilding);

               // Show the room detail panel
               setCurrentPanel(PANEL_TYPES.ROOM_DETAIL);

            } catch (error) {
               console.error('Error initializing from URL:', error);
            }
         };

         initializeFromURL();
      }
   }, [location.search, buildings, kiosksData, currentKiosk?.kioskID, setKiosk, setCurrentPath, setRoom, setBuilding]);

   // Load buildings effect
   useEffect(() => {
      const getBuildings = async () => {
         setIsLoadingBuildings(true);
         try {
            const buildingsData = await fetchBuildings();
            setBuildings(buildingsData);
         } catch (error) {
            console.error("Failed to load buildings:", error);
         } finally {
            setIsLoadingBuildings(false);
         }
      };

      getBuildings();
   }, []);

   // Update room data when kiosk changes
   useEffect(() => {
      if (!selectedRoom || !selectedBuilding || !currentKiosk) return;

      // Get the updated room data for the current kiosk
      const roomsForCurrentKiosk = selectedBuilding.existingRoom?.[currentKiosk.kioskID];
      const updatedRoomData = roomsForCurrentKiosk?.find(room => room._id === selectedRoom._id);

      if (updatedRoomData) {
         // Room exists for current kiosk
         const roomWithBuilding = {
            ...updatedRoomData,
            building: selectedBuilding.name
         };

         // Only update if the navigation path has actually changed
         const currentNavPath = JSON.stringify(selectedRoom.navigationPath || []);
         const newNavPath = JSON.stringify(updatedRoomData.navigationPath || []);

         if (currentNavPath !== newNavPath) {
            console.log('🔄 Room navigation path changed for new kiosk');
            setSelectedRoom(roomWithBuilding);

            // Don't update currentPath here - let the parent component handle it
            // The parent component will handle the path update through its own useEffect
         }
      } else {
         // Room doesn't exist for current kiosk
         console.log(`❌ Room ${selectedRoom.name} not available from kiosk ${currentKiosk.kioskID}`);
         // Clear the selected room since it doesn't exist for this kiosk
         setSelectedRoom(null);
         setCurrentPanel(PANEL_TYPES.NONE);
      }
   }, [currentKiosk?.kioskID, selectedRoom?._id, selectedBuilding?._id]);

   console.log(coordinates);

   // Render map hook
   useRenderMap(
      svgRef,
      buildings,
      selectedBuilding,
      handleSelectBuilding,
      mode,
      coordinates,
      onPositionSelect,
      currentKiosk,
      currentPath,
      setCurrentPath,
      isLoadingBuildings
   );

   // Keyboard navigation for gallery
   useEffect(() => {
      const handleKeyPress = (e) => {
         if (currentPanel === PANEL_TYPES.FULLSCREEN_GALLERY) {
            switch (e.key) {
               case 'ArrowLeft':
                  navigateGallery('prev');
                  break;
               case 'ArrowRight':
                  navigateGallery('next');
                  break;
               case 'Escape':
                  setCurrentPanel(PANEL_TYPES.BUILDING_OVERVIEW);
                  break;
            }
         }
      };

      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
   }, [currentPanel, navigateGallery]);



   console.log(currentKiosk);

   // Helper function to get image URL
   const getImageUrl = useCallback((imagePath) => {
      if (!imagePath) return "https://placehold.co/600x400?text=No+Image";
      return `${import.meta.env.VITE_BASE_URL}/image/${imagePath}`;
   }, []);

   return (
      <section
         className='relative flex flex-col gap-[1rem]'
         style={{ height, width }}
      >
         {mode === import.meta.env.VITE_TEST_KIOSK && kiosksData && (
            <div className="w-[49.4375rem] h-[2.25rem] flex items-center justify-center bg-[#D1D6FA] border-solid border-[1px] border-[#110D79] relative z-[20]">
               <select
                  id="kioskSelect"
                  aria-label="Select a kiosk"
                  className="w-[37.54dvw] h-full bg-transparent outline-none text-[.875rem] text-[#110D79] font-bold"
                  value={currentKiosk?.kioskID || ''}
                  onChange={handleKioskChange}
               >
                  {kiosksData.map((k) => (
                     <option
                        value={k.kioskID}
                        key={k.kioskID}
                        className="bg-[#D1D6FA] text-black text-[.875rem]"
                     >
                        {k.name}
                     </option>
                  ))}
               </select>
            </div>
         )}
         {/* Main SVG Map */}
         <svg
            ref={svgRef}
            width={width}
            height="100%"
            style={{ border: '1px solid #ccc' }}
            preserveAspectRatio='xMidYMid meet'
         />

         {/* Buildings Overview Panel */}
         {shouldShowBuildingPanels && currentPanel === PANEL_TYPES.BUILDING_OVERVIEW && (
            <div className="w-full h-[18.125rem] px-[.875rem] py-[1.5625rem] absolute bottom-0 left-0 flex flex-col gap-[.875rem] text-white z-20">
               <div className='absolute inset-0 bg-black opacity-40 z-0'></div>

               <div className='flex justify-between items-center relative z-10'>
                  <h3 className='text-[1.5rem] font-roboto font-bold'>{selectedBuilding?.name}</h3>
                  <div className='flex gap-[.875rem] text-white'>
                     <div
                        onClick={handleShowBuildingInfo}
                        className="w-[1.75rem] h-[1.75rem] flex justify-center items-center bg-[#505050] rounded-md cursor-pointer transition-all duration-300 ease-in-out hover:bg-[#6b6b6b] hover:scale-110"
                     >
                        <InfoIcon />
                     </div>
                     <div
                        onClick={closeAllPanels}
                        className='w-[1.75rem] h-[1.75rem] flex justify-center items-center bg-[#505050] rounded-md cursor-pointer transition-all duration-300 ease-in-out hover:bg-[#6b6b6b] hover:scale-110'
                     >
                        <XIcon />
                     </div>
                  </div>
               </div>

               <div className='flex gap-[.875rem] relative z-10 overflow-x-auto'>
                  {availableRooms.length > 0 ? (
                     availableRooms.map((room) => (
                        <div
                           key={room._id}
                           className='w-[13.9375rem] flex flex-col gap-[0.875rem] items-center cursor-pointer transition-all duration-300 ease-in-out hover:opacity-80 flex-shrink-0'
                           onClick={() => handleRoomClick(room)}
                        >
                           <img
                              className="w-full h-[10.5625rem] object-cover overflow-hidden rounded-md"
                              src={getImageUrl(room?.image?.[0]?.file_path)}
                              alt={room.name}
                              onError={(e) => {
                                 e.target.onerror = null;
                                 e.target.src = "https://placehold.co/600x400?text=No+Image";
                              }}
                           />
                           <span className="text-center text-sm w-full truncate">
                              {room.name}
                           </span>
                        </div>

                     ))
                  ) : (
                     <div className="flex items-center justify-center w-full text-gray-300">
                        No rooms available for this kiosk
                     </div>
                  )}
               </div>
            </div>
         )}

         {/* Building Info Panel */}
         {shouldShowBuildingPanels && currentPanel === PANEL_TYPES.BUILDING_INFO && (
            <>
               <div className='absolute inset-0 bg-black opacity-40 z-10'></div>
               <div className="w-[28.8125rem] h-[25.5rem] flex flex-col gap-[1.3125rem] absolute z-20 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white shadow-lg rounded-lg overflow-hidden">
                  <div className='w-full h-[11.375rem] flex relative'>
                     <img
                        src={getImageUrl(selectedBuilding?.image?.[0]?.file_path)}
                        alt={selectedBuilding?.name || 'Building'}
                        className='w-full h-full object-cover absolute'
                     />

                     <div className='w-full p-[15px] flex justify-end gap-[0.9375rem] z-10'>
                        <div
                           onClick={() => handleFullscreenGallery(
                              selectedBuilding?.image || [],
                              `${selectedBuilding?.name} - Images`,
                              0
                           )}
                           className='w-[1.75rem] h-[1.75rem] flex justify-center items-center bg-[#505050] rounded-md cursor-pointer transition-all duration-300 ease-in-out hover:bg-[#6b6b6b] hover:scale-110'
                        >
                           <FullscreenIcon />
                        </div>
                        <div
                           onClick={() => setCurrentPanel(PANEL_TYPES.BUILDING_OVERVIEW)}
                           className='w-[1.75rem] h-[1.75rem] flex justify-center items-center bg-[#505050] rounded-md cursor-pointer transition-all duration-300 ease-in-out hover:bg-[#6b6b6b] hover:scale-110'
                        >
                           <XIcon />
                        </div>
                     </div>
                  </div>

                  <div className='flex flex-col justify-end gap-[1.3125rem] px-[1.125rem] flex-1'>
                     <div className='flex flex-col gap-[1rem]'>
                        <div className='flex justify-between'>
                           <span className='font-semibold text-[1rem]'>{selectedBuilding?.name}</span>
                           <span className='text-[#505050]'>
                              No. of Floors: <span className='text-black font-semibold'>{selectedBuilding?.numOfFloors}</span>
                           </span>
                        </div>
                        <p className='max-h-[5.25rem] overflow-auto text-[.875rem] text-gray-700 whitespace-pre-wrap'>
                           {selectedBuilding?.description || 'No description available.'}
                        </p>
                     </div>

                     {/* Image Gallery Thumbnails */}
                     {selectedBuilding?.image && selectedBuilding.image.length > 1 && (
                        <div className='flex gap-2 overflow-x-auto pb-2'>
                           {selectedBuilding.image.slice(0, 4).map((img, index) => (
                              <img
                                 key={index}
                                 src={getImageUrl(img.file_path)}
                                 alt={`${selectedBuilding.name} ${index + 1}`}
                                 className='w-12 h-12 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0'
                                 onClick={() => handleFullscreenGallery(
                                    selectedBuilding.image,
                                    `${selectedBuilding.name} - Images`,
                                    index
                                 )}
                              />
                           ))}
                           {selectedBuilding.image.length > 4 && (
                              <div
                                 className='w-12 h-12 bg-gray-200 rounded flex items-center justify-center cursor-pointer hover:bg-gray-300 transition-colors text-xs font-semibold flex-shrink-0'
                                 onClick={() => handleFullscreenGallery(
                                    selectedBuilding.image,
                                    `${selectedBuilding.name} - Images`,
                                    4
                                 )}
                              >
                                 +{selectedBuilding.image.length - 4}
                              </div>
                           )}
                        </div>
                     )}

                     <div className="flex gap-4 pb-4">
                        <button
                           onClick={handleBuildingNavigation}
                           className="flex-1 h-[2.375rem] flex items-center justify-center gap-[0.6875rem] border-[#110D79] border-[1px] border-solid bg-[#D1D6FA] cursor-pointer transition-all duration-300 ease-in-out hover:bg-[#bfc4f5] hover:scale-105 rounded"
                        >
                           <SentIconSMIcon />
                           <span className='text-[#110D79] font-semibold text-[.875rem]'>Show Navigation</span>
                        </button>
                        <button
                           onClick={() => handleShowQRCode('building')}
                           className="flex-1 h-[2.375rem] flex items-center justify-center gap-[0.6875rem] border-[#F97316] border-[1px] border-solid bg-[#F9731626] cursor-pointer transition-all duration-300 ease-in-out hover:bg-[#f973161a] hover:border-[#d35e12] hover:scale-105 rounded"
                        >
                           <QRCodeIcon />
                           <span className='text-[#F97316] font-semibold text-[.875rem]'>Generate QR Code</span>
                        </button>
                     </div>
                  </div>
               </div>
            </>
         )}
         {shouldShowBuildingPanels && currentPanel === PANEL_TYPES.BUILDING_QR && (
            <>
               <div className='absolute inset-0 bg-black opacity-40 z-10'></div>
               <div className="w-[28.8125rem] h-[25.5rem] flex flex-col gap-[1.3125rem] absolute z-20 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white shadow-lg p-6 overflow-auto rounded-lg">
                  <div className='flex justify-between items-center'>
                     <h3 className='text-[1.25rem] font-semibold'>QR Code for {selectedBuilding?.name}</h3>
                     <div
                        onClick={() => setCurrentPanel(PANEL_TYPES.BUILDING_INFO)}
                        className='w-[1.75rem] h-[1.75rem] flex justify-center items-center bg-[#f0f0f0] rounded-md cursor-pointer transition-all duration-300 ease-in-out hover:bg-[#e0e0e0]'
                     >
                        <XIcon />
                     </div>
                  </div>

                  <div className='flex-1 flex flex-col items-center justify-center'>
                     <div className='w-[200px] h-[200px] bg-[#f0f0f0] flex items-center justify-center border border-gray-300 rounded-lg'>
                        <QRCode value={`${import.meta.env.VITE_BASE_FRONT_URL}/qr-code/${selectedBuilding?._id}/${currentKiosk?.kioskID}`} />
                     </div>
                     <p className='mt-4 text-center text-[.875rem] text-gray-600'>
                        Scan this QR code for information about {selectedBuilding?.name}
                     </p>
                  </div>

                  <div className='flex justify-center gap-4'>
                     <button
                        onClick={() => setCurrentPanel(PANEL_TYPES.BUILDING_INFO)}
                        className="w-[12.25rem] h-[2.375rem] flex items-center justify-center border-[#110D79] border-[1px] border-solid bg-[#D1D6FA] cursor-pointer transition-all duration-300 ease-in-out hover:bg-[#bfc4f5] rounded"
                     >
                        <span className='text-[#110D79] font-semibold text-[.875rem]'>Back to Info</span>
                     </button>
                  </div>
               </div>
            </>
         )}

         {/* Room Detail Panel */}
         {selectedRoom && currentPanel === PANEL_TYPES.ROOM_DETAIL && (
            <>
               <div className='absolute inset-0 bg-black opacity-40 z-10'></div>
               <div className="w-[28.8125rem] h-auto max-h-[25.5rem] flex flex-col gap-[1rem] absolute z-20 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 overflow-auto bg-white shadow-lg p-6 rounded-lg">
                  <div className='flex justify-between items-center gap-4'>
                     <h3 className='text-[1.25rem] font-semibold flex-1'>
                        {selectedRoom.name}
                     </h3>

                     <div
                        onClick={() => setCurrentPanel(PANEL_TYPES.BUILDING_OVERVIEW)}
                        className='flex-shrink-0 w-[1.75rem] h-[1.75rem] flex justify-center items-center bg-[#f0f0f0] rounded-md cursor-pointer hover:bg-[#e0e0e0] transition-colors'
                     >
                        <XIcon />
                     </div>
                  </div>
                  <div className='relative'>
                     <img
                        src={getImageUrl(selectedRoom?.image?.[0]?.file_path)}
                        alt={selectedRoom.name}
                        className="w-full h-[200px] object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => handleFullscreenGallery(
                           selectedRoom?.image || [],
                           `${selectedRoom.name} - Images`,
                           0
                        )}
                        onError={(e) => {
                           e.target.onerror = null;
                           e.target.src = "https://placehold.co/600x400?text=No+Image";
                        }}
                     />
                     {selectedRoom?.image && selectedRoom.image.length > 1 && (
                        <div className='absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs'>
                           1 / {selectedRoom.image.length}
                        </div>
                     )}
                  </div>

                  {/* Room image thumbnails */}
                  {selectedRoom?.image && selectedRoom.image.length > 1 && (
                     <div className='flex gap-2 overflow-x-auto pb-2'>
                        {selectedRoom.image.slice(0, 4).map((img, index) => (
                           <img
                              key={index}
                              src={getImageUrl(img.file_path)}
                              alt={`${selectedRoom.name} ${index + 1}`}
                              className='w-12 h-12 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0'
                              onClick={() => handleFullscreenGallery(
                                 selectedRoom.image,
                                 `${selectedRoom.name} - Images`,
                                 index
                              )}
                           />
                        ))}
                        {selectedRoom.image.length > 4 && (
                           <div
                              className='w-12 h-12 bg-gray-200 rounded flex items-center justify-center cursor-pointer hover:bg-gray-300 transition-colors text-xs font-semibold flex-shrink-0'
                              onClick={() => handleFullscreenGallery(
                                 selectedRoom.image,
                                 `${selectedRoom.name} - Images`,
                                 4
                              )}
                           >
                              +{selectedRoom.image.length - 4}
                           </div>
                        )}
                     </div>
                  )}

                  <div>
                     <p className='text-[#505050] text-sm mb-2'>
                        Located at: <span className='text-black font-semibold'>Floor {selectedRoom.floor}</span>
                     </p>
                     <p className='text-[.875rem] text-gray-700 whitespace-pre-wrap'>{selectedRoom.description || 'No description available.'}</p>
                  </div>

                  <div className='flex justify-center mt-4 gap-4'>
                     <button
                        onClick={handleRoomNavigation}
                        className="flex-1 h-[2.375rem] flex items-center justify-center gap-[0.6875rem] border-[#110D79] border-[1px] border-solid bg-[#D1D6FA] cursor-pointer hover:bg-[#bfc4f5] transition-colors rounded"
                     >
                        <SentIconSMIcon />
                        <span className='text-[#110D79] font-semibold text-[.875rem]'>Navigate to Room</span>
                     </button>
                     <button
                        onClick={() => handleShowQRCode('room')}
                        className="flex-1 h-[2.375rem] flex items-center justify-center gap-[0.6875rem] border-[#F97316] border-[1px] border-solid bg-[#F9731626] cursor-pointer transition-all duration-300 ease-in-out hover:bg-[#f973161a] hover:border-[#d35e12] hover:scale-105 rounded"
                     >
                        <QRCodeIcon />
                        <span className='text-[#F97316] font-semibold text-[.875rem]'>Generate QR Code</span>
                     </button>
                  </div>
               </div>
            </>
         )}
         {shouldShowBuildingPanels && currentPanel === PANEL_TYPES.ROOM_QR && (
            <>
               <div className='absolute inset-0 bg-black opacity-40 z-10'></div>
               <div className="w-[28.8125rem] h-[25.5rem] flex flex-col gap-[1.3125rem] absolute z-20 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white shadow-lg p-6 overflow-auto rounded-lg">
                  <div className='flex justify-between items-center'>
                     <h3 className='text-[1.25rem] font-semibold'>QR Code for {selectedRoom?.name}</h3>
                     <div
                        onClick={() => setCurrentPanel(PANEL_TYPES.BUILDING_INFO)}
                        className='w-[1.75rem] h-[1.75rem] flex justify-center items-center bg-[#f0f0f0] rounded-md cursor-pointer transition-all duration-300 ease-in-out hover:bg-[#e0e0e0]'
                     >
                        <XIcon />
                     </div>
                  </div>

                  <div className='flex-1 flex flex-col items-center justify-center'>
                     <div className='w-[200px] h-[200px] bg-[#f0f0f0] flex items-center justify-center border border-gray-300 rounded-lg'>
                        <QRCode value={`${import.meta.env.VITE_BASE_FRONT_URL}/qr-code/${selectedBuilding?._id}/${currentKiosk?.kioskID}/${selectedRoom._id}`} />
                     </div>
                     <p className='mt-4 text-center text-[.875rem] text-gray-600'>
                        Scan this QR code for information about {selectedRoom?.name}
                     </p>
                  </div>

                  <div className='flex justify-center gap-4'>
                     <button
                        onClick={() => setCurrentPanel(PANEL_TYPES.ROOM_DETAIL)}
                        className="w-[12.25rem] h-[2.375rem] flex items-center justify-center border-[#110D79] border-[1px] border-solid bg-[#D1D6FA] cursor-pointer transition-all duration-300 ease-in-out hover:bg-[#bfc4f5] rounded"
                     >
                        <span className='text-[#110D79] font-semibold text-[.875rem]'>Back to Info</span>
                     </button>
                  </div>
               </div>
            </>
         )}
         {currentPanel === PANEL_TYPES.FULLSCREEN_GALLERY && galleryImages.length > 0 && (
            <div className='fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center'>
               <div className='relative w-full h-full flex items-center justify-center'>
                  {/* Close button */}
                  <button
                     onClick={() => setCurrentPanel(selectedRoom ? PANEL_TYPES.ROOM_DETAIL : PANEL_TYPES.BUILDING_INFO)}
                     className='absolute top-4 right-4 w-10 h-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center text-white transition-all z-10'
                  >
                     <XIcon />
                  </button>

                  {/* Image counter */}
                  <div className='absolute top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full text-sm z-10'>
                     {currentImageIndex + 1} / {galleryImages.length}
                  </div>

                  {/* Main image */}
                  <div className='w-full h-full flex items-center justify-center px-16'>
                     <img
                        src={getImageUrl(galleryImages[currentImageIndex]?.file_path)}
                        alt={`${galleryTitle} ${currentImageIndex + 1}`}
                        className='max-w-full max-h-full object-contain'
                        onError={(e) => {
                           e.target.onerror = null;
                           e.target.src = "https://placehold.co/600x400?text=No+Image";
                        }}
                     />
                  </div>

                  {/* Navigation arrows */}
                  {galleryImages.length > 1 && (
                     <>
                        <button
                           onClick={() => navigateGallery('prev')}
                           className='absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center text-white transition-all text-xl font-bold'
                        >
                           ←
                        </button>
                        <button
                           onClick={() => navigateGallery('next')}
                           className='absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center text-white transition-all text-xl font-bold'
                        >
                           →
                        </button>
                     </>
                  )}

                  {/* Thumbnail strip */}
                  {galleryImages.length > 1 && (
                     <div className='absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 max-w-full overflow-x-auto px-4'>
                        {galleryImages.map((img, index) => (
                           <img
                              key={index}
                              src={getImageUrl(img.file_path)}
                              alt={`Thumbnail ${index + 1}`}
                              className={`w-16 h-12 object-cover rounded cursor-pointer transition-all flex-shrink-0 ${index === currentImageIndex
                                 ? 'ring-2 ring-white opacity-100'
                                 : 'opacity-60 hover:opacity-80'
                                 }`}
                              onClick={() => setCurrentImageIndex(index)}
                           />
                        ))}
                     </div>
                  )}

                  {/* Title */}
                  <div className='absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded text-center'>
                     <h3 className='text-lg font-semibold'>{galleryTitle}</h3>
                  </div>
               </div>
            </div>
         )}
      </section>
   )
}

export default CampusMap
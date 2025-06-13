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
import BuildingLayoutBuilder from '../BuildingLayoutBuilder';
import ExpandableDescription from '../ExpandableDescription';

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

const qrOverlayStyle = {
   position: 'absolute',
   bottom: '56px',
   right: '20px',
   backgroundColor: 'white',
   padding: '12px',
   borderRadius: '8px',
   boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
   zIndex: 30
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
   kiosksData,
   building,
   room,
   panelWidth
}) => {
   const location = useLocation();
   const path = location.pathname;
   const svgRef = useRef(null);

   // Consolidated state management
   const [buildings, setBuildings] = useState([]);
   const [selectedRoom, setSelectedRoom] = useState(null);
   const [currentPanel, setCurrentPanel] = useState(PANEL_TYPES.NONE);
   const [isLoadingBuildings, setIsLoadingBuildings] = useState(true);

   // Gallery state
   const [galleryImages, setGalleryImages] = useState([]);
   const [currentImageIndex, setCurrentImageIndex] = useState(0);
   const [galleryTitle, setGalleryTitle] = useState('');

   const [selectedFloor, setSelectedFloor] = useState('1');
   const [availableFloors, setAvailableFloors] = useState([]);

   const [viewMode, setViewMode] = useState('campus');

   const currentKiosk = useMemo(() => {
      return data?.selectedKiosk || kiosk;
   }, [data?.selectedKiosk, kiosk]);

   const handleKioskChange = useCallback((e) => {
      const newKioskId = e.target.value;
      const newKiosk = kiosksData?.find(k => k.kioskID === newKioskId);

      if (!newKiosk) return;
      setKiosk(newKiosk);

      // Clear current navigation since we're switching kiosks
      setCurrentPath(null);
   }, [kiosksData, setKiosk, setCurrentPath]);

   const navigateGallery = useCallback((direction) => {
      setCurrentImageIndex(prev => {
         if (direction === 'next') {
            return prev >= galleryImages.length - 1 ? 0 : prev + 1;
         } else {
            return prev <= 0 ? galleryImages.length - 1 : prev - 1;
         }
      });
   }, [galleryImages.length]);

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

               console.log(targetBuilding);

               // Set the building
               setBuilding(targetBuilding);

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
      if (!selectedRoom || !building || !currentKiosk) return;

      // Get the updated room data for the current kiosk
      const roomsForCurrentKiosk = building.existingRoom?.[currentKiosk.kioskID];
      const updatedRoomData = roomsForCurrentKiosk?.find(room => room._id === selectedRoom._id);

      if (updatedRoomData) {
         // Room exists for current kiosk
         const roomWithBuilding = {
            ...updatedRoomData,
            building: building.name
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
   }, [currentKiosk?.kioskID, selectedRoom?._id, building?._id]);

   // Render map hook
   useRenderMap(
      svgRef,
      buildings,
      building,
      setBuilding,
      mode,
      coordinates,
      onPositionSelect,
      currentKiosk,
      currentPath,
      setCurrentPath,
      isLoadingBuildings,
      viewMode,
      setViewMode
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

   // Update available floors when building changes
   useEffect(() => {
      if (building?.rooms) {
         const floors = Object.keys(building.rooms).sort();
         setAvailableFloors(floors);
         setSelectedFloor(floors[0] || '1');
      } else {
         setAvailableFloors([]);
      }
   }, [building]);

   // Helper function to get image URL
   const getImageUrl = useCallback((imagePath) => {
      if (!imagePath) return "https://placehold.co/600x400?text=No+Image";
      return `${import.meta.env.VITE_BASE_URL}/image/${imagePath}`;
   }, []);

   console.log('wwababadapdap', building)

   return (
      <section
         className="relative flex flex-col gap-[1rem]"
         style={{ height: mode === import.meta.env.VITE_ADD_ROOM ? '100%' : undefined }}
      >

         {viewMode === 'campus' && (
            <>
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
                  width={mode === import.meta.env.VITE_CLIENT_KIOSK || mode === import.meta.env.VITE_QR_CODE_KIOSK ? width : '100%'}
                  height={mode === import.meta.env.VITE_QR_CODE_KIOSK ? height : "100%"}
                  style={{ border: '1px solid #ccc' }}
                  preserveAspectRatio='xMidYMid meet'
               />

               {/* QR Code Overlay */}
               {building && currentKiosk && (
                  <div style={qrOverlayStyle}>
                     <QRCode
                        value={`${import.meta.env.VITE_BASE_FRONT_URL}/qr-code/${building._id}/${currentKiosk.kioskID}`}
                        size={120}
                     />
                  </div>
               )}

               {/* Rooms Panel - only show if building has rooms */}

               {/* Building Panel - shows for any building, with or without rooms */}
               {building && (
                  <>
                     <div
                        className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg flex flex-col z-20"
                        style={{ width: `${panelWidth}rem` }}
                     >
                        {/* Main panel content - only show if building has rooms */}
                        {building.rooms && Object.keys(building.rooms).length > 0 ? (
                           <div className="flex flex-col gap-[1rem] px-[.75rem] py-[1rem] h-[16rem] overflow-hidden">
                              {/* Header with building name and floor dropdown */}
                              <div className='flex justify-between items-center font-roboto'>
                                 <span className='font-bold text-gray-800'>
                                    {building.name} - Floor {selectedFloor}
                                 </span>
                                 <select
                                    className='border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    value={selectedFloor}
                                    onChange={(e) => setSelectedFloor(e.target.value)}
                                 >
                                    {Object.keys(building.rooms).map(floor => (
                                       <option key={floor} value={floor}>Floor {floor}</option>
                                    ))}
                                 </select>
                              </div>

                              {/* Rooms container with visible scrollbar */}
                              <div className='flex gap-[.75rem] overflow-x-auto pb-2 flex-1'>
                                 {building.rooms[selectedFloor]?.length > 0 ? (
                                    building.rooms[selectedFloor].map(room => (
                                       <div
                                          key={room.id}
                                          className='flex flex-col justify-start gap-[.5rem] flex-shrink-0 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors min-w-[9.5rem] border border-transparent hover:border-gray-200'
                                          onClick={() => {
                                             setRoom(room)
                                             setViewMode('indoor')
                                          }}
                                       >
                                          <img
                                             className="w-[8.25rem] h-[5.5rem] object-cover rounded-[.5rem] border border-gray-200"
                                             src={room.image || ''}
                                             onError={(e) => {
                                                e.currentTarget.src = "https://placehold.co/600x400";
                                             }}
                                             alt={room?.name || room?.label || "Room Image"}
                                          />

                                          {/* Room label container with adequate height */}
                                          <div className='flex flex-col items-center min-h-[2.5rem] justify-center px-1'>
                                             <span className='text-center text-sm font-medium text-gray-700 leading-tight w-full break-words hyphens-auto'>
                                                {room?.name || room?.label || 'Room'}
                                             </span>
                                          </div>
                                       </div>
                                    ))
                                 ) : (
                                    <div className="flex items-center justify-center w-full text-gray-500 text-sm">
                                       No rooms available on this floor
                                    </div>
                                 )}
                              </div>
                           </div>
                        ) : (
                           /* Header for buildings without rooms */
                           <div className="px-[.75rem] py-[1rem]">
                              <div className='flex justify-between items-center font-roboto'>
                                 <span className='font-bold text-gray-800'>
                                    {building.name}
                                 </span>
                              </div>
                           </div>
                        )}

                        {/* Expandable Description - Always show for any building */}
                        <ExpandableDescription
                           building={building}
                           selectedFloor={selectedFloor}
                           hasRooms={building.rooms && Object.keys(building.rooms).length > 0}
                        />
                     </div>
                  </>
               )}
            </>
         )}
         {viewMode === 'indoor' && (
            <BuildingLayoutBuilder
               building={{
                  path: building.builderPath,
               }}
               floors={building.rooms}
               buildingData={building}
               modeType={import.meta.env.VITE_TEST_KIOSK}
               room={room}
               setRoom={setRoom}
               setViewMode={setViewMode}
               width={mode === import.meta.env.VITE_CLIENT_KIOSK ? '50dvw' : '100%'}
               height={'100%'}
            />
         )}
      </section>
   )
}

export default CampusMap
import { useCallback, useEffect, useRef, useState } from 'react'
import * as d3 from 'd3';
import XIcon from '../../assets/Icons/XIcon';
import InfoIcon from '../../assets/Icons/InfoIcon';
import QRCodeIcon from '../../assets/Icons/QRCodeIcon';
import SentIconSMIcon from '../../assets/Icons/SentIconSMIcon';
import FullscreenIcon from '../../assets/Icons/FullscreenIcon';
import { fetchBuildings, fetchKiosks } from '../../api/api';
import { useLocation } from 'react-router-dom';
import useRenderMap from '../../hooks/useRenderMap';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import usePathNavigation from '../../hooks/usePathNavigation';
import QRCode from "react-qr-code";

const CampusMap = ({ mode, coordinates, onPositionSelect, data, currentPath, setCurrentPath }) => {
   const { data: kiosksData, error: kiosksError, isLoading: kiosksLoading } = useQuery({
      queryKey: ['kiosks'],
      queryFn: fetchKiosks,
   });

   const location = useLocation();
   const path = location.pathname;

   const svgRef = useRef(null);

   const [buildings, setBuildings] = useState([]);
   const [selectedBuilding, setSelectedBuilding] = useState(null);
   const [isBuildingInfoPanelOpen, setIsBuildingInfoPanelOpen] = useState(false);
   const [isBuildingQRCodePanelOpen, setIsBuildingQRCodePanelOpen] = useState(false);

   const [isSelectedRoomOpen, setIsSelectedRoomOpen] = useState(false);
   const [selectedRoom, setSelectedRoom] = useState(null);
   const [selectedKiosk, setSelectedKiosk] = useState(null);

   const [kioskCoords, setKioskCoords] = useState(null);
   const [destinationCoords, setDestinationCoords] = useState(null);

   // Functions

   const handleSelectBuilding = useCallback((building) => {
      setSelectedBuilding(building);
   }, []);

   const closeAllPanels = () => {
      setSelectedBuilding(null);
      setIsBuildingInfoPanelOpen(false);
      setIsBuildingQRCodePanelOpen(false);
      setSelectedRoom(null);
   };


   const handleShowQRCode = () => {
      setIsBuildingInfoPanelOpen(false);
      setIsBuildingQRCodePanelOpen(true);
   }

   // Handler for showing building info panel
   const handleShowBuildingInfo = () => {
      setIsBuildingInfoPanelOpen(true);
      setIsBuildingQRCodePanelOpen(false);
   }

   useEffect(() => {
      const getBuildings = async () => {
         try {
            const data = await fetchBuildings();
            setBuildings(data);
         }
         catch (error) {
            console.error("Failed to load buildings:", error);
         }
      };

      getBuildings();
   }, []);

   useEffect(() => {
      if (kiosksData?.length > 0) {
         setSelectedKiosk(kiosksData[0]);
      }
   }, [kiosksData]);

   useEffect(() => {
      if (selectedRoom && selectedBuilding && selectedKiosk) {
         const updatedRoomData = selectedBuilding.existingRoom?.[selectedKiosk.kioskID]?.find(
            (room) => room._id === selectedRoom._id
         );

         if (updatedRoomData) {
            setSelectedRoom({
               ...updatedRoomData,
               building: selectedBuilding.name
            });
            setCurrentPath(updatedRoomData.navigationPath);
         } else {
            // If room doesn't exist for the new kiosk, optionally clear path or notify
            setCurrentPath(null);
         }
      }
   }, [selectedKiosk]);


   const handleRoomNavigation = () => {
      const newPath = selectedRoom.navigationPath;
      setCurrentPath(newPath);

      console.log(selectedRoom);
      console.log("New path being set:", newPath); // Log the actual value being set
   }

   useRenderMap(svgRef, buildings, selectedBuilding, handleSelectBuilding, mode, coordinates, onPositionSelect, data?.selectedKiosk || selectedKiosk, currentPath, setCurrentPath);

   console.log(buildings);
   console.log(selectedBuilding);

   if (kiosksLoading) return <div>Loading...</div>;

   if (kiosksError) {
      console.error('Error fetching kiosks:', kiosksError);
      return <div>Error loading kiosks data.</div>;
   }

   return (
      <section className='w-full h-full relative flex flex-col gap-[1rem]'>
         {mode === import.meta.env.VITE_TEST_KIOSK ?
            <div className="w-[49.4375rem] h-[2.25rem] flex items-center justify-center bg-[#D1D6FA] border-solid border-[1px] border-[#110D79]">

               <select
                  id="kioskSelect"
                  aria-label="Select a kiosk"
                  className="w-[37.54dvw] h-full bg-transparent outline-none text-[.875rem] text-[#110D79] font-bold"
                  onChange={(e) => {
                     const selected = kiosksData.find(kiosk => kiosk.kioskID === e.target.value);
                     setSelectedKiosk(selected);
                  }}
               >
                  {kiosksData?.map((kiosk) => (
                     <option
                        value={kiosk.kioskID}
                        key={kiosk.kioskID}
                        className="bg-[#D1D6FA] text-black text-[.875rem]"
                     >
                        {kiosk.name}
                     </option>
                  ))}
               </select>
            </div> : null}
         <svg
            ref={svgRef}
            width="100%"
            height="100%"
            style={{ border: '1px solid #ccc' }}
            preserveAspectRatio='xMidYMid meet'
         />

         {/* Buildings Overview Panel - Shown when a building is selected but no other panels are open */}
         {mode !== import.meta.env.VITE_ADD_KIOSK && selectedBuilding ? (
            <>
               <div className="w-full h-[18.125rem] px-[.875rem] py-[1.5625rem] absolute bottom-0 left-0 flex flex-col gap-[.875rem] text-white z-20">
                  {/* Overlay with a lower z-index */}
                  <div className='absolute inset-0 bg-black opacity-40 z-0'></div>

                  {/* Content with a higher z-index */}
                  <div className='flex justify-between items-center relative z-10'>
                     <h3 className='text-[1.5rem] font-roboto font-bold'>{selectedBuilding.name}</h3>
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
                     {selectedBuilding.existingRoom && Object.keys(selectedBuilding.existingRoom).length > 0 ? (
                        selectedBuilding.existingRoom[selectedKiosk.kioskID].map((room) => {
                           return (
                              <div
                                 key={room._id}
                                 className='flex flex-col gap-[0.875rem] items-center cursor-pointer transition-all duration-300 ease-in-out hover:opacity-80'
                                 onClick={() => {
                                    setSelectedRoom({ ...room, building: selectedBuilding.name });
                                    setIsSelectedRoomOpen(true);
                                 }}
                              >
                                 <img className='w-[13.9375rem] h-[10.5625rem] object-cover overflow-hidden' src={`http://localhost:3000/image/${room?.image[0].file_path}`} alt={room.name} />
                                 <span>{room.name}</span>
                              </div>
                           );
                        })
                     ) : (
                        <div>No rooms available</div>
                     )}
                  </div>
               </div>

               {/* Building Info Panel */}
               {selectedBuilding && isBuildingInfoPanelOpen && (
                  <>
                     <div className='absolute inset-0 bg-black opacity-40 z-10'></div>
                     <div
                        className="w-[28.8125rem] h-[25.5rem] flex flex-col gap-[1.3125rem] absolute z-20 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white shadow-lg"
                     >
                        <div className='w-[28.8125rem] h-[11.375rem] flex relative'>
                           <img
                              src={`http://localhost:3000/image/${selectedBuilding.image[0].file_path}`}
                              alt={selectedBuilding.name}
                              className='w-full h-full object-cover absolute'
                           />
                           <div className='w-full p-[15px] flex justify-end gap-[0.9375rem] z-10'>
                              <div
                                 className='w-[1.75rem] h-[1.75rem] flex justify-center items-center bg-[#505050] rounded-md cursor-pointer transition-all duration-300 ease-in-out hover:bg-[#6b6b6b] hover:scale-110'
                              >
                                 <FullscreenIcon />
                              </div>
                              <div
                                 onClick={() => setIsBuildingInfoPanelOpen(false)}
                                 className='w-[1.75rem] h-[1.75rem] flex justify-center items-center bg-[#505050] rounded-md cursor-pointer transition-all duration-300 ease-in-out hover:bg-[#6b6b6b] hover:scale-110'
                              >
                                 <XIcon />
                              </div>
                           </div>
                        </div>
                        <div className='flex flex-col justify-end gap-[1.3125rem] px-[1.125rem]'>
                           <div className='flex flex-col gap-[1rem]'>
                              <div className='flex justify-between'>
                                 <span className='font-semibold text-[1rem]'>{selectedBuilding.name}</span>
                                 <span className='text-[#505050]'>No. of Floors: <span className='text-black font-semibold'>{selectedBuilding.numOfFloors}</span></span>
                              </div>
                              <p className='max-h-[5.25rem] overflow-auto text-[.875rem]'>
                                 {selectedBuilding.description}
                              </p>
                           </div>
                           <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
                              <button
                                 onClick={() => handleRoomNavigation()}
                                 className="w-[12.25rem] h-[2.375rem] flex items-center justify-center gap-[0.6875rem] border-[#110D79] border-[1px] border-solid bg-[#D1D6FA] cursor-pointer transition-all duration-300 ease-in-out hover:bg-[#bfc4f5] hover:scale-105"
                              >
                                 <SentIconSMIcon />
                                 <span className='text-[#110D79] font-semibold text-[.875rem]'>Show Navigation</span>
                              </button>

                              <button
                                 onClick={handleShowQRCode}
                                 className="w-[12.25rem] h-[2.375rem] flex items-center justify-center gap-[0.6875rem] border-[#F97316] border-[1px] border-solid bg-[#F9731626] cursor-pointer transition-all duration-300 ease-in-out hover:bg-[#f973161a] hover:border-[#d35e12] hover:scale-105"
                              >
                                 <QRCodeIcon />
                                 <span className='text-[#F97316] font-semibold text-[.875rem]'>Generate QR Code</span>
                              </button>
                           </div>
                        </div>
                     </div>
                  </>
               )}

               {/* QR Code Panel */}
               {selectedBuilding && isBuildingQRCodePanelOpen && (
                  <>
                     <div className='absolute inset-0 bg-black opacity-40 z-10'></div>
                     <div className="w-[28.8125rem] h-[25.5rem] flex flex-col gap-[1.3125rem] absolute z-20 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white shadow-lg p-6 overflow-auto">
                        <div className='flex justify-between items-center'>
                           <h3 className='text-[1.25rem] font-semibold'>QR Code for {selectedBuilding.name}</h3>
                           <div
                              onClick={() => setIsBuildingQRCodePanelOpen(false)}
                              className='w-[1.75rem] h-[1.75rem] flex justify-center items-center bg-[#f0f0f0] rounded-md cursor-pointer transition-all duration-300 ease-in-out hover:bg-[#e0e0e0]'
                           >
                              <XIcon />
                           </div>
                        </div>

                        <div className='flex-1 flex flex-col items-center justify-center'>
                           {/* Placeholder for QR Code - in a real implementation you'd generate an actual QR code */}
                           <div className='w-[200px] h-[200px] bg-[#f0f0f0] flex items-center justify-center border border-gray-300'>
                              <QRCode value={`http://localhost:5173/qr-code/${selectedBuilding._id}/edit-room/${selectedKiosk.kioskID}`} />
                           </div>
                           <p className='mt-4 text-center text-[.875rem] text-gray-600'>
                              Scan this QR code for information about {selectedBuilding.name}
                           </p>
                        </div>

                        <div className='flex justify-center gap-4'>
                           <button
                              onClick={() => setIsBuildingInfoPanelOpen(true) || setIsBuildingQRCodePanelOpen(false)}
                              className="w-[12.25rem] h-[2.375rem] flex items-center justify-center border-[#110D79] border-[1px] border-solid bg-[#D1D6FA] cursor-pointer transition-all duration-300 ease-in-out hover:bg-[#bfc4f5]"
                           >
                              <span className='text-[#110D79] font-semibold text-[.875rem]'>Back to Info</span>
                           </button>
                        </div>
                     </div>
                  </>
               )}
               {selectedRoom && isSelectedRoomOpen && (
                  <>
                     <div className='absolute inset-0 bg-black opacity-40 z-10'></div>
                     <div className="w-[28.8125rem] h-auto max-h-[25.5rem] flex flex-col gap-[1rem] absolute z-20 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 overflow-auto bg-white shadow-lg p-6">
                        <div className='flex justify-between items-center'>
                           <h3 className='text-[1.25rem] font-semibold'>{selectedRoom.name}</h3>
                           <div
                              onClick={() => {
                                 setIsSelectedRoomOpen(false)
                              }}
                              className='w-[1.75rem] h-[1.75rem] flex justify-center items-center bg-[#f0f0f0] rounded-md cursor-pointer hover:bg-[#e0e0e0]'
                           >
                              <XIcon />
                           </div>
                        </div>

                        <img
                           src={`http://localhost:3000/image/${selectedRoom?.image[0].file_path}`}
                           alt={selectedRoom.name}
                           className="w-full h-[200px] object-cover"
                        />

                        <div>
                           <p className='text-[#505050] text-sm mb-2'>Located in: <span className='text-black'>{selectedRoom.building}</span></p>
                           <p className='text-[.875rem]'>{selectedRoom.description}</p>
                        </div>

                        <div className='flex justify-center mt-4 gap-4'>
                           <button
                              onClick={() => {
                                 handleRoomNavigation();
                                 setIsSelectedRoomOpen(false);
                                 setIsBuildingInfoPanelOpen(false);
                              }}
                              className="w-[12.25rem] h-[2.375rem] flex items-center justify-center gap-[0.6875rem] border-[#110D79] border-[1px] border-solid bg-[#D1D6FA] cursor-pointer hover:bg-[#bfc4f5]"
                           >
                              <SentIconSMIcon />
                              <span className='text-[#110D79] font-semibold text-[.875rem]'>Navigate to Room</span>
                           </button>
                           <button
                              className="w-[12.25rem] h-[2.375rem] flex items-center justify-center gap-[0.6875rem] border-[#F97316] border-[1px] border-solid bg-[#F9731626] cursor-pointer transition-all duration-300 ease-in-out hover:bg-[#f973161a] hover:border-[#d35e12] hover:scale-105"
                           >
                              <QRCodeIcon />
                              <span className='text-[#F97316] font-semibold text-[.875rem]'>Generate QR Code</span>
                           </button>
                        </div>
                     </div>
                  </>
               )}
            </>
         ) : null}
      </section>
   )
}

export default CampusMap

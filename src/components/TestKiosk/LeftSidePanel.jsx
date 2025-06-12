import BuildingIcon from "../../assets/Icons/BuildingIcon"
import LibraryIcon from "../../assets/Icons/LibraryIcon"
import RegisterIcon from "../../assets/Icons/RegisterIcon"
import SearchIcon from "../../assets/Icons/SearchIcon"
import yangaLogo from '../../../public/Photos/yangaLogo.png'
import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { fetchBuildings, fetchBuildingsFromSpecificKiosk, fetchRooms, fetchRoomsFromKiosk } from "../../api/api"
import { logDestinationSearch } from "../../api/api"
import FeedbackModal from "../../modals/FeedbackModal"
import NeedHelpModal from "../../modals/NeedHelpModal" // Import the NeedHelpModal
import RoomIcon from "../../assets/Icons/RoomIcon"

const LeftSidePanel = ({
   room,
   building,
   onRoomSelect,
   onBuildingSelect,
   kiosk,
   setCurrentPath,
   width,
   height,
   onTriggerAI // Add this prop to handle AI assistant trigger
}) => {
   const { data: buildings, error: buildingsError, isLoading: buildingsLoading } = useQuery({
      queryKey: ['buildings', kiosk?.kioskID],
      queryFn: () => fetchBuildingsFromSpecificKiosk(kiosk?.kioskID)
   });

   const { data: rooms, error: roomsError, isLoading: roomsLoading } = useQuery({
      queryKey: ['rooms', kiosk?.kioskID],
      queryFn: () => fetchRoomsFromKiosk(kiosk?.kioskID),
   });

   const [search, setSearch] = useState('');
   const [showResults, setShowResults] = useState(false);
   const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
   const [showHelp, setShowHelp] = useState(false); // This will now control NeedHelpModal

   // Filter buildings and rooms based on search input
   const filteredResults = useMemo(() => {
      if (!search.trim()) return { buildings: [], rooms: [] };

      const searchTerm = search.toLowerCase().trim();

      const filteredBuildings = buildings?.filter(building =>
         building.name?.toLowerCase().includes(searchTerm) ||
         building.code?.toLowerCase().includes(searchTerm) ||
         building.description?.toLowerCase().includes(searchTerm)
      ) || [];

      const filteredRooms = rooms?.filter(room =>
         room.name?.toLowerCase().includes(searchTerm) ||
         room.number?.toLowerCase().includes(searchTerm) ||
         room.building?.toLowerCase().includes(searchTerm) ||
         room.description?.toLowerCase().includes(searchTerm)
      ) || [];

      return { buildings: filteredBuildings, rooms: filteredRooms };
   }, [search, buildings, rooms]);

   const handleSearchChange = (e) => {
      const value = e.target.value;
      setSearch(value);
      setShowResults(value.trim().length > 0);
   };

   // Enhanced function to log destination searches
   const logDestinationActivity = async (item, type, searchQuery, isQuickSuggestion = false) => {
      try {
         if (!kiosk?.kioskID) {
            console.warn('Kiosk ID not available for logging');
            return;
         }

         const logData = {
            buildingId: type === 'building' ? item.id : (item.buildingID || null),
            roomId: type === 'room' ? item._id : null,
            searchQuery: searchQuery || search,
            destinationType: type,
            kioskId: kiosk.kioskID
         };

         console.log(item);
         console.log(logData);

         await logDestinationSearch(
            logData.buildingId,
            logData.roomId,
            logData.searchQuery,
            logData.destinationType,
            logData.kioskId
         );

         console.log('Destination search logged successfully:', logData);
      } catch (error) {
         console.error('Failed to log destination search:', error);
      }
   };

   const handleResultClick = async (item, type) => {
      await logDestinationActivity(item, type, search);

      if (type === 'building') {
         onBuildingSelect(item);
         const newPath = item.navigationPath;
         console.log(newPath[kiosk.kioskID]);
         setCurrentPath(newPath[kiosk.kioskID]);
      }
      else if (type === 'room') {
         onRoomSelect(item);
         const newPath = item.navigationPath;
         setCurrentPath(newPath);
      }

      setSearch('');
      setShowResults(false);
   };

   const handleQuickSuggestionClick = async (suggestionType) => {
      let searchQuery = '';
      let destinationType = '';
      let mockItem = null;

      switch (suggestionType) {
         case 'library':
            searchQuery = 'library';
            destinationType = 'room';
            mockItem = rooms?.find(room =>
               room.name?.toLowerCase().includes('library')
            ) || { name: 'Library', _id: null, buildingId: null };
            break;
         case 'sofia':
            searchQuery = 'sofia building 2';
            destinationType = 'building';
            mockItem = buildings?.find(building =>
               building.name?.toLowerCase().includes('sofia') &&
               building.name?.toLowerCase().includes('2')
            ) || { name: 'Sofia Building 2', id: null };
            break;
         case 'cashier':
            searchQuery = 'cashier';
            destinationType = 'room';
            mockItem = rooms?.find(room =>
               room.name?.toLowerCase().includes('cashier')
            ) || { name: 'Cashier', _id: null, buildingId: null };
            break;
      }

      if (mockItem) {
         await logDestinationActivity(mockItem, destinationType, searchQuery, true);
      }

      setSearch(searchQuery);
      setShowResults(true);
   };

   const handleFeedbackClick = () => {
      setIsFeedbackModalOpen(true);
   };

   const handleCloseFeedbackModal = () => {
      setIsFeedbackModalOpen(false);
   };

   // Handle AI assistant trigger from NeedHelpModal
   const handleAITrigger = () => {
      console.log('AI Assistant triggered from Help Modal');
      // Call the parent component's AI trigger function if provided
      if (onTriggerAI) {
         onTriggerAI();
      }
   };

   console.log('building', building);
   console.log('rooms', rooms);

   if (buildingsLoading || roomsLoading) {
      return <div>Loading...</div>;
   }

   if (buildingsError) {
      console.error('Error fetching buildings:', buildingsError);
      return <div>Error loading buildings data.</div>;
   }

   if (roomsError) {
      console.error('Error fetching rooms:', roomsError);
      return <div>Error loading rooms data.</div>;
   }

   return (
      <>
         <section
            className={`py-[1.125rem] flex flex-col bg-[#FBFCF8] shadow-md relative`}
            style={{ width, height }}
         >
            <div className="flex gap-[.5rem] px-[1rem]">
               <img
                  src={yangaLogo}
                  alt=""
                  className='w-[6.25rem] h-[6.25rem] object-cover'
               />
               <div className='w-[10rem] flex flex-col font-righteous text-center'>
                  <span className=' text-[1.75rem] text-[#110D79]'>
                     Marcia<span className='text-[#DBB341]'>Know</span>
                  </span>
                  <span className='text-[1.125rem] text-[#00AF26]'>
                     Your way around the campus
                  </span>
               </div>
            </div>

            {/* Search Input Container */}
            <div className='relative ml-[1rem] mt-[2rem]'>
               <div className='h-[2.25rem] w-[16.75rem] border-solid border-[1px] border-black flex items-center gap-[0.6875rem] px-[1rem] bg-white'>
                  <SearchIcon />
                  <input
                     type="text"
                     placeholder='Search for a building or room...'
                     className='w-[13.25rem] outline-none font-roboto text-[0.875rem] bg-transparent'
                     value={search}
                     onChange={handleSearchChange}
                     onFocus={() => search.trim() && setShowResults(true)}
                  />
               </div>

               {/* Search Results Dropdown */}
               {showResults && (filteredResults.buildings.length > 0 || filteredResults.rooms.length > 0) && (
                  <div className='absolute top-[2.25rem] left-0 w-[16.75rem] max-h-[15rem] bg-white border-[1px] border-black border-t-0 overflow-y-auto z-10 shadow-lg'>
                     {/* Buildings Results */}
                     {filteredResults.buildings.length > 0 && (
                        <div>
                           <div className='px-[1rem] py-[0.5rem] bg-[#f0f0f0] font-righteous text-[0.75rem] text-gray-600 border-b-[1px] border-gray-200'>
                              BUILDINGS
                           </div>
                           {filteredResults.buildings.map((building, index) => (
                              <div
                                 key={`building-${index}`}
                                 className='px-[1rem] py-[0.75rem] hover:bg-[#f9f9f9] cursor-pointer border-b-[1px] border-gray-100 flex items-center gap-[0.75rem]'
                                 onClick={() => handleResultClick(building, 'building')}
                              >
                                 <div className='flex-shrink-0'>
                                    <BuildingIcon />
                                 </div>
                                 <div className='flex flex-col min-w-0 flex-1'>
                                    <span className='text-[0.875rem] font-roboto font-medium truncate'>
                                       {building.name || building.code}
                                    </span>
                                    {building.description && (
                                       <span className='text-[0.75rem] font-roboto text-gray-600 truncate'>
                                          {building.description}
                                       </span>
                                    )}
                                 </div>
                              </div>
                           ))}
                        </div>
                     )}

                     {/* Rooms Results */}
                     {filteredResults.rooms.length > 0 && (
                        <div>
                           <div className='px-[1rem] py-[0.5rem] bg-[#f0f0f0] font-righteous text-[0.75rem] text-gray-600 border-b-[1px] border-gray-200'>
                              ROOMS
                           </div>
                           {filteredResults.rooms.map((room, index) => (
                              <div
                                 key={`room-${index}`}
                                 className='px-[1rem] py-[0.75rem] hover:bg-[#f9f9f9] cursor-pointer border-b-[1px] border-gray-100 flex items-center gap-[0.75rem]'
                                 onClick={() => handleResultClick(room, 'room')}
                              >
                                 <div className='flex-shrink-0'>
                                    <RoomIcon />
                                 </div>
                                 <div className='flex flex-col min-w-0 flex-1'>
                                    <span className='text-[0.875rem] font-roboto font-medium truncate'>
                                       {room.name || room.number}
                                    </span>
                                    {room.buildingName && (
                                       <span className='text-[0.75rem] font-roboto text-gray-600 truncate'>
                                          {room.buildingName}
                                       </span>
                                    )}
                                 </div>
                              </div>
                           ))}
                        </div>
                     )}
                  </div>
               )}

               {/* No Results Message */}
               {showResults && search.trim() && filteredResults.buildings.length === 0 && filteredResults.rooms.length === 0 && (
                  <div className='absolute top-[2.25rem] left-0 w-[16.75rem] bg-white border-[1px] border-black border-t-0 px-[1rem] py-[1rem] text-[0.875rem] text-gray-500 text-center'>
                     No buildings or rooms found
                  </div>
               )}
            </div>

            {/* Main Content Area */}
            <div className='flex-1 min-h-0 flex flex-col mt-[1.5625rem] px-[1rem] pb-[7rem]'>
               {room ? (
                  <div className='flex flex-col font-righteous gap-[1.125rem] h-full'>
                     <span className='text-[1.125rem] flex-shrink-0'>{room.label}</span>
                     <img
                        className="h-[10rem] object-cover rounded-[.5rem]"
                        src={
                           room.image?.[0]?.file_path
                              ? `${import.meta.env.VITE_BASE_URL}/image/${room.image[0].file_path}`
                              : "/placeholder.jpg" // or any default path
                        }
                        onError={(e) => {
                           e.currentTarget.src = "https://placehold.co/600x400"; // fallback if fetch fails
                        }}
                        alt={room.name || "Room Image"}
                     />

                     <span className='text-[1.125rem] flex-shrink-0'>Navigation Guide:</span>
                     <div className='flex flex-col gap-4 flex-1 min-h-0 overflow-y-auto pr-2'>
                        {room.navigationGuide?.length > 0 ? (
                           room.navigationGuide.map((path, index) => (
                              <div
                                 key={path.id || `path-${index}`}
                                 className='flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 border border-gray-100 flex-shrink-0'
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
                                 <span className='text-gray-400 text-xl'>🗺</span>
                              </div>
                              <p className='text-gray-500 font-medium mb-1'>No navigation available</p>
                              <p className='text-gray-400 text-sm'>
                                 Navigation guide for this location is currently unavailable.
                              </p>
                           </div>
                        )}
                     </div>
                  </div>
               ) : building ? (
                  <div className='flex flex-col font-righteous gap-[1.125rem] h-full'>
                     <span className='text-[1.125rem] flex-shrink-0'>{building.name}</span>
                     <img
                        className="h-[10rem] object-cover rounded-[.5rem]"
                        src={
                           building?.image?.[0]?.file_path
                              ? `${import.meta.env.VITE_BASE_URL}/image/${building.image[0].file_path}`
                              : "https://placehold.co/600x400"
                        }
                        onError={(e) => {
                           e.currentTarget.src = "https://placehold.co/600x400"; // fallback if fetch fails
                        }}
                        alt={building?.name || "Building Image"}
                     />

                     <span className='text-[1] flex-shrink-0'>Navigation Guide</span>
                     <div className='flex flex-col gap-4 flex-1 min-h-0 overflow-y-auto pr-2'>
                        {building?.navigationGuide?.[kiosk?.kioskID]?.length > 0 ? (
                           building.navigationGuide[kiosk.kioskID].map((path, index) => (
                              <div
                                 key={path.id || `path-${index}`}
                                 className='flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 border border-gray-100 flex-shrink-0'
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
                                 <span className='text-gray-400 text-xl'>🗺</span>
                              </div>
                              <p className='text-gray-500 font-medium mb-1'>No navigation available</p>
                              <p className='text-gray-400 text-sm'>
                                 Navigation guide for this location is currently unavailable.
                              </p>
                           </div>
                        )}
                     </div>
                  </div>
               ) : (
                  <div className='flex flex-col font-righteous gap-[1.125rem]'>
                     <span className='text-[1.125rem]'>Quick Suggestions:</span>
                     <div className='flex flex-col gap-[.875rem]'>
                        <div
                           className='w-[16.75rem] h-[2.5625rem] flex items-center gap-[1.3125rem] bg-[#FBF9F6] shadow-md px-[1rem] cursor-pointer hover:bg-[#f0ede6] transition-colors'
                           onClick={() => handleQuickSuggestionClick('library')}
                        >
                           <LibraryIcon />
                           <span className='text-[.875rem]'>Find the Library</span>
                        </div>
                        <div
                           className='w-[16.75rem] h-[2.5625rem] flex items-center gap-[1.3125rem] bg-[#FBF9F6] shadow-md px-[1rem] cursor-pointer hover:bg-[#f0ede6] transition-colors'
                           onClick={() => handleQuickSuggestionClick('sofia')}
                        >
                           <BuildingIcon />
                           <span className='text-[.875rem]'>Navigate to Sofia Bldg. 2</span>
                        </div>
                        <div
                           className='w-[16.75rem] h-[2.5625rem] flex items-center gap-[1.3125rem] bg-[#FBF9F6] shadow-md px-[1rem] cursor-pointer hover:bg-[#f0ede6] transition-colors'
                           onClick={() => handleQuickSuggestionClick('cashier')}
                        >
                           <RegisterIcon />
                           <span className='text-[.875rem]'>Find the Cashier</span>
                        </div>
                     </div>
                  </div>
               )}
            </div>

            {showResults && (
               <div
                  className='fixed inset-0 z-[5]'
                  onClick={() => setShowResults(false)}
               />
            )}

            <div className='absolute bottom-0 flex flex-col font-righteous text-[.875rem]'>
               <div className='w-[18.75rem] flex'>
                  <button
                     className='w-[9.375rem] h-[3.5rem] bg-[#4329D8] flex justify-center items-center border-solid border-[1px] border-black text-white hover:bg-[#3422B8] transition-colors'
                     onClick={() => setShowHelp(true)}
                  >
                     Need Help?
                  </button>
                  <button
                     className='w-[9.375rem] h-[3.5rem] bg-[#4329D8] flex justify-center items-center border-solid border-[1px] border-black text-white hover:bg-[#3422B8] transition-colors'
                     onClick={handleFeedbackClick}
                  >
                     Any reports or feedback?
                  </button>
               </div>
               <div className='w-[18.75rem] h-[3.5rem] flex items-center justify-between bg-[#DBB341] px-[1.3125rem] text-white'>
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
         </section>

         <FeedbackModal
            isOpen={isFeedbackModalOpen}
            onClose={handleCloseFeedbackModal}
            kiosk={kiosk}
         />

         {/* Replace the old help modal with NeedHelpModal */}
         <NeedHelpModal
            showHelp={showHelp}
            setShowHelp={setShowHelp}
            onTriggerAI={handleAITrigger}
         />
      </>
   )
}

export default LeftSidePanel
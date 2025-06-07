import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { deleteRoom, fetchBuildings, fetchKiosks, pingAdmin } from '../../api/api';
import AddIcon from '../../assets/Icons/AddIcon';
import EditIcon from '../../assets/Icons/EditIcon';
import ShowIcon from '../../assets/Icons/ShowIcon';
import HideIcon from '../../assets/Icons/HideIcon';
import DeleteIcon from '../../assets/Icons/DeleteIcon';
import ShowIconTwo from '../../assets/Icons/ShowIconTwo';
import { NavLink, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const MapEditor = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: buildings = [],
    isLoading: buildingsLoading,
    error: buildingsError
  } = useQuery({
    queryKey: ['buildings'],
    queryFn: async () => {
      const data = await fetchBuildings();
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const {
    data: kiosksData = [],
    isLoading: kiosksLoading,
    error: kiosksError
  } = useQuery({
    queryKey: ['kiosks'], // Changed from 'buildings' to 'kiosks'
    queryFn: fetchKiosks,
    staleTime: 5 * 60 * 1000,
  });

  console.log(kiosksData);

  // Local state for UI interactions
  const [expandedBuildings, setExpandedBuildings] = useState({});
  const [currentActiveTabsByBuilding, setCurrentActiveTabsByBuilding] = useState({});

  // Memoized function to get consistent building ID
  const getBuildingId = useCallback((building) => building._id || building.id, []);

  // Initialize active tabs when buildings data changes
  useEffect(() => {
    if (buildings.length === 0) return;

    const initialTabs = {};
    let hasNewTabs = false;

    buildings.forEach(building => {
      const buildingId = getBuildingId(building);
      const tabs = Object.keys(building.existingRoom || {});

      if (tabs.length > 0) {
        // Keep existing selection if valid, otherwise use first tab
        const currentTab = currentActiveTabsByBuilding[buildingId];
        const newTab = tabs.includes(currentTab) ? currentTab : tabs[0];
        initialTabs[buildingId] = newTab;

        // Check if this is a new tab selection
        if (currentTab !== newTab) {
          hasNewTabs = true;
        }
      }
    });

    // Only update if there are actual changes or if state is empty
    if (hasNewTabs || Object.keys(currentActiveTabsByBuilding).length === 0) {
      setCurrentActiveTabsByBuilding(prev => ({
        ...prev,
        ...initialTabs
      }));
    }
  }, [buildings, getBuildingId]); // Removed currentActiveTabsByBuilding from dependencies

  // Admin ping query
  const { data: pingStatus } = useQuery({
    queryKey: ['admin-ping'],
    queryFn: async () => {
      await pingAdmin();
      return { lastPing: Date.now() };
    },
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
    retry: 3,
    retryDelay: 5000,
  });

  // UI interaction handlers
  const toggleBuilding = useCallback((buildingId) => {
    setExpandedBuildings(prev => ({
      ...prev,
      [buildingId]: !prev[buildingId]
    }));
  }, []);

  const setActiveTab = useCallback((buildingId, tabId) => {
    setCurrentActiveTabsByBuilding(prev => ({
      ...prev,
      [buildingId]: tabId
    }));
  }, []);

  // Room deletion mutation
  const deleteRoomMutation = useMutation({
    mutationFn: async ({ buildingID, roomName, floor }) => {
      return await deleteRoom(buildingID, roomName, floor);
    },
    onSuccess: (data) => {
      console.log(data);
      alert(`Room "${data.data.roomName}" on floor ${data.data.floor} deleted successfully from ${data.data.totalDeletedRooms} kiosk(s)!`);
      queryClient.invalidateQueries(['buildings']);
    },
    onError: (error) => {
      console.error("Failed to delete room:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to delete room.";
      alert(`Error: ${errorMessage}`);
    }
  });

  // Fixed room deletion handler
  const handleRoomDelete = useCallback(async (e, buildingID, roomName, floor) => {
    e.preventDefault();

    // Find the specific building and count room instances
    const targetBuilding = buildings.find(b => getBuildingId(b) === buildingID);
    if (!targetBuilding) {
      alert('Building not found');
      return;
    }

    const roomInstances = Object.values(targetBuilding.existingRoom || {}).reduce((count, rooms) => {
      return count + (rooms?.filter(room => room.name === roomName && room.floor === floor).length || 0);
    }, 0);

    const confirmDelete = window.confirm(
      `⚠️ WARNING: You are about to delete the room "${roomName}" on floor ${floor}.\n\n` +
      `This will permanently remove ${roomInstances} instance(s) of this room from all kiosks in this building.\n\n` +
      "This action cannot be undone. Are you sure you want to continue?"
    );

    if (!confirmDelete) return;

    try {
      deleteRoomMutation.mutate({
        buildingID,
        roomName,
        floor
      });
    } catch (error) {
      console.error('Error initiating room deletion:', error);
    }
  }, [buildings, getBuildingId, deleteRoomMutation]);

  const handleShowRoom = (room, building, kioskId) => {
    const params = new URLSearchParams({
      roomId: room._id,
      buildingId: building._id,
      kioskId: kioskId,
      showPath: 'true'
    });

    navigate(`/admin/test-kiosk?${params.toString()}`);
  };

  const getKioskNameById = useCallback((kioskId) => {
    const kiosk = kiosksData.find(k => k.kioskID === kioskId);
    return kiosk ? kiosk.name : kioskId; // fallback to kioskId if not found
  }, [kiosksData]);


  // Handle loading and error states
  if (buildingsLoading) {
    return (
      <div className="w-[73.98dvw] flex items-center justify-center ml-[19.5625rem] mt-[1.875rem] h-64">
        <div className="text-lg">Loading buildings...</div>
      </div>
    );
  }

  if (buildingsError) {
    return (
      <div className="w-[73.98dvw] flex items-center justify-center ml-[19.5625rem] mt-[1.875rem] h-64">
        <div className="text-lg text-red-600">Error loading buildings: {buildingsError.message}</div>
      </div>
    );
  }

  console.log(buildings);

  return (
    <div className="w-[73.98dvw] flex flex-col gap-[1.1875rem] ml-[19.5625rem] mt-[1.875rem]">
      <div className='flex flex-col gap-[0.1875rem]'>
        <h1 className='font-poppins font-bold text-[1.125rem]'>MAP EDITOR</h1>
        <span className='font-roboto text-[.875rem] text-[#737373]'>Manage your building's rooms.</span>
      </div>
      <section className='flex flex-col gap-[1rem]'>
        {buildings.map((building) => {
          const buildingId = building.id || building._id;
          const tabs = Object.keys(building.existingRoom || {});
          const activeTab = currentActiveTabsByBuilding[buildingId] || (tabs.length > 0 ? tabs[0] : null);

          return (
            <div
              key={building.id}
              className='w-full flex flex-col justify-center px-[2rem] bg-[#FBFCF8] shadow-md'
            >
              <div className='flex items-center justify-between py-[1.1875rem]'>
                <span className='text-[1rem] font-bold'>{building.name}</span>
                <div className='flex gap-[1.4375rem] font-poppins'>
                  <NavLink
                    to={`${building._id}/add-room`}
                    className='w-[7.3125rem] h-[1.875rem] flex items-center justify-center gap-[0.6875rem] text-[#110D79] border-solid border-[1px] border-[#110D79] bg-[#D1D6FA] cursor-pointer transition-all duration-300 ease-in-out hover:bg-[#B0B7F5]'
                  >
                    <AddIcon />
                    <span className='font-bold text-[.75rem]'>Add a Room</span>
                  </NavLink>
                  <NavLink
                    to={`${building._id}/edit-building/${activeTab}`}
                    className='w-[7.3125rem] h-[1.875rem] flex items-center justify-center gap-[0.6875rem] text-[#1EAF34] border-solid border-[1px] border-[#1EAF34] bg-[#D1FAE5] cursor-pointer transition-all duration-300 ease-in-out hover:bg-[#A6F4C5]'
                  >
                    <EditIcon />
                    <span className='font-bold text-[.75rem]'>Edit</span>
                  </NavLink>
                  <button
                    className='w-[7.3125rem] h-[1.875rem] flex items-center justify-center gap-[0.6875rem] text-[#DBB341] border-solid border-[1px] border-[#DBB341] bg-[#FAF5D1] cursor-pointer transition-all duration-300 ease-in-out hover:bg-[#F4E7A3]'
                    onClick={() => toggleBuilding(building.id || building._id)}
                  >
                    {!expandedBuildings[building.id] ? <ShowIcon /> : <HideIcon />}
                    <span className='font-bold text-[.75rem]'>{!expandedBuildings[building.id] ? 'Show' : 'Hide'}</span>
                  </button>
                </div>
              </div>

              {expandedBuildings[buildingId] && (
                <div className="border-t border-gray-200 p-4">
                  {/* Render tabs */}
                  {tabs.length > 0 ? (
                    <>
                      <div className="flex">
                        {tabs.map((tab) => (
                          <button
                            key={tab}
                            onClick={() => setActiveTab(buildingId, tab)}
                            className={`px-4 py-2 border-solid border-b-[2px] ${activeTab === tab ? 'text-[#4353ff] border-[#4353ff]' : 'border-[#eee]'}`}
                          >
                            {getKioskNameById(tab)}
                          </button>
                        ))}

                      </div>

                      <div className="mt-4">
                        {building.existingRoom[activeTab]?.map((room) => (
                          <div key={room._id} className='flex flex-col gap-[1.375rem] p-[1rem] bg-[#FBF9F6] shadow-md'>
                            <div className='flex flex-col gap-[0.4375rem]'>
                              <div className='flex justify-between'>
                                <span className='font-bold'>{room?.name}</span>
                                <div className='flex gap-[2rem]'>
                                  <button
                                    onClick={() => handleShowRoom(room, building, activeTab)}
                                    className='flex items-center gap-[0.75rem]'
                                  >
                                    <ShowIconTwo />
                                    <span className='text-[#110D79] text-[.875rem]'>Show</span>
                                  </button>
                                  <NavLink
                                    to={`${building._id}/edit-room/${activeTab}/${room._id}`}
                                    className='flex items-center gap-[0.75rem]'
                                  >
                                    <EditIcon />
                                    <span className='text-[#1EAF34] text-[.875rem]'>Edit</span>
                                  </NavLink>
                                  <button
                                    onClick={(e) => handleRoomDelete(e, building._id, room.name, room.floor)}
                                    className='flex items-center gap-[0.75rem] cursor-pointer transition-all duration-300 ease-in-out hover:scale-105 hover:text-[#991515]'
                                  >
                                    <DeleteIcon />
                                    <span className='text-[#AF1E1E] text-[.875rem]'>Delete</span>
                                  </button>
                                </div>
                              </div>
                              <span className='text-[#4B5563] font-light'>Floor {room.floor}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p>No rooms available for this building.</p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </section>
    </div>
  )
}

export default MapEditor

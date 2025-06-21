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


            {Object.keys(building.rooms).length > 0 ?  
              (expandedBuildings[buildingId] && (
                <div className="border-t border-gray-200 px-6 py-4">
                  {/* Floor Tabs */}
                  <div className="flex space-x-2 mb-4 border-b border-gray-300">
                    {Object.keys(building.rooms || {})
                      .sort((a, b) => a - b)
                      .map((floor) => (
                        <button
                          key={floor}
                          onClick={() => setActiveTab(buildingId, floor)}
                          className={`px-4 py-2 text-sm font-medium border-b-2 ${currentActiveTabsByBuilding[buildingId] === floor
                              ? 'border-blue-600 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-blue-600'
                            }`}
                        >
                          Floor {floor}
                        </button>
                      ))}
                  </div>

                  {/* Active Floor's Rooms */}
                  <div className="space-y-2">
                    {(building.rooms?.[currentActiveTabsByBuilding[buildingId]] || []).map((room) => (
                      <div
                        key={room._id || room.id}
                        className="border border-gray-300 rounded-lg p-4 shadow-sm hover:shadow-md transition"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="text-base font-semibold text-gray-800">{room.label}</h4>
                            <p className="text-sm text-gray-500">Floor {room.floor}</p>
                            {room.coordinates && (
                              <p className="text-sm text-gray-400">{room.coordinates}</p>
                            )}
                          </div>

                          {room.color && (
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: room.color }}
                              title={`Color: ${room.color}`}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )) : 
              (expandedBuildings[buildingId] && (<div className="text-sm text-gray-500 italic pb-10 text-center">No rooms available for this building. Click Edit to add data.</div>))
              }



            </div>
          )
        })}
      </section>
    </div>
  )
}

export default MapEditor

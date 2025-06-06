import React, { useEffect, useRef, useState } from 'react'
import { deleteRoom, fetchBuildings, pingAdmin } from '../../api/api';
import AddIcon from '../../assets/Icons/AddIcon';
import EditIcon from '../../assets/Icons/EditIcon';
import ShowIcon from '../../assets/Icons/ShowIcon';
import HideIcon from '../../assets/Icons/HideIcon';
import DeleteIcon from '../../assets/Icons/DeleteIcon';
import ShowIconTwo from '../../assets/Icons/ShowIconTwo';
import { NavLink } from 'react-router-dom';

const MapEditor = () => {
  const [buildings, setBuildings] = useState([]);
  const [expandedBuildings, setExpandedBuildings] = useState({});

  const [activeTabsByBuilding, setActiveTabsByBuilding] = useState({});

  useEffect(() => {
    const getBuildings = async () => {
      try {
        const data = await fetchBuildings();

        const initialActiveTabsByBuilding = {};
        data.forEach(building => {
          const buildingId = building.id || building._id;
          const tabs = Object.keys(building.existingRoom || {});
          if (tabs.length > 0) {
            initialActiveTabsByBuilding[buildingId] = tabs[0];
          }
        });

        setActiveTabsByBuilding(initialActiveTabsByBuilding);
        setBuildings(data);
      } catch (error) {
        console.error("Failed to load buildings:", error);
      }
    };

    getBuildings();
  }, []);

  const toggleBuilding = (buildingId) => {
    setExpandedBuildings(prev => ({
      ...prev,
      [buildingId]: !prev[buildingId]
    }));
  };

  const setActiveTab = (buildingId, tabId) => {
    setActiveTabsByBuilding(prev => ({
      ...prev,
      [buildingId]: tabId
    }));
  };

  const handleRoomDelete = async (e, buildingID, roomID) => {
    e.preventDefault();

    const confirmDelete = window.confirm(
      "⚠️ WARNING: This action will permanently delete ALL rooms from ALL kiosks in this building. " +
      "This includes every existing room, regardless of which kiosk they belong to.\n\n" +
      "This cannot be undone. Are you absolutely sure you want to continue?"
    );


    if (!confirmDelete) return;

    try {
      const response = await deleteRoom(buildingID, roomID);
      console.log(response);
      alert("Room deleted successfully!");
    } catch (error) {
      console.error("Failed to delete room:", error);
      alert("Failed to delete room.");
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      pingAdmin();
    }, 30000);

    pingAdmin();

    return () => clearInterval(interval);
  }, []);

  console.log(Object.values(activeTabsByBuilding)[0]);

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
          const activeTab = activeTabsByBuilding[buildingId] || (tabs.length > 0 ? tabs[0] : null);

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
                            className={`px-4 py-2 border-solid border-b-[2px]  ${activeTab === tab ? 'text-[#4353ff] border-[#4353ff]' : 'border-[#eee]'}`}
                          >
                            {tab}
                          </button>
                        ))}
                      </div>

                      <div className="mt-4">
                        {building.existingRoom[activeTab].map((room) => (
                          <>
                            <div className='flex flex-col gap-[1.375rem] p-[1rem] bg-[#FBF9F6] shadow-md'>
                              <div className='flex flex-col gap-[0.4375rem]'>
                                <div className='flex justify-between'>
                                  <span className='font-bold'>{room?.name}</span>
                                  <div className='flex gap-[2rem]'>
                                    <button className='flex items-center gap-[0.75rem]'>
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
                                      onClick={(e) => handleRoomDelete(e, building._id, room._id)}
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
                          </>
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
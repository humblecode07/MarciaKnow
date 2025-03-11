import React, { useEffect, useRef, useState } from 'react'
import { fetchBuildings } from '../../api/api';
import AddIcon from '../../assets/Icons/AddIcon';
import EditIcon from '../../assets/Icons/EditIcon';
import ShowIcon from '../../assets/Icons/ShowIcon';

const MapEditor = () => {
  const [buildings, setBuildings] = useState([]);
  const [expandedBuildings, setExpandedBuildings] = useState({});


  useEffect(() => {
    const getBuildings = async () => {
      try {
        const data = await fetchBuildings();
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

  return (
    <div className="w-[73.98dvw] flex flex-col gap-[1.1875rem] ml-[19.5625rem] mt-[1.875rem]">
      <div className='flex flex-col gap-[0.1875rem]'>
        <h1 className='font-poppins font-bold text-[1.125rem]'>MAP EDITOR</h1>
        <span className='font-roboto text-[.875rem] text-[#737373]'>Manage your building's rooms.</span>
      </div>
      <section className='flex flex-col gap-[1rem]'>
        {buildings.map((building) => {
          return (
            <div
              key={building.id}
              className='w-full flex flex-col justify-center px-[2rem] bg-[#FBFCF8] shadow-md'
            >
              <div className='flex items-center justify-between py-[1.1875rem]'>
                <span className='text-[1rem] font-bold'>{building.name}</span>
                <div className='flex gap-[1.4375rem] font-poppins'>
                  <button className='w-[7.3125rem] h-[1.875rem] flex items-center justify-center gap-[0.6875rem] text-[#110D79] border-solid border-[1px] border-[#110D79] bg-[#D1D6FA] cursor-pointer transition-all duration-300 ease-in-out hover:bg-[#B0B7F5]'>
                    <AddIcon />
                    <span className='font-bold text-[.75rem]'>Add a Room</span>
                  </button>
                  <button className='w-[7.3125rem] h-[1.875rem] flex items-center justify-center gap-[0.6875rem] text-[#1EAF34] border-solid border-[1px] border-[#1EAF34] bg-[#D1FAE5] cursor-pointer transition-all duration-300 ease-in-out hover:bg-[#A6F4C5]'>
                    <EditIcon />
                    <span className='font-bold text-[.75rem]'>Edit</span>
                  </button>
                  <button
                    className='w-[7.3125rem] h-[1.875rem] flex items-center justify-center gap-[0.6875rem] text-[#DBB341] border-solid border-[1px] border-[#DBB341] bg-[#FAF5D1] cursor-pointer transition-all duration-300 ease-in-out hover:bg-[#F4E7A3]'
                    onClick={() => toggleBuilding(building.id || building._id)}
                  >
                    <ShowIcon />
                    <span className='font-bold text-[.75rem]'>Show</span>
                  </button>
                </div>
              </div>

              {expandedBuildings[building.id || building._id] && (
                <div className="border-t border-gray-200 p-4">
                  <div className="px-4 py-3 text-gray-500 italic">
                    {building.description || "No description available."}
                  </div>
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
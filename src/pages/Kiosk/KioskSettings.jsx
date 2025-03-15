import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AddIcon from '../../assets/Icons/AddIcon'
import { deleteKiosk, fetchKiosks } from '../../api/api';
import EditIcon from '../../assets/Icons/EditIcon';
import DeleteIcon from '../../assets/Icons/DeleteIcon';
import ShowIconTwo from '../../assets/Icons/ShowIconTwo';
import { NavLink } from 'react-router-dom';

const KioskSettings = () => {
  const queryClient = useQueryClient();
  const { data: kiosks, error, isLoading } = useQuery({
    queryKey: ['kiosks'],
    queryFn: fetchKiosks,
  });

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  const handleDeleteKiosk = async (kioskID) => {
    try {
      const deletedKiosk = await deleteKiosk(kioskID);
      if (deletedKiosk) {
        console.log('Kiosk deleted:', deletedKiosk);
        queryClient.invalidateQueries(['kiosks']);
      }
    } catch (error) {
      console.error('Failed to delete kiosk:', error.message);
    }
  }

  return (
    <div className="w-[73.98dvw] flex flex-col gap-[1.1875rem] ml-[19.5625rem] mt-[1.875rem]">
      <div className='flex flex-col gap-[0.1875rem]'>
        <h1 className='font-poppins font-bold text-[1.125rem]'>KIOSK SETTINGS</h1>
        <span className='font-roboto text-[.875rem] text-[#737373]'>Manage and configure kiosk settings, including location details, navigation guides, and connected devices.</span>
      </div>
      <div className='flex justify-end'>
        <NavLink
          to={'add-kiosk'}
          className='w-[7.3125rem] h-[1.875rem] flex items-center justify-center gap-[0.6875rem] text-[#110D79] border-solid border-[1px] border-[#110D79] bg-[#D1D6FA] cursor-pointer transition-all duration-300 ease-in-out hover:bg-[#B0B7F5]'
        >
          <AddIcon />
          <span className='font-bold text-[.75rem]'>Add Kiosk</span>
        </NavLink>
      </div>
      <section className='flex flex-col gap-[1rem]'>
        {kiosks.map((kiosk) => (
          <div
            key={kiosk.kioskID}
            className='w-full p-[1rem] flex flex-col gap-[1.5625rem] bg-[#FBFCF8] shadow-md font-roboto'
          >
            <div className='flex flex-col gap-[0.4375rem]'>
              <div className='flex justify-between'>
                <span className='font-bold'>{kiosk.name}</span>
                <div className='flex gap-[2rem]'>
                  <button className='flex gap-[.75rem] items-center cursor-pointer transition-all duration-300 ease-in-out hover:scale-105 hover:text-[#0E0866]'>
                    <ShowIconTwo />
                    <span className='text-[#110D79] text-[.875rem]'>Show</span>
                  </button>
                  <NavLink 
                    to={`edit-kiosk/${kiosk.kioskID}`}
                    className='flex gap-[.75rem] items-center cursor-pointer transition-all duration-300 ease-in-out hover:scale-105 hover:text-[#159A2B]'
                  >
                    <EditIcon />
                    <span className='text-[#1EAF34] text-[.875rem]'>Edit</span>
                  </NavLink>
                  <button 
                    onClick={() => handleDeleteKiosk(kiosk.kioskID)}
                    className='flex gap-[.75rem] items-center cursor-pointer transition-all duration-300 ease-in-out hover:scale-105 hover:text-[#991515]'
                  >
                    <DeleteIcon />
                    <span className='text-[#AF1E1E] text-[.875rem]'>Delete</span>
                  </button>

                </div>
              </div>
              <span className='font-bold text-[.875rem] text-[#4B5563]'>ID: <span className='font-light text-[.875rem] text-[#4B5563]'>{kiosk.kioskID}</span></span>
              <span
                className={`font-light text-[.875rem] ${kiosk.status === "online" ? "text-[#1EAF34]" : kiosk.status === "offline" ? "text-[#AF1E1E]" : "text-[#EAB308]"}`}
              >
                {kiosk.status === "online" ? "ONLINE" : kiosk.status === "offline" ? "OFFLINE" : "IN MAINTENANCE"}
              </span>
            </div>
            <div className='flex flex-col gap-[.75rem]'>
              <span className='font-bold text-[.875rem] text-[#4B5563]'>Location: <span className='font-light text-[.875rem] text-[#4B5563]'>{kiosk.location}</span></span>
              <span className='font-bold text-[.875rem] text-[#4B5563]'>Coordinates: <span className='font-light text-[.875rem] text-[#4B5563]'>[{kiosk.coordinates.x}, {kiosk.coordinates.y}]</span></span>
              <span className='font-bold text-[.875rem] text-[#4B5563]'>Last Check-in: <span className='font-light text-[.875rem] text-[#4B5563]'>{kiosk.lastCheckIn}</span></span>
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}

export default KioskSettings

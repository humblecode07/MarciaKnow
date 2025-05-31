import React from 'react'
import { fetchAdmin } from '../api/api';
import { NavLink, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import useAuth from '../hooks/useAuth';
import CoggersIcon from '../assets/Icons/CoggersIcon';
import ClockIcon from '../assets/Icons/ClockIcon';
import CalendarIcon from '../assets/Icons/CalendarIcon';
import { useState } from 'react';
import ShowIconTwo from '../assets/Icons/ShowIconTwo';

const Profile = () => {
  const { admin } = useAuth();
  const { adminID } = useParams();

  const { data: adminData, error, isLoading } = useQuery({
    queryKey: ['admin', adminID],
    queryFn: () => fetchAdmin(adminID),
  });

  const [activeTab, setActiveTab] = useState('tabs');

  const tabItems = [
    { id: 'tabs', label: 'KIOSK' },
    { id: 'editor', label: 'MAP EDITOR' }
  ];

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div className="flex gap-[3.375rem] ml-[19.5625rem] mt-[1.875rem] font-roboto">
      <div className='w-[18.375rem] flex flex-col gap-[1rem]'>
        <img
          src={`http://localhost:3000/admin/profile/${adminData.profile}`}
          alt={adminData.full_name + "'s pfp"}
          className='w-full h-[18.375rem] rounded-full object-cover border-solid border-[1px] border-[#3D444D]'
        />
        <span className='font-roboto text-[1.5rem] font-medium text-black'>{adminData.full_name}</span>
        <div className='flex gap-[1rem]'>
          <span className='font-roboto font-light text-[1.25rem] text-[#4B5563]'>alice.johnson012</span>
          <div className={`px-[0.46875rem] py-[.25rem] ${adminData.roles.includes(Number(import.meta.env.VITE_ROLE_SUPER_ADMIN)) ? 'bg-[#F3E8FF]' : 'bg-[#D1D6FA]'} rounded-full flex items-center justify-center`}>
            <span className={`${adminData.roles.includes(Number(import.meta.env.VITE_ROLE_SUPER_ADMIN)) ? 'text-[#5B21B6]' : 'text-[#110D79]'} font-roboto font-medium text-[.75rem] items-center justify-center`}>{adminData.roles.includes(Number(import.meta.env.VITE_ROLE_SUPER_ADMIN)) ? 'Super Admin' : 'Admin'}</span>
          </div>
        </div>
        <span className='font-roboto'>{adminData?.description || 'No description has been added yet.'}</span>
        {admin.adminId === adminID ?
          <NavLink to={'settings'} className={`flex items-center justify-center gap-[.625rem] bg-[#FBF9F6] border-solid border-[1px] border-black py-[.5rem]`}>
            <CoggersIcon />
            <span className='font-roboto font-semibold text-[.875rem]'>Edit Profile</span>
          </NavLink> : null}
        <div className='flex gap-[0.5625rem] items-center pt-[0.375rem]'>
          <ClockIcon />
          <span className='font-roboto text-[#4B5563]'><span className='font-bold'>Last Login: </span>{adminData?.lastLogin || 'N/A'}</span>
        </div>
        <div className='flex gap-[0.5625rem] items-center'>
          <CalendarIcon />
          <span className='font-roboto text-[#4B5563]'><span className='font-bold'>Joined: </span>{adminData.joined ? new Date(adminData.joined).toLocaleDateString() : 'N/A'}</span>
        </div>
      </div>
      <div className='w-[37.625rem] h-[53.875rem] flex bg-[#FBFCF8] shadow-md border-solid border-[1px] border-[#3D444D]'>
        <div className='w-full flex flex-col items-center gap-[1.6875rem] px-[2.0625rem] py-[1.4375rem]'>
          <div className='flex flex-col text-center'>
            <span className='font-poppins text-[1.25rem] font-bold'>System Insights</span>
            <span className='font-roboto font-light text-[#4B5563]'>Keep up with recent changes</span>
          </div>
          <div className="w-[21.0625rem] relative flex items-center justify-between border-b border-gray-300">
            {tabItems.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 text-center py-3 font-medium transition-all duration-200 ${activeTab === tab.id ? 'text-black' : 'text-gray-500'
                  }`}
              >
                {tab.label}
              </button>
            ))}
            <div
              className="absolute bottom-0 h-[3px] bg-[#1E40AF] transition-all duration-300"
              style={{
                width: '50%',
                left: activeTab === 'tabs' ? '0%' : '50%'
              }}
            />
          </div>
          <div className="w-full flex">
            {activeTab === 'tabs' && (
              adminData?.systemLogs?.kiosk ?
                <div className='w-[33.5rem] py-[1.5625rem] px-[1.6875rem] bg-[#FBF9F6] shadow-md'>
                  <div className='flex justify-between'>
                    <div className='flex flex-col gap-[.5rem] text-[.875rem]'>
                      <span className='font-roboto font-medium'>Kiosk-1 has been added.</span>
                      <span className='font-roboto font-light text-[#4B5563]'><span className='font-bold'>ID: </span>K789X2Y1</span>
                      <span className='font-roboto font-light text-[#4B5563]'><span className='font-bold'>Location: </span>FRONT GATE</span>
                      <span className='font-roboto font-light text-[#4B5563]'>2024-12-14 09:15:00</span>
                    </div>
                    <button className='h-[1.8125rem] px-[.875rem] bg-[#D1D6FA] text-[#110D79] text-[.875rem] flex gap-[0.8125rem] items-center justify-center'>
                      <ShowIconTwo />
                      <span>View</span>
                    </button>
                  </div>
                </div> :
                <div className='w-[33.5rem] py-[1.5625rem] px-[1.6875rem] bg-[#FBF9F6] shadow-md'>
                  <div className='flex justify-between'>
                    <div className='flex flex-col gap-[.5rem] text-[.875rem]'>
                      <span className='font-roboto font-medium'>Kiosk-1 has been added.</span>
                      <span className='font-roboto font-light text-[#4B5563]'><span className='font-bold'>ID: </span>K789X2Y1</span>
                      <span className='font-roboto font-light text-[#4B5563]'><span className='font-bold'>Location: </span>FRONT GATE</span>
                      <span className='font-roboto font-light text-[#4B5563]'>2024-12-14 09:15:00</span>
                    </div>
                    <button className='h-[1.8125rem] px-[.875rem] bg-[#D1D6FA] text-[#110D79] text-[.875rem] flex gap-[0.8125rem] items-center justify-center'>
                      <ShowIconTwo />
                      <span>View</span>
                    </button>
                  </div>
                </div>
            )}
            {activeTab === 'editor' && (
              <div>
                <h2 className="text-xl font-semibold mb-2">Map Editor</h2>
                <p>Map editor tools and settings go here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile

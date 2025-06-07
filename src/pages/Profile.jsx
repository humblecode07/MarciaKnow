import React, { useEffect, useState } from 'react';
import { fetchAdmin, pingAdmin } from '../api/api';
import { NavLink, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import useAuth from '../hooks/useAuth';
import CoggersIcon from '../assets/Icons/CoggersIcon';
import ClockIcon from '../assets/Icons/ClockIcon';
import CalendarIcon from '../assets/Icons/CalendarIcon';
import ShowIconTwo from '../assets/Icons/ShowIconTwo';
import CallIcon from '../assets/Icons/CallIcon';

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

  // Helper function to get action color (no change needed here)
  const getActionColor = (action) => {
    switch (action?.toLowerCase()) {
      case 'added':
        return { bg: 'bg-green-100', text: 'text-green-800' };
      case 'updated':
        return { bg: 'bg-blue-100', text: 'text-blue-800' };
      case 'removed':
        return { bg: 'bg-red-100', text: 'text-red-800' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800' };
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      pingAdmin();
    }, 30000);

    pingAdmin();

    return () => clearInterval(interval);
  }, []);

  console.log(admin);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div className="flex gap-[3.375rem] ml-[19.5625rem] mt-[1.875rem] font-roboto">
      <div className='w-[20.375rem] flex flex-col gap-[1rem]'>
        <img
          src={`${import.meta.env.VITE_BASE_URL}/admin/profile/${adminData.profile}`}
          alt={adminData.full_name + "'s pfp"}
          className='w-full h-[20.375rem] rounded-full object-cover border-solid border-[1px] border-[#3D444D]'
        />
        <span className='font-roboto text-[1.5rem] font-medium text-black'>{adminData.full_name}</span>
        <div className='flex gap-[1rem]'>
          <span className='font-roboto font-light text-[1.25rem] text-[#4B5563]'>{adminData.username}</span>
          <div className={`px-[0.46875rem] py-[.25rem] ${adminData.roles.includes(Number(import.meta.env.VITE_ROLE_SUPER_ADMIN)) ? 'bg-[#F3E8FF]' : 'bg-[#D1D6FA]'} rounded-full flex items-center justify-center`}>
            <span className={`${adminData.roles.includes(Number(import.meta.env.VITE_ROLE_SUPER_ADMIN)) ? 'text-[#5B21B6]' : 'text-[#110D79]'} font-roboto font-medium text-[.75rem] items-center justify-center`}>
              {adminData.roles.includes(Number(import.meta.env.VITE_ROLE_SUPER_ADMIN)) ? 'Super Admin' : 'Admin'}
            </span>
          </div>
        </div>
        <span className='font-roboto'>{adminData?.description || 'No description has been added yet.'}</span>
        {admin.adminId === adminID ?
          <NavLink to={'settings'} className={`flex items-center justify-center gap-[.625rem] bg-[#FBF9F6] border-solid border-[1px] border-black py-[.5rem]`}>
            <CoggersIcon />
            <span className='font-roboto font-semibold text-[.875rem]'>Edit Profile</span>
          </NavLink> : null}
        <div className='flex gap-[0.5625rem] items-center pt-[0.375rem]'>
          <CallIcon />
          <span className='font-roboto text-[#4B5563]'><span className='font-bold'>Contact: </span>{adminData?.contact || 'N/A'}</span>
        </div>
        <div className='flex gap-[0.5625rem] items-center'>
          <ClockIcon />
          <span className='font-roboto text-[#4B5563]'>
            <span className='font-bold'>Last Login: </span>
            {adminData?.lastLogin
              ? new Date(adminData.lastLogin).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              })
              : 'N/A'}
          </span>
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
                className={`flex-1 text-center py-3 font-medium transition-all duration-200 ${activeTab === tab.id ? 'text-black' : 'text-gray-500'}`}
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
          <div className="w-full flex overflow-y-auto scroll-hidden">
            {activeTab === 'tabs' && (
              adminData?.systemLogs?.kiosk?.length > 0 ? (
                <div className='flex flex-col gap-4'>
                  {/* Sorting added here: sort by dateOfChange in descending order */}
                  {adminData.systemLogs.kiosk
                    .sort((a, b) => new Date(b.dateOfChange) - new Date(a.dateOfChange))
                    .map((log, index) => (
                      <div key={index} className='w-[33.5rem] py-[1.5625rem] px-[1.6875rem] bg-[#FBF9F6] shadow-md'>
                        <div className='flex justify-between gap-8'>
                          <div className='flex flex-col gap-[.5rem] text-[.875rem]'>
                            <span className='font-roboto font-medium'>{log.description}</span>
                            <span className='font-roboto font-light text-[#4B5563]'>
                              <span className='font-bold'>ID: </span>{log.kioskID}
                            </span>
                            <span className='font-roboto font-light text-[#4B5563]'>
                              <span className='font-bold'>Location: </span>{log.location}
                            </span>
                            <span className='font-roboto font-light text-[#4B5563]'>
                              {new Date(log.dateOfChange).toLocaleString()}
                            </span>
                          </div>
                          <NavLink 
                            to={'/admin/kiosk-settings'}
                            className='h-[1.8125rem] px-[.875rem] bg-[#D1D6FA] text-[#110D79] text-[.875rem] flex gap-[0.8125rem] items-center justify-center'
                          >
                            <ShowIconTwo />
                            <span>View</span>
                          </NavLink>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className='text-gray-500'>No kiosk logs available.</p>
              )
            )}
            {activeTab === 'editor' && (
              (adminData?.systemLogs?.mapEditor?.room?.length > 0 || adminData?.systemLogs?.mapEditor?.building?.length > 0) ? (
                <div className='flex flex-col gap-4 w-full py-2'>
                  {[...adminData.systemLogs.mapEditor.room, ...adminData.systemLogs.mapEditor.building]
                    .sort((a, b) => new Date(b.dateOfChange) - new Date(a.dateOfChange))
                    .map((log, index) => {
                      return (
                        <div key={index} className='w-[33.5rem] py-[1.5625rem] px-[1.6875rem] bg-[#FBF9F6] shadow-md rounded'>
                          <div className='flex justify-between gap-4'>
                            <div className='flex flex-col gap-[.5rem] text-[.875rem] flex-1'>
                              <span className='font-roboto font-medium text-black'>{log.description}</span>
                              {log.type === 'room' && (
                                <>
                                  <span className='font-roboto font-light text-[#4B5563]'><span className='font-bold'>Room: </span>{log.roomName}</span>
                                  <span className='font-roboto font-light text-[#4B5563]'><span className='font-bold'>Building: </span>{log.buildingName}</span>
                                  <span className='font-roboto font-light text-[#4B5563]'><span className='font-bold'>Floor: </span>{log.floor}</span>
                                </>
                              )}
                              {log.type === 'building' && (
                                <>
                                  <span className='font-roboto font-light text-[#4B5563]'><span className='font-bold'>Building: </span>{log.buildingName}</span>
                                  <span className='font-roboto font-light text-[#4B5563]'><span className='font-bold'>Floors: </span>{log.numberOfFloors}</span>
                                </>
                              )}
                              {log.kioskName && (
                                <span className='font-roboto font-light text-[#4B5563]'><span className='font-bold'>Kiosk: </span>{log.kioskName} ({log.kioskID})</span>
                              )}
                              {log.action === 'updated' && log.changes && (
                                <div className='mt-2 p-2 bg-blue-50 rounded border-l-4 border-blue-200'>
                                  <span className='font-roboto font-medium text-blue-800 text-xs'>Changes Made:</span>
                                  <ul className='mt-1 text-xs text-blue-700'>
                                    {log.changes.name && <li>• Name: "{log.changes.name.old}" → "{log.changes.name.new}"</li>}
                                    {log.changes.description && <li>• Description updated</li>}
                                    {log.changes.floor && <li>• Floor: {log.changes.floor.old} → {log.changes.floor.new}</li>}
                                    {log.changes.numberOfFloor && <li>• Floors: {log.changes.numberOfFloor.old} → {log.changes.numberOfFloor.new}</li>}
                                    {log.changes.navigationPath && <li>• Navigation path updated</li>}
                                    {log.changes.navigationGuide && <li>• Navigation guide updated</li>}
                                    {log.changes.images && <li>• Images updated</li>}
                                  </ul>
                                </div>
                              )}
                              <span className='font-roboto font-light text-[#4B5563] mt-2'>
                                {new Date(log.dateOfChange).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true,
                                })}
                              </span>
                            </div>
                            <NavLink 
                              to={'/admin/map-editor'}
                              className='h-[1.8125rem] px-[.875rem] bg-[#D1D6FA] text-[#110D79] text-[.875rem] flex gap-[0.8125rem] items-center justify-center rounded hover:bg-[#B8C5F0] transition-colors'
                            >
                              <ShowIconTwo />
                              <span>View</span>
                            </NavLink>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className='flex flex-col items-center justify-center text-center py-8'>
                  <p className='text-gray-500 font-medium'>No map editor logs available.</p>
                  <p className='text-gray-400 text-sm mt-1'>Room and building activities will appear here.</p>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile;
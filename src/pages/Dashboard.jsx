import React from 'react'
import CampusMap from '../components/TestKiosk/CampusMap'
import Divider from '../components/Divider'
import UserIcon from '../assets/Icons/Dashboard/UserIcon';
import ClockIcon from '../assets/Icons/Dashboard/ClockIcon';
import Adrenaline from '../assets/Icons/Dashboard/Adrenaline';
import {
  fetchDashboardStats,
  fetchRecentScanLogs,
  fetchRecentDestinationSearch
} from '../api/api';
import { useState } from 'react';
import { useEffect } from 'react';

const Dashboard = () => {
  let active = 3;
  let total = 6;

  const percentage = Math.min((active / total) * 100, 100);

  const [stats, setStats] = useState(null);
  const [recentScans, setRecentScans] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      const { totalScans, buildingStats, totalDestinationSearches } = await fetchDashboardStats();
      const scanLogs = await fetchRecentScanLogs();
      const searchLogs = await fetchRecentDestinationSearch();

      setStats({ totalScans, buildingStats, totalDestinationSearches });
      setRecentScans(scanLogs.data.logs || []);
      setRecentSearches(searchLogs || []);
    };

    loadData();
  }, []);

  const combinedLogs = [...recentScans, ...recentSearches]
    .sort((a, b) => new Date(b.timestamp || b.scannedAt) - new Date(a.timestamp || a.scannedAt))
    .slice(0, 10);


  return (
    <div className="w-[73.98dvw] flex gap-[1rem] ml-[19.5625rem] mt-[1.875rem]">
      <div className='flex flex-col gap-[.875rem]'>
        <div className='flex flex-col'>
          <h1 className='font-poppins font-bold text-[3rem]'>HI, ニューロ様</h1>
          <Divider />
        </div>
        <div className='flex'>
          <div className='w-[11rem] h-[8.5rem] bg-[#FBFCF8] shadow-md flex flex-col justify-center gap-[.75rem] px-[.875rem] font-roboto'>
            <h4 className='text-[#737373]'>Active Kiosk</h4>
            <span className='text-[#737373]'><span className='text-black text-[2rem] font-bold'>3</span>/5</span>
            <div className="w-full h-[0.4375rem] bg-[#ECECEC] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#29D82F] transition-all duration-300"
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
          </div>
          <div className='w-[11rem] h-[8.5rem] bg-[#FBFCF8] shadow-md flex flex-col justify-center gap-[.75rem] px-[.875rem] font-roboto'>
            <h4 className='text-[#737373]'>Total Searches Today</h4>
            <span className='text-[#737373]'><span className='text-black text-[2rem] font-bold'>48 </span>searches</span>
          </div>
          <div className='w-[11rem] h-[8.5rem] bg-[#FBFCF8] shadow-md flex flex-col justify-center gap-[.75rem] px-[.875rem] font-roboto'>
            <h4 className='text-[#737373]'>Online Admin</h4>
            <span className='text-[#737373]'><span className='text-black text-[2rem] font-bold'>3</span>/10</span>
            <div className="w-full h-[0.4375rem] bg-[#ECECEC] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#4329D8] transition-all duration-300"
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
          </div>
        </div>
        <div className='flex flex-col gap-[1rem]'>
          <h2 className='font-poppins font-bold text-[1.125rem]'>RECENT INTERACTION LOG</h2>
          <div className='h-[28.8125rem] overflow-auto flex flex-col font-roboto gap-[1rem]'>
            {combinedLogs.map((log, idx) => (
              <div key={idx} className="bg-[#FBFCF8] shadow-md">
                <div className="bg-[#4329D8] px-4 py-2 flex justify-between">
                  <span className="font-semibold text-white">INT-{idx + 1}</span>
                  <div className="bg-[#3E28B7] px-3 py-1">
                    <span className="text-white text-sm">Kiosk-{log.kioskId || 'N/A'}</span>
                  </div>
                </div>
                <div className="px-4 py-3 flex flex-col gap-2">
                  <div className={`px-2 py-1 w-fit text-sm ${log.searchQuery ? 'bg-[#DBEAFE] text-[#1E40AF]' : 'bg-[#D1FAE5] text-[#065F46]'}`}>
                    {log.searchQuery ? 'Search' : 'QR Scan'}
                  </div>
                  <span className="font-bold">{log.searchQuery || log.buildingName}</span>
                  <span className="text-sm text-[#737373]">{new Date(log.timestamp || log.scannedAt).toLocaleString()}</span>
                </div>
              </div>
            ))
            }
          </div>
        </div>
        <div className='flex flex-col gap-[1rem] font-roboto'>
          <h2 className='font-poppins font-bold text-[1.125rem]'>RECENT ADMIN LOG</h2>
          <div className='px-[1rem] py-[1.25rem] flex flex-col gap-[.875rem] bg-[#FBFCF8] shadow-md'>
            <div className='flex gap-[.875rem]'>
              <UserIcon />
              <span className='font-medium'>Alice Johnson</span>
            </div>
            <div className='flex gap-[.75rem]'>
              <ClockIcon />
              <span className='text-[#737373] text-[.875rem]'>2024-12-07 10:00 AM</span>
            </div>
            <div className='flex gap-[.875rem]'>
              <Adrenaline />
              <span className='text-[#737373] text-[.875rem]'>Edited campus building 'Library' to 'Main Library'</span>
            </div>
          </div>
          <div className='px-[1rem] py-[1.25rem] flex flex-col gap-[.875rem] bg-[#FBFCF8] shadow-md'>
            <div className='flex gap-[.875rem]'>
              <UserIcon />
              <span className='font-medium'>Alice Johnson</span>
            </div>
            <div className='flex gap-[.75rem]'>
              <ClockIcon />
              <span className='text-[#737373] text-[.875rem]'>2024-12-07 10:00 AM</span>
            </div>
            <div className='flex gap-[.875rem]'>
              <Adrenaline />
              <span className='text-[#737373] text-[.875rem]'>Edited campus building 'Library' to 'Main Library'</span>
            </div>
          </div>
          <div className='px-[1rem] py-[1.25rem] flex flex-col gap-[.875rem] bg-[#FBFCF8] shadow-md'>
            <div className='flex gap-[.875rem]'>
              <UserIcon />
              <span className='font-medium'>Alice Johnson</span>
            </div>
            <div className='flex gap-[.75rem]'>
              <ClockIcon />
              <span className='text-[#737373] text-[.875rem]'>2024-12-07 10:00 AM</span>
            </div>
            <div className='flex gap-[.875rem]'>
              <Adrenaline />
              <span className='text-[#737373] text-[.875rem]'>Edited campus building 'Library' to 'Main Library'</span>
            </div>
          </div>
        </div>
      </div>
      <div className='flex flex-col gap-[1rem]'>
        <h2 className='font-poppins font-bold text-[1.125rem] text-center'>CAMPUS MAP PREVIEW</h2>
        <CampusMap width={'25.375rem'} height={'21rem'} />
      </div>
    </div>
  )
}


export default Dashboard
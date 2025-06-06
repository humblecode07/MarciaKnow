import React from 'react'
import CampusMap from '../components/TestKiosk/CampusMap'
import Divider from '../components/Divider'
import UserIcon from '../assets/Icons/Dashboard/UserIcon';
import ClockIcon from '../assets/Icons/Dashboard/ClockIcon';
import Adrenaline from '../assets/Icons/Dashboard/Adrenaline';
import {
  fetchDashboardStats,
  fetchRecentScanLogs,
  fetchRecentDestinationSearch,
  fetchRecentAdminLogs,
  fetchKiosks,
  fetchAdmins,
  pingAdmin
} from '../api/api';

import { useState, useEffect, useMemo } from 'react';
import { useReportsData } from '../hooks/useReportsData';
import PopularDestinationsGraph from '../components/PopularDestinationGraph';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentScans, setRecentScans] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [recentAdminLogs, setRecentAdminLogs] = useState([]);
  const [kiosks, setKiosks] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [todaySearches, setTodaySearches] = useState(0);

  const filters = useMemo(() => ({}), []);
  const { data: reportsData, loading: reportsLoading } = useReportsData('month', filters);

  console.log(stats)

  useEffect(() => {
    const loadData = async () => {
      try {
        const { totalScans, buildingStats, totalDestinationSearches } = await fetchDashboardStats();
        const scanLogs = await fetchRecentScanLogs();
        const searchLogs = await fetchRecentDestinationSearch();
        const adminLogs = await fetchRecentAdminLogs();

        // Fetch kiosks and admins data
        const kioskData = await fetchKiosks();
        const adminData = await fetchAdmins();

        // Calculate today's searches
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todaySearchCount = searchLogs.filter(search => {
          const searchDate = new Date(search.timestamp);
          return searchDate >= today;
        }).length;

        setStats({ totalScans, buildingStats, totalDestinationSearches });
        setRecentScans(scanLogs.data.logs || []);
        setRecentSearches(searchLogs || []);
        setRecentAdminLogs(adminLogs || []);
        setKiosks(kioskData || []);
        setAdmins(adminData || []);
        setTodaySearches(todaySearchCount);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      pingAdmin();
    }, 30000);

    pingAdmin();

    return () => clearInterval(interval);
  }, []);

  // Calculate kiosk statistics
  const kioskStats = useMemo(() => {
    if (!kiosks || kiosks.length === 0) {
      return { active: 0, total: 0, percentage: 0 };
    }

    const activeKiosks = kiosks.filter(kiosk => kiosk.status === 'online').length;
    const totalKiosks = kiosks.length;
    const percentage = totalKiosks > 0 ? Math.min((activeKiosks / totalKiosks) * 100, 100) : 0;

    return { active: activeKiosks, total: totalKiosks, percentage };
  }, [kiosks]);

  // Calculate admin statistics
  const adminStats = useMemo(() => {
    if (!admins || admins.length === 0) {
      return { online: 0, total: 0, percentage: 0 };
    }

    const now = new Date();
    const threshold = 60 * 1000; // 1 minute in ms

    const activeAdmins = admins.filter(admin => {
      if (admin.isDisabled || !admin.lastSeen) return false;
      const lastSeen = new Date(admin.lastSeen);
      return now - lastSeen <= threshold;
    });

    const totalAdmins = admins.filter(admin => !admin.isDisabled).length;
    const percentage = totalAdmins > 0 ? Math.min((activeAdmins.length / totalAdmins) * 100, 100) : 0;

    return {
      online: activeAdmins.length,
      total: totalAdmins,
      percentage
    };
  }, [admins]);


  // Helper function to format admin action descriptions
  const formatAdminAction = (log) => {
    let latestEntry = null;
    const allEntries = [];

    if (Array.isArray(log.systemLogs?.kiosk)) {
      allEntries.push(...log.systemLogs.kiosk.map(entry => ({ ...entry, type: 'kiosk' })));
    }

    if (Array.isArray(log.systemLogs?.mapEditor?.room)) {
      allEntries.push(...log.systemLogs.mapEditor.room.map(entry => ({ ...entry, type: 'room' })));
    }

    if (Array.isArray(log.systemLogs?.mapEditor?.building)) {
      allEntries.push(...log.systemLogs.mapEditor.building.map(entry => ({ ...entry, type: 'building' })));
    }

    if (allEntries.length === 0) return 'Admin activity recorded';

    latestEntry = allEntries.reduce((latest, current) => {
      return new Date(current.dateOfChange) > new Date(latest.dateOfChange) ? current : latest;
    });

    // Format based on type
    if (latestEntry.type === 'kiosk') {
      return `${latestEntry.description} - Kiosk: ${latestEntry.kioskID}`;
    } else if (latestEntry.type === 'room') {
      return `${latestEntry.description} - Room in ${latestEntry.buildingName}, Floor ${latestEntry.floor}`;
    } else if (latestEntry.type === 'building') {
      return `${latestEntry.description} - Building: ${latestEntry.buildingName}`;
    }

    return 'Admin activity recorded';
  };

  // Helper function to get the most recent activity timestamp
  const getLatestActivityTime = (log) => {
    const timestamps = [];

    if (Array.isArray(log.systemLogs?.kiosk)) {
      log.systemLogs.kiosk.forEach(entry => {
        if (entry.dateOfChange) timestamps.push(new Date(entry.dateOfChange));
      });
    }

    if (Array.isArray(log.systemLogs?.mapEditor?.room)) {
      log.systemLogs.mapEditor.room.forEach(entry => {
        if (entry.dateOfChange) timestamps.push(new Date(entry.dateOfChange));
      });
    }

    if (Array.isArray(log.systemLogs?.mapEditor?.building)) {
      log.systemLogs.mapEditor.building.forEach(entry => {
        if (entry.dateOfChange) timestamps.push(new Date(entry.dateOfChange));
      });
    }

    return timestamps.length > 0
      ? new Date(Math.max(...timestamps))
      : new Date(log.lastLogin || log.joined);
  };

  // Calculate AI statistics with proper null checks and memoization
  const aiStats = useMemo(() => {
    if (reportsLoading || !reportsData?.chatbot) {
      return {
        aiInteractionPercentage: 0,
        avgResponseTimeColor: '#29D82F',
        totalInteractions: 0,
        avgResponseTime: 0,
        popularQueriesCount: 0,
        topQuery: 'No data',
        locationDetections: 0,
        successRate: 0
      };
    }

    const chatbot = reportsData.chatbot;
    const aiInteractionPercentage = chatbot.totalInteractions > 0
      ? Math.min((chatbot.totalInteractions / (chatbot.totalInteractions + 100)) * 100, 100)
      : 0;

    const avgResponseTimeColor = chatbot.avgResponseTime <= 1000 ? '#29D82F' :
      chatbot.avgResponseTime <= 3000 ? '#FFB800' : '#FF4444';

    const locationDetections = chatbot.locationDetectionStats?.reduce((acc, stat) => acc + stat.count, 0) || 0;
    const successfulDetections = chatbot.locationDetectionStats?.find(s => s._id === 'high')?.count || 0;
    const successRate = locationDetections > 0 ? Math.round((successfulDetections / locationDetections) * 100) : 0;

    return {
      aiInteractionPercentage,
      avgResponseTimeColor,
      totalInteractions: chatbot.totalInteractions || 0,
      avgResponseTime: Math.round(chatbot.avgResponseTime || 0),
      popularQueriesCount: chatbot.popularQueries?.length || 0,
      topQuery: chatbot.popularQueries?.[0]?.query || 'No data',
      locationDetections,
      successRate
    };
  }, [reportsData, reportsLoading]);

  const combinedLogs = useMemo(() => {
    const scanEntries = recentScans.map(scan => ({
      ...scan,
      type: 'QR Code',
      timestamp: scan.scannedAt ? new Date(scan.scannedAt) : null
    }));

    const searchEntries = recentSearches.map(search => ({
      ...search,
      type: 'Search',
      timestamp: search.timestamp ? new Date(search.timestamp) : null
    }));

    // const adminEntries = recentAdminLogs.map(log => ({
    //   ...log,
    //   type: 'Admin',
    //   timestamp: getLatestActivityTime(log)  // uses your helper function
    // }));

    // console.log(adminEntries);

    return [...scanEntries, ...searchEntries]
      .filter(log => log.timestamp) // remove any with null timestamps
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);
  }, [recentScans, recentSearches]);

  console.log(combinedLogs);

  return (
    <div className="w-[73.98dvw] flex gap-[1rem] ml-[19.5625rem] mt-[1.875rem]">
      <div className='w-[] flex flex-col gap-[.875rem]'>
        <div className='flex flex-col'>
          <h1 className='font-poppins font-bold text-[3rem]'>
            HI, ニューロ様
          </h1>
          <Divider />
        </div>

        <div className='flex flex-wrap gap-[1rem]'>
          {/* Active Kiosk Card */}
          <div className='w-[11rem] h-[8.5rem] bg-[#FBFCF8] shadow-md flex flex-col justify-center gap-[.75rem] px-[.875rem] font-roboto'>
            <h4 className='text-[#737373]'>Active Kiosk</h4>
            <span className='text-[#737373]'>
              <span className='text-black text-[2rem] font-bold'>
                {kioskStats.active}
              </span>/{kioskStats.total}
            </span>
            <div className="w-full h-[0.4375rem] bg-[#ECECEC] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#29D82F] transition-all duration-300"
                style={{ width: `${kioskStats.percentage}%` }}
              ></div>
            </div>
          </div>

          {/* Total Searches Today Card */}
          <div className='w-[11rem] h-[8.5rem] bg-[#FBFCF8] shadow-md flex flex-col justify-center gap-[.75rem] px-[.875rem] font-roboto'>
            <h4 className='text-[#737373]'>Total Searches Today</h4>
            <span className='text-[#737373]'>
              <span className='text-black text-[2rem] font-bold'>
                {todaySearches}
              </span> searches
            </span>
          </div>

          {/* Online Admin Card */}
          <div className='w-[11rem] h-[8.5rem] bg-[#FBFCF8] shadow-md flex flex-col justify-center gap-[.75rem] px-[.875rem] font-roboto'>
            <h4 className='text-[#737373]'>Online Admin</h4>
            <span className='text-[#737373]'>
              <span className='text-black text-[2rem] font-bold'>
                {adminStats.online}
              </span>/{adminStats.total}
            </span>
            <div className="w-full h-[0.4375rem] bg-[#ECECEC] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#4329D8] transition-all duration-300"
                style={{ width: `${adminStats.percentage}%` }}
              ></div>
            </div>
          </div>

          {/* AI Statistics Cards (keep existing) */}
          <div className='w-[11rem] h-[8.5rem] bg-[#FBFCF8] shadow-md flex flex-col justify-center gap-[.75rem] px-[.875rem] font-roboto'>
            <h4 className='text-[#737373]'>AI Interactions</h4>
            <span className='text-[#737373]'>
              <span className='text-black text-[2rem] font-bold'>
                {reportsLoading ? '...' : aiStats.totalInteractions}
              </span> today
            </span>
            <div className="w-full h-[0.4375rem] bg-[#ECECEC] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#FF6B35] transition-all duration-300"
                style={{ width: `${aiStats.aiInteractionPercentage}%` }}
              ></div>
            </div>
          </div>

          <div className='w-[11rem] h-[8.5rem] bg-[#FBFCF8] shadow-md flex flex-col justify-center gap-[.75rem] px-[.875rem] font-roboto'>
            <h4 className='text-[#737373]'>Avg Response Time</h4>
            <span className='text-[#737373]'>
              <span className='text-black text-[2rem] font-bold'>
                {reportsLoading ? '...' : aiStats.avgResponseTime}
              </span>ms
            </span>
            <div className="w-full h-[0.4375rem] bg-[#ECECEC] rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${Math.min((3000 - aiStats.avgResponseTime) / 3000 * 100, 100)}%`,
                  backgroundColor: aiStats.avgResponseTimeColor
                }}
              ></div>
            </div>
          </div>

          <div className='w-[11rem] h-[8.5rem] bg-[#FBFCF8] shadow-md flex flex-col justify-center gap-[.75rem] px-[.875rem] font-roboto'>
            <h4 className='text-[#737373]'>Popular Queries</h4>
            <span className='text-[#737373]'>
              <span className='text-black text-[2rem] font-bold'>
                {reportsLoading ? '...' : aiStats.popularQueriesCount}
              </span> unique
            </span>
            <div className="w-full text-[0.625rem] text-[#737373] truncate">
              {reportsLoading ? 'Loading...' : aiStats.topQuery}
            </div>
          </div>

          <div className='w-[11rem] h-[8.5rem] bg-[#FBFCF8] shadow-md flex flex-col justify-center gap-[.75rem] px-[.875rem] font-roboto'>
            <h4 className='text-[#737373]'>Location Detection</h4>
            <span className='text-[#737373]'>
              <span className='text-black text-[2rem] font-bold'>
                {reportsLoading ? '...' : aiStats.locationDetections}
              </span> detected
            </span>
            <div className="w-full text-[0.625rem] text-[#737373]">
              {reportsLoading ? 'Loading...' : `${aiStats.successRate}% success rate`}
            </div>
          </div>
        </div>

        {/* Rest of your component remains the same */}
        <div className='flex flex-col gap-[1rem]'>
          <h2 className='font-poppins font-bold text-[1.125rem]'>RECENT INTERACTION LOG</h2>
          <div className='h-[28.8125rem] overflow-auto flex flex-col font-roboto gap-[1rem] min-w-0'>
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
                    <span className="font-bold break-words">{log.type || log.buildingName}</span>
                  </div>
                  <span className="font-bold">{log.searchQuery || log.buildingName}</span>
                  <span className="text-sm text-[#737373]">{new Date(log.timestamp || log.scannedAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className='flex flex-col gap-[1rem] font-roboto'>
          <h2 className='font-poppins font-bold text-[1.125rem]'>RECENT ADMIN LOG</h2>
          <div className='h-[28.8125rem] overflow-auto flex flex-col font-roboto gap-[1rem] min-w-0'>
            {recentAdminLogs.length > 0 ? (
              recentAdminLogs.map((admin, idx) => (
                <div key={admin._id || idx} className='px-[1rem] py-[1.25rem] flex flex-col gap-[.875rem] bg-[#FBFCF8] shadow-md'>
                  <div className='flex gap-[.875rem] items-center'>
                    <UserIcon />
                    <span className='font-medium'>{admin.full_name}</span>
                    <div className={`px-2 py-1 text-xs rounded ${admin.status === 'online' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {admin.status}
                    </div>
                  </div>
                  <div className='flex gap-[.75rem]'>
                    <ClockIcon />
                    <span className='text-[#737373] text-[.875rem]'>
                      {getLatestActivityTime(admin).toLocaleString()}
                    </span>
                  </div>
                  <div className='flex gap-[.875rem]'>
                    <Adrenaline />
                    <span className="text-[#737373] text-[.875rem] break-words">
                      {formatAdminAction(admin)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className='px-[1rem] py-[1.25rem] bg-[#FBFCF8] shadow-md text-center text-gray-500'>
                No recent admin activity
              </div>
            )}
          </div>
        </div>
      </div>

      <div className='flex flex-col gap-[1rem] pt-[3.125rem]'>
        <div className='w-[] flex flex-col gap-[.875rem]'>
          <h2 className='font-poppins font-bold text-[1.125rem] text-center'>CAMPUS MAP PREVIEW</h2>
          <CampusMap width={'25.375rem'} height={'21rem'} />
        </div>
        <PopularDestinationsGraph
          data={reportsData}
          loading={reportsLoading}
        />
      </div>
    </div>
  )
}

export default Dashboard
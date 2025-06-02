import React, { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import ExportsIcon from '../assets/Icons/ExportsIcon';
import QrCodeIcon from '../assets/Icons/Reports/QrCodeIcon';
import LocationIcon from '../assets/Icons/Reports/LocationIcon';
import SearchIcon from '../assets/Icons/Reports/SearchIcon';
import AdrenalineIcon from '../assets/Icons/Reports/AdrenalineIcon';
import { useReportsData } from '../hooks/useReportsData'; // Adjust path as needed
import CommonPlacesChart from '../components/CommonPlacesChart';
import SearchActivityChart from '../components/SearchActivityChart';

const Reports = () => {
  const [timeframe, setTimeframe] = useState('month');
  const [filters, setFilters] = useState({});

  const {
    data,
    loading,
    error,
    refetch,
    exportData,
    getMostActiveKiosk,
    getMostActiveBuilding
  } = useReportsData(timeframe, filters);

  const mostActiveKiosk = getMostActiveKiosk();
  const mostActiveBuilding = getMostActiveBuilding();

  // Calculate percentage change for scans based on timeframe and dailyScans data
  const calculateScansPercentageChange = () => {
    if (!data?.dailyScans || data.dailyScans.length === 0) {
      return { percentage: 0, trend: 'neutral', isValid: false };
    }

    const dailyScans = data.dailyScans;
    const totalDays = dailyScans.length;

    let splitPoint;
    switch (timeframe) {
      case 'week':
        splitPoint = Math.floor(totalDays / 2);
        break;
      case 'month':
        splitPoint = Math.floor(totalDays / 2);
        break;
      case 'year':
        splitPoint = Math.floor(totalDays / 2);
        break;
      default:
        splitPoint = Math.floor(totalDays / 2);
    }

    const currentPeriod = dailyScans.slice(0, splitPoint);
    const previousPeriod = dailyScans.slice(splitPoint);

    const currentTotal = currentPeriod.reduce((sum, day) => sum + day.totalScans, 0);
    const previousTotal = previousPeriod.reduce((sum, day) => sum + day.totalScans, 0);

    if (previousTotal === 0 && currentTotal === 0) {
      return { percentage: 0, trend: 'neutral', isValid: false };
    }

    if (previousTotal === 0) {
      return { percentage: 100, trend: 'up', isValid: true };
    }

    const percentageChange = ((currentTotal - previousTotal) / previousTotal) * 100;
    const trend = percentageChange > 0 ? 'up' : percentageChange < 0 ? 'down' : 'neutral';

    return {
      percentage: Math.abs(Math.round(percentageChange)),
      trend,
      isValid: true,
      currentTotal,
      previousTotal
    };
  };

  const calculateSearchesPercentageChange = () => {
    if (data?.dailySearches && data.dailySearches.length > 0) {
      const dailySearches = data.dailySearches;
      const totalDays = dailySearches.length;
      const splitPoint = Math.floor(totalDays / 2);

      const currentPeriod = dailySearches.slice(0, splitPoint);
      const previousPeriod = dailySearches.slice(splitPoint);

      const currentTotal = currentPeriod.reduce((sum, day) => sum + (day.totalSearches || 0), 0);
      const previousTotal = previousPeriod.reduce((sum, day) => sum + (day.totalSearches || 0), 0);

      if (previousTotal === 0 && currentTotal === 0) {
        return { percentage: 0, trend: 'neutral', isValid: false };
      }

      if (previousTotal === 0) {
        return { percentage: 100, trend: 'up', isValid: true };
      }

      const percentageChange = ((currentTotal - previousTotal) / previousTotal) * 100;
      const trend = percentageChange > 0 ? 'up' : percentageChange < 0 ? 'down' : 'neutral';

      return {
        percentage: Math.abs(Math.round(percentageChange)),
        trend,
        isValid: true,
        currentTotal,
        previousTotal
      };
    }

    if (data?.frequentDestinations && data.frequentDestinations.length > 0) {
      const destinations = data.frequentDestinations;
      const now = new Date();

      let recentActivity = 0;
      let olderActivity = 0;

      let cutoffDate;
      switch (timeframe) {
        case 'week':
          cutoffDate = new Date(now.getTime() - 3.5 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          cutoffDate = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          cutoffDate = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          cutoffDate = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
      }

      destinations.forEach(dest => {
        const lastAccessed = new Date(dest.lastAccessed);
        if (lastAccessed >= cutoffDate) {
          recentActivity += dest.count;
        } else {
          olderActivity += dest.count;
        }
      });

      if (olderActivity === 0 && recentActivity === 0) {
        return { percentage: 0, trend: 'neutral', isValid: false };
      }

      if (olderActivity === 0) {
        return { percentage: 100, trend: 'up', isValid: true, isEstimate: true };
      }

      const percentageChange = ((recentActivity - olderActivity) / olderActivity) * 100;
      const trend = percentageChange > 0 ? 'up' : percentageChange < 0 ? 'down' : 'neutral';

      return {
        percentage: Math.abs(Math.round(percentageChange)),
        trend,
        isValid: true,
        isEstimate: true,
        recentActivity,
        olderActivity
      };
    }

    return { percentage: 0, trend: 'neutral', isValid: false };
  };

  const getTimeframeLabel = () => {
    switch (timeframe) {
      case 'week':
        return 'last week';
      case 'month':
        return 'last month';
      case 'year':
        return 'last year';
      default:
        return 'previous period';
    }
  };

  const handleExport = () => {
    try {
      exportData();
    }
    catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="w-[73.98dvw] flex flex-col gap-[1.1875rem] ml-[19.5625rem] mt-[1.875rem]">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading reports...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-[73.98dvw] flex flex-col gap-[1.1875rem] ml-[19.5625rem] mt-[1.875rem]">
        <div className="flex justify-center items-center h-64">
          <div className="text-red-500">{error}</div>
          <button
            onClick={refetch}
            className="ml-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const scansChangeStats = calculateScansPercentageChange();
  const searchesChangeStats = calculateSearchesPercentageChange();

  console.log('Scans change calculation:', scansChangeStats);
  console.log('Searches change calculation:', searchesChangeStats);
  console.log(data);

  const formatScansChangeDisplay = () => {
    if (!scansChangeStats.isValid) {
      return 'No comparison data available';
    }

    const sign = scansChangeStats.trend === 'up' ? '+' : scansChangeStats.trend === 'down' ? '-' : '';
    const color = scansChangeStats.trend === 'up' ? 'text-green-600' :
      scansChangeStats.trend === 'down' ? 'text-red-600' : 'text-gray-600';

    return (
      <span className={color}>
        {sign}{scansChangeStats.percentage}% from {getTimeframeLabel()}
      </span>
    );
  };

  const formatSearchesChangeDisplay = () => {
    if (!searchesChangeStats.isValid) {
      return 'No comparison data available';
    }

    const sign = searchesChangeStats.trend === 'up' ? '+' : searchesChangeStats.trend === 'down' ? '-' : '';
    const color = searchesChangeStats.trend === 'up' ? 'text-green-600' :
      searchesChangeStats.trend === 'down' ? 'text-red-600' : 'text-gray-600';

    const estimate = searchesChangeStats.isEstimate ? ' (estimated)' : '';

    return (
      <span className={color}>
        {sign}{searchesChangeStats.percentage}% from {getTimeframeLabel()}{estimate}
      </span>
    );
  };

  return (
    <div className="w-[73.98dvw] flex flex-col gap-[1.1875rem] ml-[19.5625rem] mt-[1.875rem]">
      <div className='flex justify-between items-center'>
        <div className='flex flex-col'>
          <span className='font-poppins font-bold text-[1.125rem]'>REPORTS</span>
          <p className='font-roboto text-[.875rem] text-[#737373]'>Access logs and insights on system activity and user interactions.</p>
        </div>
        <button
          onClick={handleExport}
          className='font-poppins font-bold text-[.75rem] text-[#16790D] border-solid border-1 border-[#16790D] bg-[#D1FAD9] flex justify-center items-center gap-[0.625rem] py-[0.5625rem] px-[1rem] hover:bg-[#C5F4CE] transition-colors'
        >
          <ExportsIcon />
          <span>Exports</span>
        </button>
      </div>
      <div className="flex gap-2 mb-4">
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded text-sm"
        >
          <option value="week">Last Week</option>
          <option value="month">Last Month</option>
          <option value="year">Last Year</option>
        </select>
      </div>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-[1rem] font-roboto'>
        <div className='flex-1 flex-col bg-[#FBFCF8] shadow-md py-[1.4375rem] px-[1.75rem]'>
          <div className='flex flex-col gap-[0.5625rem]'>
            <span className='font-roboto text-[#4B5563] text-[.875rem] font-bold'>Total QR Codes Scanned</span>
            <div className='flex gap-[0.6875rem]'>
              <div className='bg-[#A855F71A] px-[0.5625rem] py-[0.375rem] flex items-center justify-center rounded-[.25rem]'>
                <QrCodeIcon />
              </div>
              <div className='flex flex-col'>
                <span className='text-[1.25rem] font-bold'>{data.totalScans.toLocaleString()} Scanned</span>
                <span className='text-[.875rem]'>{formatScansChangeDisplay()}</span>
              </div>
            </div>
          </div>
        </div>
        <div className='flex-1 flex-col bg-[#FBFCF8] shadow-md py-[1.4375rem] px-[1.75rem]'>
          <div className='flex flex-col gap-[0.5625rem]'>
            <span className='font-roboto text-[#4B5563] text-[.875rem] font-bold'>Most Active Building</span>
            <div className='flex gap-[0.6875rem]'>
              <div className='bg-[#D1D6FA] px-[0.5625rem] py-[0.375rem] flex items-center justify-center rounded-[.25rem]'>
                <LocationIcon />
              </div>
              <div className='flex flex-col'>
                <span className='text-[1.25rem] font-bold'>{mostActiveBuilding.name}</span>
                <span className='text-[.875rem] text-[#4B5563]'>{mostActiveBuilding.totalScans.toLocaleString()} scans</span>
              </div>
            </div>
          </div>
        </div>
        <div className='flex-1 flex-col bg-[#FBFCF8] shadow-md py-[1.4375rem] px-[1.75rem]'>
          <div className='flex flex-col gap-[0.5625rem]'>
            <span className='font-roboto text-[#4B5563] text-[.875rem] font-bold'>Total Searches Conducted</span>
            <div className='flex gap-[0.6875rem]'>
              <div className='bg-[#D1FAD9] px-[0.5625rem] py-[0.375rem] flex items-center justify-center rounded-[.25rem]'>
                <SearchIcon />
              </div>
              <div className='flex flex-col'>
                <span className='text-[1.25rem] font-bold'>{data.totalDestinationSearches.toLocaleString()}</span>
                <span className='text-[.875rem]'>{formatSearchesChangeDisplay()}</span>
              </div>
            </div>
          </div>
        </div>
        <div className='flex-1 flex-col bg-[#FBFCF8] shadow-md py-[1.4375rem] px-[1.75rem]'>
          <div className='flex flex-col gap-[0.5625rem]'>
            <span className='font-roboto text-[#4B5563] text-[.875rem] font-bold'>Most Active Kiosk</span>
            <div className='flex gap-[0.6875rem]'>
              <div className='bg-[#F973161A] px-[0.5625rem] py-[0.375rem] flex items-center justify-center rounded-[.25rem]'>
                <AdrenalineIcon />
              </div>
              <div className='flex flex-col'>
                <span className='text-[1.25rem] font-bold'>{mostActiveKiosk.id}</span>
                <span className='text-[.875rem] text-[#4B5563]'>{mostActiveKiosk.interactions.toLocaleString()} interactions</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <CommonPlacesChart
        data={data.frequentDestinations}
        timeframe={timeframe}
      />
      <SearchActivityChart
        data={data.dailySearches || []}
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
      />
    </div>
  );
}

export default Reports
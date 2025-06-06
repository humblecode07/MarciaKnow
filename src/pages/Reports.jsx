import React, { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import ExportsIcon from '../assets/Icons/ExportsIcon';
import QrCodeIcon from '../assets/Icons/Reports/QrCodeIcon';
import LocationIcon from '../assets/Icons/Reports/LocationIcon';
import SearchIcon from '../assets/Icons/Reports/SearchIcon';
import AdrenalineIcon from '../assets/Icons/Reports/AdrenalineIcon';
// Add ChatBot icon - you may need to create this or use an existing one
import ChatBotIcon from '../assets/Icons/Reports/ChatBotIcon'; // You'll need to create this icon
import { useReportsData } from '../hooks/useReportsData';
import CommonPlacesChart from '../components/CommonPlacesChart';
import SearchActivityChart from '../components/SearchActivityChart';
import InteractionsLog from '../components/InteractionsLog';
import { pingAdmin } from '../api/api';

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
    getMostActiveBuilding,
    getMostActiveChatbotKiosk,
    getMostPopularQuery
  } = useReportsData(timeframe, filters);

  const mostActiveKiosk = getMostActiveKiosk();
  const mostActiveBuilding = getMostActiveBuilding();
  const mostActiveChatbotKiosk = getMostActiveChatbotKiosk();
  const mostPopularQuery = getMostPopularQuery();

  // Calculate chatbot percentage change
  const calculateChatbotPercentageChange = () => {
    if (!data?.chatbot?.dailyInteractions || data.chatbot.dailyInteractions.length === 0) {
      return { percentage: 0, trend: 'neutral', isValid: false };
    }

    const dailyInteractions = [...data.chatbot.dailyInteractions].reverse();

    const totalDays = dailyInteractions.length;
    const splitPoint = Math.floor(totalDays / 2);

    const previousPeriod = dailyInteractions.slice(0, splitPoint);
    const currentPeriod = dailyInteractions.slice(splitPoint);

    const currentTotal = currentPeriod.reduce((sum, day) => sum + day.count, 0);
    const previousTotal = previousPeriod.reduce((sum, day) => sum + day.count, 0);

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
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      pingAdmin();
    }, 30000);

    pingAdmin();

    return () => clearInterval(interval);
  }, []);

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
  const chatbotChangeStats = calculateChatbotPercentageChange();

  console.log('Scans change calculation:', scansChangeStats);
  console.log('Searches change calculation:', searchesChangeStats);
  console.log('Chatbot change calculation:', chatbotChangeStats);
  console.log(data);

  const formatScansChangeDisplay = () => {
    if (!scansChangeStats.isValid) {
      return 'No comparison data available';
    }
    const sign = scansChangeStats.trend === 'up' ? '+' : scansChangeStats.trend === 'down' ? '-' : '';
    const color = scansChangeStats.trend === 'up' ? 'text-green-600' : scansChangeStats.trend === 'down' ? 'text-red-600' : 'text-gray-600';
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
    const color = searchesChangeStats.trend === 'up' ? 'text-green-600' : searchesChangeStats.trend === 'down' ? 'text-red-600' : 'text-gray-600';
    const estimate = searchesChangeStats.isEstimate ? ' (estimated)' : '';
    return (
      <span className={color}>
        {sign}{searchesChangeStats.percentage}% from {getTimeframeLabel()}{estimate}
      </span>
    );
  };

  const formatChatbotChangeDisplay = () => {
    if (!chatbotChangeStats.isValid) {
      return 'No comparison data available';
    }
    const sign = chatbotChangeStats.trend === 'up' ? '+' : chatbotChangeStats.trend === 'down' ? '-' : '';

    console.log('saywhat', chatbotChangeStats);

    const color = chatbotChangeStats.trend === 'up' ? 'text-green-600' : chatbotChangeStats.trend === 'down' ? 'text-red-600' : 'text-gray-600';
    return (
      <span className={color}>
        {sign}{chatbotChangeStats.percentage}% from {getTimeframeLabel()}
      </span>
    );
  };

  return (
    <div className="w-[73.98dvw] flex flex-col gap-[1.1875rem] ml-[19.5625rem] mt-[1.875rem]">
      <div className='flex justify-between items-center'>
        <div className='flex flex-col'>
          <span className='font-poppins font-bold text-[1.125rem]'>REPORTS</span>
          <p className='font-roboto text-[.875rem] text-[#737373]'>
            Access logs and insights on system activity and user interactions.
          </p>
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

      {/* Updated grid to accommodate 6 cards in 2 rows */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-[1rem] font-roboto'>
        {/* Existing QR Code Scans Card */}
        <div className='flex-1 flex-col bg-[#FBFCF8] shadow-md py-[1.4375rem] px-[1.75rem]'>
          <div className='flex flex-col gap-[0.5625rem]'>
            <span className='font-roboto text-[#4B5563] text-[.875rem] font-bold'>
              Total QR Codes Scanned
            </span>
            <div className='flex gap-[0.6875rem]'>
              <div className='bg-[#A855F71A] px-[0.5625rem] py-[0.375rem] flex items-center justify-center rounded-[.25rem]'>
                <QrCodeIcon />
              </div>
              <div className='flex flex-col'>
                <span className='text-[1.25rem] font-bold'>
                  {data.totalScans.toLocaleString()} Scanned
                </span>
                <span className='text-[.875rem]'>{formatScansChangeDisplay()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Existing Most Active Building Card */}
        <div className='flex-1 flex-col bg-[#FBFCF8] shadow-md py-[1.4375rem] px-[1.75rem]'>
          <div className='flex flex-col gap-[0.5625rem]'>
            <span className='font-roboto text-[#4B5563] text-[.875rem] font-bold'>
              Most Active Building
            </span>
            <div className='flex gap-[0.6875rem]'>
              <div className='bg-[#D1D6FA] px-[0.5625rem] py-[0.375rem] flex items-center justify-center rounded-[.25rem]'>
                <LocationIcon />
              </div>
              <div className='flex flex-col'>
                <span className='text-[1.25rem] font-bold'>
                  {mostActiveBuilding.name}
                </span>
                <span className='text-[.875rem] text-[#4B5563]'>
                  {mostActiveBuilding.totalScans.toLocaleString()} scans
                </span>
              </div>
            </div>
          </div>
        </div>
        {/* Existing Total Searches Card */}
        <div className='flex-1 flex-col bg-[#FBFCF8] shadow-md py-[1.4375rem] px-[1.75rem]'>
          <div className='flex flex-col gap-[0.5625rem]'>
            <span className='font-roboto text-[#4B5563] text-[.875rem] font-bold'>
              Total Searches Conducted
            </span>
            <div className='flex gap-[0.6875rem]'>
              <div className='bg-[#D1FAD9] px-[0.5625rem] py-[0.375rem] flex items-center justify-center rounded-[.25rem]'>
                <SearchIcon />
              </div>
              <div className='flex flex-col'>
                <span className='text-[1.25rem] font-bold'>
                  {data.totalDestinationSearches.toLocaleString()}
                </span>
                <span className='text-[.875rem]'>{formatSearchesChangeDisplay()}</span>
              </div>
            </div>
          </div>
        </div>
        {/* NEW: ChatBot Interactions Card */}
        <div className='flex-1 flex-col bg-[#FBFCF8] shadow-md py-[1.4375rem] px-[1.75rem]'>
          <div className='flex flex-col gap-[0.5625rem]'>
            <span className='font-roboto text-[#4B5563] text-[.875rem] font-bold'>
              ChatBot Interactions
            </span>
            <div className='flex gap-[0.6875rem]'>
              <div className='bg-[#E0F2FE] px-[0.5625rem] py-[0.375rem] flex items-center justify-center rounded-[.25rem]'>
                {/* If you don't have ChatBotIcon, you can use a simple SVG or text */}
                <ChatBotIcon />
              </div>
              <div className='flex flex-col'>
                <span className='text-[1.25rem] font-bold'>
                  {data.chatbot.totalInteractions.toLocaleString()}
                </span>
                <span className='text-[.875rem]'>{formatChatbotChangeDisplay()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* NEW: Most Popular Query Card */}
        <div className='flex-1 flex-col bg-[#FBFCF8] shadow-md py-[1.4375rem] px-[1.75rem]'>
          <div className='flex flex-col gap-[0.5625rem]'>
            <span className='font-roboto text-[#4B5563] text-[.875rem] font-bold'>
              Most Popular Query
            </span>
            <div className='flex gap-[0.6875rem]'>
              <div className='bg-[#FEF3C7] px-[0.5625rem] py-[0.375rem] flex items-center justify-center rounded-[.25rem]'>
                <span className="text-[#F59E0B] text-xs">?</span>

              </div>
              <div className='flex flex-col'>
                <span className='text-[1.25rem] font-bold truncate max-w-[200px]' title={mostPopularQuery.query}>
                  {mostPopularQuery.query}
                </span>
                <span className='text-[.875rem] text-[#4B5563]'>
                  {mostPopularQuery.count} times asked
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Existing Most Active Kiosk Card */}
        <div className='flex-1 flex-col bg-[#FBFCF8] shadow-md py-[1.4375rem] px-[1.75rem]'>
          <div className='flex flex-col gap-[0.5625rem]'>
            <span className='font-roboto text-[#4B5563] text-[.875rem] font-bold'>
              Most Active Kiosk
            </span>
            <div className='flex gap-[0.6875rem]'>
              <div className='bg-[#F973161A] px-[0.5625rem] py-[0.375rem] flex items-center justify-center rounded-[.25rem]'>
                <AdrenalineIcon />
              </div>
              <div className='flex flex-col'>
                <span className='text-[1.25rem] font-bold'>
                  {mostActiveKiosk.id}
                </span>
                <span className='text-[.875rem] text-[#4B5563]'>
                  {mostActiveKiosk.interactions.toLocaleString()} interactions
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NEW: ChatBot Metrics Section */}
      <div className='bg-[#FBFCF8] shadow-md py-[1.4375rem] px-[1.75rem] font-roboto'>
        <div className='flex flex-col gap-[1rem]'>
          <div className='flex justify-between items-center'>
            <span className='font-roboto text-[#4B5563] text-[1rem] font-bold'>
              ChatBot Performance Metrics
            </span>
            <span className='text-[.75rem] text-[#737373]'>
              Average Response Time: {data.chatbot.avgResponseTime.toFixed(0)}ms
            </span>
          </div>

          {/* ChatBot Stats Grid */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-[1rem]'>
            {/* Action Breakdown */}
            <div className='bg-white p-4 rounded-lg shadow-sm'>
              <h4 className='font-bold text-[.875rem] text-[#4B5563] mb-2'>Action Breakdown</h4>
              {data.chatbot.actionBreakdown && data.chatbot.actionBreakdown.length > 0 ? (
                data.chatbot.actionBreakdown.map((action, index) => {
                  // Function to format action names for better readability
                  const formatActionName = (actionId) => {
                    if (!actionId) return 'Unknown Action';

                    // Handle common action types
                    const actionMap = {
                      'search': 'Location Search',
                      'navigate': 'Navigation Request',
                      'info': 'Information Query',
                      'help': 'Help Request',
                      'feedback': 'User Feedback',
                      'emergency': 'Emergency Assistance'
                    };

                    // Return mapped name or format the original
                    return actionMap[actionId.toLowerCase()] ||
                      actionId.replace(/[_-]/g, ' ')
                        .split(' ')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                        .join(' ');
                  };

                  return (
                    <div key={index} className='flex justify-between items-center py-1'>
                      <span className='text-[.75rem] text-[#6B7280]'>
                        {formatActionName(action._id)}
                      </span>
                      <span className='text-[.75rem] font-medium'>
                        {action.count?.toLocaleString() || 0}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className='text-[.75rem] text-[#9CA3AF] italic'>No action data available</div>
              )}
            </div>

            {/* Location Detection Stats - Improved */}
            <div className='bg-white p-4 rounded-lg shadow-sm'>
              <h4 className='font-bold text-[.875rem] text-[#4B5563] mb-2'>Location Detection</h4>
              {data.chatbot.locationDetectionStats && data.chatbot.locationDetectionStats.length > 0 ? (
                data.chatbot.locationDetectionStats.map((stat, index) => {
                  // Function to determine the status label
                  const getStatusLabel = (statId) => {
                    // Handle different possible values for _id
                    if (statId === true || statId === 'true' || statId === 1 || statId === 'success') {
                      return 'Successful';
                    } else if (statId === false || statId === 'false' || statId === 0 || statId === 'failed') {
                      return 'Failed';
                    } else if (typeof statId === 'string') {
                      // If it's a string, format it nicely
                      return statId.charAt(0).toUpperCase() + statId.slice(1).toLowerCase();
                    }
                    return 'Unknown Status';
                  };

                  const statusLabel = getStatusLabel(stat._id);
                  const isSuccess = statusLabel === 'Successful';

                  return (
                    <div key={index} className='flex justify-between items-center py-1'>
                      <div className='flex items-center gap-2'>
                        <div className={`w-2 h-2 rounded-full ${isSuccess ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className='text-[.75rem] text-[#6B7280]'>
                          {statusLabel}
                        </span>
                      </div>
                      <span className='text-[.75rem] font-medium'>
                        {stat.count?.toLocaleString() || 0}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className='text-[.75rem] text-[#9CA3AF] italic'>No location detection data available</div>
              )}
            </div>
            {/* Most Active ChatBot Kiosk */}
            <div className='bg-white p-4 rounded-lg shadow-sm'>
              <h4 className='font-bold text-[.875rem] text-[#4B5563] mb-2'>Top ChatBot Kiosks</h4>
              {data.chatbot.kioskActivity.slice(0, 3).map((kiosk, index) => (
                <div key={index} className='flex justify-between items-center py-1'>
                  <span className='text-[.75rem] text-[#6B7280]'>{kiosk._id}</span>
                  <span className='text-[.75rem] font-medium'>{kiosk.interactions}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Popular Queries List */}
          <div className='bg-white p-4 rounded-lg shadow-sm'>
            <h4 className='font-bold text-[.875rem] text-[#4B5563] mb-3'>Popular ChatBot Queries</h4>
            <div className='space-y-2'>
              {data.chatbot.popularQueries.slice(0, 5).map((query, index) => (
                <div key={index} className='flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0'>
                  <div className='flex-1'>
                    <span className='text-[.75rem] text-[#374151] font-medium'>{query.query}</span>
                    <div className='text-[.625rem] text-[#6B7280]'>
                      Last asked: {new Date(query.lastAsked).toLocaleDateString()}
                    </div>
                  </div>
                  <div className='text-right'>
                    <div className='text-[.75rem] font-bold text-[#4B5563]'>{query.count}x</div>
                    <div className='text-[.625rem] text-[#6B7280]'>{query.avgResponseTime.toFixed(0)}ms</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <InteractionsLog timeframe={timeframe} />
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
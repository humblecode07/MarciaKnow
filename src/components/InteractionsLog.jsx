import React, { useState, useEffect, useCallback } from 'react';
import { axiosPrivate } from '../api/api';

// Mock icons - replace with your actual icons
const SearchIcon = () => (
   <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7.333 12.667A5.333 5.333 0 1 0 7.333 2a5.333 5.333 0 0 0 0 10.667ZM14 14l-2.9-2.9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
   </svg>
);

const QrCodeIcon = () => (
   <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 1h6v6H1V1ZM9 1h6v6H9V1ZM1 9h6v6H1V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
   </svg>
);

const ClockIcon = () => (
   <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M8 4v4l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
   </svg>
);

const KioskIcon = () => (
   <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="3" width="12" height="8" rx="1" stroke="currentColor" strokeWidth="2" />
      <path d="M6 11v2M10 11v2M4 13h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
   </svg>
);

const InteractionsLog = ({ timeframe = 'week' }) => {
   const [interactions, setInteractions] = useState([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);
   const [currentPage, setCurrentPage] = useState(1);
   const [totalCount, setTotalCount] = useState(0);
   const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe);

   const itemsPerPage = 10;

   // Fetch QR scan logs
   const fetchQrScans = async (page = 1, limit = 50) => {
      try {
         const response = await axiosPrivate.get(`/qrscan/logs/recent?page=${page}&limit=${limit}`);
         return response.data.data.logs.map(log => ({
            id: log._id,
            type: 'qr_scan',
            timestamp: log.scannedAt,
            buildingName: log.buildingName,
            buildingId: log.buildingId,
            kioskId: log.kioskId,
            details: `QR Code scanned for ${log.buildingName}`
         }));
      } catch (error) {
         console.error('Error fetching QR scans:', error);
         return [];
      }
   };

   // Fetch destination search logs  
   const fetchDestinationSearches = async () => {
      try {
         // Since there's no endpoint for recent destination logs, we'll use frequent destinations
         // and extract recent activity. In a real implementation, you'd want a proper endpoint.
         const response = await axiosPrivate.get('/destinationlog/frequent-destinations?timeframe=week');

         // Transform the data to look like individual search events
         // This is a workaround - you should create a proper recent searches endpoint
         const searchLogs = [];

         response.data.destinations.forEach(dest => {
            for (let i = 0; i < Math.min(dest.count, 5); i++) {
               searchLogs.push({
                  id: `${dest.buildingId}-${dest.roomId || 'building'}-${i}`,
                  type: 'search',
                  timestamp: new Date(dest.lastAccessed).toISOString(),
                  buildingName: dest.buildingName,
                  buildingId: dest.buildingId,
                  kioskId: dest.kioskId, // Mock kiosk ID
                  destinationType: dest.destinationType,
                  roomName: dest.roomName,
                  details: dest.destinationType === 'room'
                     ? `Searched for room: ${dest.roomName}`
                     : `Searched for building: ${dest.buildingName}`
               });
            }
         });

         return searchLogs;
      } catch (error) {
         console.error('Error fetching destination searches:', error);
         return [];
      }
   };

   const fetchInteractions = useCallback(async () => {
      try {
         setLoading(true);
         setError(null);

         const [qrScans, searches] = await Promise.all([
            fetchQrScans(1, 100), // Fetch more to have enough data
            fetchDestinationSearches()
         ]);

         const allInteractions = [...qrScans, ...searches];

         allInteractions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

         const now = new Date();
         let cutoffDate;

         switch (selectedTimeframe) {
            case 'day':
               cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
               break;
            case 'week':
               cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
               break;
            case 'month':
               cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
               break;
            default:
               cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
         }

         const filteredInteractions = allInteractions.filter(
            interaction => new Date(interaction.timestamp) >= cutoffDate
         );

         setTotalCount(filteredInteractions.length);
         setInteractions(filteredInteractions);
      } catch (err) {
         setError('Failed to load interactions log');
         console.error('Error fetching interactions:', err);
      } finally {
         setLoading(false);
      }
   }, [selectedTimeframe]);

   useEffect(() => {
      fetchInteractions();
   }, [fetchInteractions]);

   const formatTimestamp = (timestamp) => {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
         year: 'numeric',
         month: '2-digit',
         day: '2-digit',
         hour: '2-digit',
         minute: '2-digit',
         second: '2-digit',
         hour12: false
      });
   };

   const getPaginatedData = () => {
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      return interactions.slice(startIndex, endIndex);
   };

   const totalPages = Math.ceil(totalCount / itemsPerPage);

   const handlePageChange = (newPage) => {
      if (newPage >= 1 && newPage <= totalPages) {
         setCurrentPage(newPage);
      }
   };

   if (loading) {
      return (
         <div className="bg-white border border-gray-200 shadow-sm">
            <div className="flex justify-center items-center h-48">
               <div className="text-gray-500">Loading interactions...</div>
            </div>
         </div>
      );
   }

   if (error) {
      return (
         <div className="bg-white border border-gray-200 shadow-sm">
            <div className="flex justify-center items-center h-48">
               <div className="text-red-500">{error}</div>
            </div>
         </div>
      );
   }

   const paginatedData = getPaginatedData();

   return (
      <div className="bg-white border border-gray-200 shadow-sm">
         <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <div>
               <h3 className="font-roboto font-medium text-gray-900">
                  Interactions Log: <span className="font-normal">{totalCount} interactions</span>
               </h3>
            </div>
            <div>
               <select
                  value={selectedTimeframe}
                  onChange={(e) => {
                     setSelectedTimeframe(e.target.value);
                     setCurrentPage(1);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded text-sm font-roboto focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
               >
                  <option value="day">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
               </select>
            </div>
         </div>
         <div className="divide-y divide-gray-100">
            {paginatedData.length === 0 ? (
               <div className="flex justify-center items-center h-32">
                  <div className="text-gray-500 font-roboto">No interactions found for the selected timeframe</div>
               </div>
            ) : (
               paginatedData.map((interaction, index) => (
                  <div key={interaction.id} className="p-6 hover:bg-gray-50 transition-colors">
                     <div className="flex justify-between items-start">
                        <div className="flex-1">
                           <div className="flex items-center gap-2 mb-2">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${interaction.type === 'qr_scan'
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-blue-100 text-blue-700'
                                 }`}>
                                 {interaction.type === 'qr_scan' ? <QrCodeIcon /> : <SearchIcon />}
                                 {interaction.type === 'qr_scan' ? 'QR Scan' : 'Search'}
                              </span>
                           </div>
                           <h4 className="font-roboto font-medium text-gray-900 mb-3">
                              {interaction.type === 'search' && interaction.roomName
                                 ? interaction.roomName
                                 : interaction.buildingName || 'Unknown Location'}
                           </h4>
                           <div className="flex items-center gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                 <ClockIcon />
                                 <span>{formatTimestamp(interaction.timestamp)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                 <KioskIcon />
                                 <span>{interaction.kioskId}</span>
                              </div>
                           </div>
                        </div>
                        <div className="flex-shrink-0 ml-4">
                           <span className="text-sm font-medium text-gray-500">
                              #{((currentPage - 1) * itemsPerPage) + index + 1}
                           </span>
                        </div>
                     </div>
                  </div>
               ))
            )}
         </div>
         {totalPages > 1 && (
            <div className="flex justify-between items-center p-6 border-t border-gray-200">
               <div className="text-sm text-gray-600 font-roboto">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} interactions
               </div>
               <div className="flex gap-2">
                  <button
                     onClick={() => handlePageChange(currentPage - 1)}
                     disabled={currentPage === 1}
                     className="px-3 py-2 text-sm font-roboto border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                     Previous
                  </button>
                  <div className="flex gap-1">
                     {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                           pageNum = i + 1;
                        } else if (currentPage <= 3) {
                           pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                           pageNum = totalPages - 4 + i;
                        } else {
                           pageNum = currentPage - 2 + i;
                        }

                        return (
                           <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`px-3 py-2 text-sm font-roboto border rounded ${currentPage === pageNum
                                    ? 'bg-blue-500 text-white border-blue-500'
                                    : 'border-gray-300 hover:bg-gray-50'
                                 }`}
                           >
                              {pageNum}
                           </button>
                        );
                     })}
                  </div>

                  <button
                     onClick={() => handlePageChange(currentPage + 1)}
                     disabled={currentPage === totalPages}
                     className="px-3 py-2 text-sm font-roboto border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                     Next
                  </button>
               </div>
            </div>
         )}
      </div>
   );
};

export default InteractionsLog;
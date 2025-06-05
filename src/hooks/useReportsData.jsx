import { useRef, useState } from "react";
import { axiosPrivate } from "../api/api";
import { useCallback } from "react";
import { useEffect } from "react";

// Import the new chatbot API functions
import {
   fetchChatbotMetrics,
   fetchChatbotInteractionLogs,
   fetchPopularChatbotQueries,
   fetchKioskChatbotPerformance
} from "../api/api";

// Existing fetch functions (keep all your existing functions)
const fetchTotalScans = async (filters = {}) => {
   try {
      const params = new URLSearchParams();
      if (filters.kioskId) params.append('kioskId', filters.kioskId);
      if (filters.buildingId) params.append('buildingId', filters.buildingId);
      const response = await axiosPrivate.get(`/qrscan/reports/total?${params}`);
      return response.data;
   } catch (error) {
      console.error('Error fetching total scans:', error);
      throw error;
   }
};

const fetchBuildingKioskStats = async () => {
   try {
      const response = await axiosPrivate.get('/qrscan/stats/buildings');
      return response.data;
   } catch (error) {
      console.error('Error fetching building/kiosk stats:', error);
      throw error;
   }
};

const fetchDailyScanReport = async (filters = {}) => {
   try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.kioskId) params.append('kioskId', filters.kioskId);
      if (filters.buildingId) params.append('buildingId', filters.buildingId);
      const response = await axiosPrivate.get(`/qrscan/reports/daily?${params}`);
      return response.data;
   } catch (error) {
      console.error('Error fetching daily scan report:', error);
      throw error;
   }
};

const fetchFrequentDestinations = async (timeframe = 'month') => {
   try {
      const response = await axiosPrivate.get(`/destinationlog/frequent-destinations?timeframe=${timeframe}`);
      return response.data;
   } catch (error) {
      console.error('Error fetching frequent destinations:', error);
      throw error;
   }
};

const getDailySearchActivity = async () => {
   try {
      const response = await axiosPrivate.get(`/destinationlog/daily-search-activity`);
      return response.data;
   } catch (error) {
      console.error('Error fetching daily search activity:', error);
      throw error;
   }
};

export const useReportsData = (timeframe = 'month', filters = {}) => {
   const [data, setData] = useState({
      totalScans: 0,
      buildingStats: [],
      frequentDestinations: [],
      totalDestinationSearches: 0,
      dailyScans: [],
      dailySearches: [],
      // New chatbot data
      chatbot: {
         totalInteractions: 0,
         avgResponseTime: 0,
         dailyInteractions: [],
         commonQueries: [],
         actionBreakdown: [],
         locationDetectionStats: [],
         kioskActivity: [],
         popularQueries: [],
         kioskPerformance: []
      }
   });

   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);

   const fetchDashboardStats = useCallback(async () => {
      try {
         setLoading(true);
         setError(null);

         // Calculate date range for daily scans
         const endDate = new Date();
         const startDate = new Date();
         switch (timeframe) {
            case 'week':
               startDate.setDate(endDate.getDate() - 7);
               break;
            case 'month':
               startDate.setDate(endDate.getDate() - 30);
               break;
            case 'year':
               startDate.setFullYear(endDate.getFullYear() - 1);
               break;
            default:
               startDate.setDate(endDate.getDate() - 30);
         }

         const dailyFilters = {
            ...filters,
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
         };

         // Fetch all data including chatbot data
         const [
            totalScansData,
            buildingStatsData,
            frequentDestinationsData,
            dailyScanData,
            dailySearches,
            // New chatbot data fetches
            chatbotMetrics,
            popularQueries,
            kioskPerformance
         ] = await Promise.all([
            fetchTotalScans(filters),
            fetchBuildingKioskStats(),
            fetchFrequentDestinations(timeframe),
            fetchDailyScanReport(dailyFilters),
            getDailySearchActivity(),
            // Chatbot data
            fetchChatbotMetrics(timeframe, filters.kioskID),
            fetchPopularChatbotQueries(timeframe, filters.kioskID, 10),
            fetchKioskChatbotPerformance(timeframe)
         ]);

         setData({
            totalScans: totalScansData.data.totalScans,
            buildingStats: buildingStatsData.data,
            frequentDestinations: frequentDestinationsData.destinations,
            totalDestinationSearches: frequentDestinationsData.totalLogs,
            dailyScans: dailyScanData.data,
            dailySearches: dailySearches.data,
            // Set chatbot data
            chatbot: {
               totalInteractions: chatbotMetrics.data.totalInteractions,
               avgResponseTime: chatbotMetrics.data.avgResponseTime,
               dailyInteractions: chatbotMetrics.data.dailyInteractions,
               commonQueries: chatbotMetrics.data.commonQueries,
               actionBreakdown: chatbotMetrics.data.actionBreakdown,
               locationDetectionStats: chatbotMetrics.data.locationDetectionStats,
               kioskActivity: chatbotMetrics.data.kioskActivity,
               popularQueries: popularQueries.data.queries,
               kioskPerformance: kioskPerformance.data.performance
            }
         });

      } catch (err) {
         setError('Failed to load dashboard data. Please try again later.');
         console.error('Dashboard loading error:', err);
      } finally {
         setLoading(false);
      }
   }, [timeframe, filters]);

   useEffect(() => {
      fetchDashboardStats();
   }, [fetchDashboardStats]);

   const refetch = useCallback(() => {
      fetchDashboardStats();
   }, [fetchDashboardStats]);

   const exportData = useCallback(() => {
      try {
         const csvData = [
            ['Metric', 'Value'],
            ['Total QR Scans', data.totalScans],
            ['Total Searches', data.totalDestinationSearches],
            ['Total Chatbot Interactions', data.chatbot.totalInteractions],
            ['Average Response Time (ms)', data.chatbot.avgResponseTime.toFixed(2)],
            ['Most Active Building', data.buildingStats[0]?.buildingName || 'N/A'],
            [''],
            ['Building Statistics'],
            ['Building Name', 'Total Scans', 'Kiosk Count'],
            ...data.buildingStats.map(building => [
               building.buildingName,
               building.totalScans,
               building.kioskCount
            ]),
            [''],
            ['Popular Chatbot Queries'],
            ['Query', 'Count', 'Last Asked', 'Avg Response Time'],
            ...data.chatbot.popularQueries.map(query => [
               query.query,
               query.count,
               new Date(query.lastAsked).toLocaleDateString(),
               query.avgResponseTime.toFixed(2)
            ]),
            [''],
            ['Daily Scans'],
            ['Date', 'Scans'],
            ...data.dailyScans.map(day => [day.reportDate, day.totalScans]),
            [''],
            ['Daily Chatbot Interactions'],
            ['Date', 'Interactions', 'Avg Response Time'],
            ...data.chatbot.dailyInteractions.map(day => [
               day._id,
               day.count,
               day.avgResponseTime.toFixed(2)
            ])
         ];

         const csvContent = csvData.map(row => row.join(',')).join('\n');
         const blob = new Blob([csvContent], { type: 'text/csv' });
         const url = window.URL.createObjectURL(blob);
         const link = document.createElement('a');
         link.href = url;
         link.download = `reports_${new Date().toISOString().split('T')[0]}.csv`;
         document.body.appendChild(link);
         link.click();
         document.body.removeChild(link);
         window.URL.revokeObjectURL(url);
      } catch (error) {
         console.error('Error exporting data:', error);
         throw new Error('Failed to export data');
      }
   }, [data]);

   // Helper functions (keep existing ones and add new chatbot ones)
   const getMostActiveKiosk = useCallback(() => {
      if (!data.buildingStats || data.buildingStats.length === 0) {
         return { id: 'No Data', interactions: 0 };
      }
      let mostActiveKiosk = { id: 'No Data', interactions: 0 };
      data.buildingStats.forEach(building => {
         if (building.kiosks && building.kiosks.length > 0) {
            const topKiosk = building.kiosks.reduce((prev, current) =>
               (prev.totalScans > current.totalScans) ? prev : current
            );
            if (topKiosk.totalScans > mostActiveKiosk.interactions) {
               mostActiveKiosk = {
                  id: topKiosk.kioskId,
                  interactions: topKiosk.totalScans
               };
            }
         }
      });
      return mostActiveKiosk;
   }, [data.buildingStats]);

   const getMostActiveBuilding = useCallback(() => {
      if (!data.buildingStats || data.buildingStats.length === 0) {
         return { name: 'No Data', totalScans: 0 };
      }
      const topBuilding = data.buildingStats[0];
      return {
         name: topBuilding.buildingName || 'Unknown Building',
         totalScans: topBuilding.totalScans
      };
   }, [data.buildingStats]);

   // New chatbot helper functions
   const getMostActiveChatbotKiosk = useCallback(() => {
      if (!data.chatbot.kioskActivity || data.chatbot.kioskActivity.length === 0) {
         return { id: 'No Data', interactions: 0 };
      }
      const topKiosk = data.chatbot.kioskActivity[0];
      return {
         id: topKiosk._id,
         interactions: topKiosk.interactions
      };
   }, [data.chatbot.kioskActivity]);

   const getMostPopularQuery = useCallback(() => {
      if (!data.chatbot.popularQueries || data.chatbot.popularQueries.length === 0) {
         return { query: 'No Data', count: 0 };
      }
      const topQuery = data.chatbot.popularQueries[0];
      return {
         query: topQuery.query,
         count: topQuery.count
      };
   }, [data.chatbot.popularQueries]);

   return {
      data,
      loading,
      error,
      refetch,
      exportData,
      getMostActiveKiosk,
      getMostActiveBuilding,
      getMostActiveChatbotKiosk,
      getMostPopularQuery
   };
};
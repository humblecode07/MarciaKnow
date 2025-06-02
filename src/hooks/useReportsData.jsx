import { useState } from "react";
import { axiosPrivate } from "../api/api";
import { useCallback } from "react";
import { useEffect } from "react";

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
      console.error('Error fetching frequent destinations:', error);
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
      dailySearches: []
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

         const [
            totalScansData,
            buildingStatsData,
            frequentDestinationsData,
            dailyScanData,
            dailySearches
         ] = await Promise.all([
            fetchTotalScans(filters),
            fetchBuildingKioskStats(),
            fetchFrequentDestinations(timeframe),
            fetchDailyScanReport(dailyFilters),
            getDailySearchActivity()
         ]);

         setData({
            totalScans: totalScansData.data.totalScans,
            buildingStats: buildingStatsData.data,
            frequentDestinations: frequentDestinationsData.destinations,
            totalDestinationSearches: frequentDestinationsData.totalLogs,
            dailyScans: dailyScanData.data,
            dailySearches: dailySearches.data
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
            ['Daily Scans'],
            ['Date', 'Scans'],
            ...data.dailyScans.map(day => [day.reportDate, day.totalScans])
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

   // Helper functions
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

      const topBuilding = data.buildingStats[0]; // Already sorted by totalScans desc
      return {
         name: topBuilding.buildingName || 'Unknown Building',
         totalScans: topBuilding.totalScans
      };
   }, [data.buildingStats]);

   return {
      data,
      loading,
      error,
      refetch,
      exportData,
      getMostActiveKiosk,
      getMostActiveBuilding
   };
};
import axios from 'axios';

export const axiosPrivate = axios.create({
   baseURL: 'https://marciaknow-backend.vercel.app/',
   withCredentials: true,
});

export const fetchBuildings = async () => {
   try {
      const response = await axiosPrivate.get("/building");

      return response.data;
   }
   catch (error) {
      console.error('Error during fetching of data', error);
      throw error;
   }
};

export const fetchBuildingsFromSpecificKiosk = async (kioskID) => {
   try {
      const response = await axiosPrivate.get(`/building/get/${kioskID}`);

      return response.data;
   }
   catch (error) {
      console.error('Error during fetching of data', error);
      throw error;
   }
}

export const fetchBuilding = async (buildingID) => {
   try {
      const response = await axiosPrivate.get(`/building/${buildingID}`);

      return response.data;
   }
   catch (error) {
      console.error('Error during fetching of data', error);
      throw error;
   }
}

export const fetchKiosks = async () => {
   try {
      const response = await axiosPrivate.get("/kiosk");

      return response.data;
   }
   catch (error) {
      console.error('Error during fetching of data', error);
      throw error;
   }
}

export const fetchKiosk = async (kioskID) => {
   try {
      const response = await axiosPrivate.get(`kiosk/${kioskID}`);

      return response.data;
   }
   catch (error) {
      console.error('Error during fetching of data', error);
      throw error;
   }
}

export const createKiosk = async (data) => {
   try {
      const response = await axiosPrivate.post('/kiosk', data);
      console.log('Kiosk created successfully', response.data);
      return response.data;
   }
   catch (error) {
      console.log('Error creating kiosk:', error.response?.data || error.message);
   }
}

export const updateKiosk = async (data, kioskID) => {
   try {
      const response = await axiosPrivate.patch(`/kiosk/${kioskID}`, data);
      console.log('Kiosk updated successfully', response.data);
      return response.data;
   }
   catch (error) {
      console.log('Error creating kiosk:', error.response?.data || error.message);
   }
}


export const deleteKiosk = async (kioskID) => {
   try {
      const response = await axiosPrivate.delete(`kiosk/${kioskID}`);
      console.log('Kiosk deleted successfully', response.data);
      return response.data;
   }
   catch (error) {
      console.log('Error deleting kiosk:', error.response?.data || error.message);
   }
}

export const pingKiosk = async (kioskID) => {
   try {
      const response = await axiosPrivate.post(`kiosk/ping/${kioskID}`);
      console.log('Kiosk pinged successfully', response.data);
      return response.data;
   }
   catch (err) {
      console.error('Kiosk ping failed:', err.message);
   }
}

export const fetchNavigationIcons = async () => {
   try {
      const response = await axiosPrivate.get("/icon");

      return response.data;
   }
   catch (error) {
      console.error('Error during fetching of data', error);
      throw error;
   }
}

export const createRoom = async (data, buildingID, kioskID) => {
   try {
      const response = await axiosPrivate.post(`/room/${buildingID}/${kioskID}`, data);

      return response.data;
   }
   catch (error) {
      console.error('Error during fetching of data', error);
      throw error;
   }
}

export const editRoom = async (data, buildingID, kioskID, roomID) => {
   try {
      const response = await axiosPrivate.patch(`/room/${buildingID}/${kioskID}/${roomID}`, data);

      return response.data;
   }
   catch (error) {
      console.error('Error during fetching of data', error);
      throw error;
   }
}

export const fetchRoom = async (buildingID, roomID) => {
   try {
      const response = await axiosPrivate.get(`/room/${buildingID}/${roomID}`);

      return response.data;
   }
   catch (error) {
      console.error('Error during fetching of data', error);
      throw error;
   }
}

export const fetchRooms = async () => {
   try {
      const response = await axiosPrivate.get(`/room`);

      return response.data;
   }
   catch (error) {
      console.error('Error during fetching of data', error);
      throw error;
   }
}

export const fetchRoomsFromKiosk = async (kioskID) => {
   try {
      const response = await axiosPrivate.get(`/room/${kioskID}`);

      return response.data;
   }
   catch (error) {
      console.error('Error during fetching of data', error);
      throw error;
   }
}

export const deleteRoom = async (buildingID, roomID) => {
   try {
      const response = await axiosPrivate.delete(`/room/${buildingID}/${roomID}`);
      return response.data;
   }
   catch (error) {
      console.error('Error during fetching of data', error);
      throw error;
   }
}

export const editBuilding = async (data, buildingID, kioskID) => {
   try {
      const response = await axiosPrivate.patch(`/building/${buildingID}/${kioskID}`, data);
      return response.data;
   }
   catch (error) {
      console.error('Error during fetching of data', error);
      throw error;
   }
}

export const askGroq = async (message, kioskID) => {
   try {
      const response = await axiosPrivate.post(`/groq/ask/${kioskID}`, {
         question: message
      });
      return response.data;
   }
   catch (error) {
      console.error('Error during Groq API call', error);
      throw error;
   }
}

export const fetchAdmins = async () => {
   try {
      const response = await axiosPrivate.get('/admin');
      return response.data;
   }
   catch (error) {
      console.error('Error during fetching of data', error);
      throw error;
   }
}

export const fetchAdmin = async (adminID) => {
   try {
      const response = await axiosPrivate.get(`/admin/${adminID}`);
      return response.data;
   }
   catch (error) {
      console.error('Error during fetching of data', error);
      throw error;
   }
}

export const createAdmin = async (data) => {
   try {
      const response = await axiosPrivate.post('/admin/register', data);
      return response.data;
   }
   catch (error) {
      console.error('Error during fetching of data', error);
      throw error;
   }
}

export const updateAdmin = async (data, adminID) => {
   try {
      const response = await axiosPrivate.put(`/admin/${adminID}`, data);
      return response.data;
   }
   catch (error) {
      console.error('Error during fetching of data', error);
      throw error;
   }
}


export const updateAdminField = async (data, adminID) => {
   try {
      const response = await axiosPrivate.patch(`/admin/${adminID}/field`, data);
      return response.data;
   }
   catch (error) {
      console.error('Error during fetching of data', error);
      throw error;
   }
}


export const updateAdminPassword = async (data, adminID) => {
   try {
      const response = await axiosPrivate.patch(`/admin/${adminID}/password`, data);
      return response.data;
   }
   catch (error) {
      console.error('Error during fetching of data', error);
      throw error;
   }
}

export const updateAdminStatus = async (data, adminID) => {
   try {
      const response = await axiosPrivate.patch(`/${adminID}/status`, data);
      return response.data;
   }
   catch (error) {
      console.error('Error during fetching of data', error);
      throw error;
   }
}

export const disableAdmin = async (adminID) => {
   try {
      const response = await axiosPrivate.patch(`/admin/${adminID}/disable`);
      return response.data;
   }
   catch (error) {
      console.error('Error during fetching of data', error);
      throw error;
   }
}

export const enableAdmin = async (adminID) => {
   try {
      const response = await axiosPrivate.patch(`/admin/${adminID}/enable`);
      return response.data;
   }
   catch (error) {
      console.error('Error during fetching of data', error);
      throw error;
   }
}

export const resetAdminPassword = async (adminID) => {
   try {
      const response = await axiosPrivate.put(`/admin/${adminID}/reset-password`);
      return response.data;
   }
   catch (error) {
      console.error('Error during fetching of data', error);
      throw error;
   }
}

export const deleteAdminAccount = async (adminID) => {
   try {
      const response = await axiosPrivate.delete(`/admin/${adminID}/delete-admin`);
      return response.data;
   }
   catch (error) {
      console.error('Error during fetching of data', error);
      throw error;
   }
}


export const logQrCodeScan = async (buildingId, kioskId, buildingName = null) => {
   try {
      const response = await axiosPrivate.post(`/qrscan/${buildingId}/${kioskId}`, {
         buildingName: buildingName
      });

      return response.data;
   }
   catch (error) {
      console.error('Error logging QR scan:', error);
      throw error;
   }
};

// Fixed logDestinationSearch function
export const logDestinationSearch = async (buildingId, roomId, searchQuery, destinationType, kioskId) => {
   try {
      const response = await axiosPrivate.post('/destinationlog', {
         buildingId,
         roomId,
         searchQuery,
         destinationType, // 'building' or 'room'
         kioskId,
         timestamp: new Date().toISOString(),
      });

      return response.data;
   } catch (error) {
      console.error('Error logging destination search:', error);
      throw error;
   }
};

// Fixed getMostFrequentDestinations function
export const getMostFrequentDestinations = async (timeframe = 'month') => {
   try {
      const response = await axiosPrivate.get(`/destinationlog/frequent-destinations?timeframe=${timeframe}`);
      return response.data;
   } catch (error) {
      console.error('Error fetching frequent destinations:', error);
      throw error;
   }
};

export const fetchTotalScans = async (filters = {}) => {
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

export const fetchRecentScanLogs = async () => {
   try {
      const response = await axiosPrivate.get(`/qrscan/logs/recent`);
      return response.data;
   } catch (error) {
      console.error('Error fetching total scans:', error);
      throw error;
   }
};

export const fetchBuildingKioskStats = async () => {
   try {
      const response = await axiosPrivate.get('/qrscan/stats/buildings');
      return response.data;
   } catch (error) {
      console.error('Error fetching building/kiosk stats:', error);
      throw error;
   }
};

export const fetchDailyScanReport = async (filters = {}) => {
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

export const fetchRecentDestinationSearch = async () => {
   try {
      const response = await axiosPrivate.get(`/destinationlog/recent-destinations`);
      return response.data;
   } catch (error) {
      console.error('Error fetching frequent destinations:', error);
      throw error;
   }
};

export const fetchFrequentDestinations = async (timeframe = 'month') => {
   try {
      const response = await axiosPrivate.get(`/destinationlog/frequent-destinations?timeframe=${timeframe}`);
      return response.data;
   } catch (error) {
      console.error('Error fetching frequent destinations:', error);
      throw error;
   }
};

export const fetchDashboardStats = async () => {
   try {
      const [
         totalScansData,
         buildingStatsData,
         frequentDestinationsData
      ] = await Promise.all([
         fetchTotalScans(),
         fetchBuildingKioskStats(),
         fetchFrequentDestinations()
      ]);

      return {
         totalScans: totalScansData.data.totalScans,
         buildingStats: buildingStatsData.data,
         frequentDestinations: frequentDestinationsData.destinations,
         totalDestinationSearches: frequentDestinationsData.totalLogs
      };
   } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
   }
};

export const fetchChatbotMetrics = async (timeframe = 'month', kioskID = null) => {
   try {
      const params = new URLSearchParams();
      if (timeframe) params.append('timeframe', timeframe);
      if (kioskID) params.append('kioskID', kioskID);

      const response = await axiosPrivate.get(`/chatbot/metrics?${params}`);
      return response.data;
   } catch (error) {
      console.error('Error fetching chatbot metrics:', error);
      throw error;
   }
};

export const fetchChatbotInteractionLogs = async (filters = {}) => {
   try {
      const params = new URLSearchParams();
      if (filters.timeframe) params.append('timeframe', filters.timeframe);
      if (filters.kioskID) params.append('kioskID', filters.kioskID);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.action) params.append('action', filters.action);
      if (filters.sessionId) params.append('sessionId', filters.sessionId);

      const response = await axiosPrivate.get(`/chatbot/interaction-logs?${params}`);
      return response.data;
   } catch (error) {
      console.error('Error fetching chatbot interaction logs:', error);
      throw error;
   }
};

export const fetchPopularChatbotQueries = async (timeframe = 'month', kioskID = null, limit = 20) => {
   try {
      const params = new URLSearchParams();
      if (timeframe) params.append('timeframe', timeframe);
      if (kioskID) params.append('kioskID', kioskID);
      if (limit) params.append('limit', limit);

      const response = await axiosPrivate.get(`/chatbot/popular-queries?${params}`);
      return response.data;
   } catch (error) {
      console.error('Error fetching popular chatbot queries:', error);
      throw error;
   }
};

export const fetchKioskChatbotPerformance = async (timeframe = 'month') => {
   try {
      const params = new URLSearchParams();
      if (timeframe) params.append('timeframe', timeframe);

      const response = await axiosPrivate.get(`/chatbot/kiosk-performance?${params}`);
      return response.data;
   } catch (error) {
      console.error('Error fetching kiosk chatbot performance:', error);
      throw error;
   }
};

export const fetchChatbotSessionHistory = async (sessionId, limit = 100) => {
   try {
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit);

      const response = await axiosPrivate.get(`/chatbot/session/${sessionId}?${params}`);
      return response.data;
   } catch (error) {
      console.error('Error fetching chatbot session history:', error);
      throw error;
   }
};

// Log chatbot interaction (this should be called from your RightSidePanel)
export const logChatbotInteraction = async (interactionData) => {
   try {
      const response = await axiosPrivate.post('/chatbot/interactions', interactionData);
      return response.data;
   } catch (error) {
      console.error('Error logging chatbot interaction:', error);
      throw error;
   }
};
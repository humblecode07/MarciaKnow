import axios from 'axios';

export const axiosPrivate = axios.create({
   baseURL: 'http://localhost:3000',
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

export const deleteRoom = async (buildingID, kioskID, roomID) => {
   try {
      const response = await axiosPrivate.delete(`/room/${buildingID}/${kioskID}/${roomID}`);
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
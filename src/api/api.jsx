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
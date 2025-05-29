import { axiosPrivate } from "../api/api";
import useAuth from "./useAuth";

const useLogout = () => {
   const { setUser } = useAuth();

   console.log('amogus')

   const logout = async () => {
      try {
         await axiosPrivate.get('/logout');
         setUser({});
      } catch (err) {
         console.error('Error logging out:', err);
      }
   };

   return logout;
};

export default useLogout;
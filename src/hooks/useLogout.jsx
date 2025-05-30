import { useNavigate } from "react-router-dom";
import { axiosPrivate } from "../api/api";
import useAuth from "./useAuth";

const useLogout = () => {
   const navigate = useNavigate();
   const { setAdmin } = useAuth();

   console.log('amogus')

   const logout = async () => {
      try {
         await axiosPrivate.get('/logout');
         setAdmin({});
         navigate('/login');
      } catch (err) {
         console.error('Error logging out:', err);
      }
   };

   return logout;
};

export default useLogout;
import { Outlet, Navigate } from "react-router-dom";
import { useState, useEffect } from 'react';
import useRefreshToken from '../hooks/useRefreshToken';
import useAuth from '../hooks/useAuth';

const PersistLogin = () => {
   const [isLoading, setIsLoading] = useState(true);
   const refresh = useRefreshToken();
   const { admin } = useAuth();

   useEffect(() => {
      let isMounted = true;

      const verifyRefreshToken = async () => {
         try {
            if (!admin?.accessToken) {
               console.log('No access token found, attempting refresh...');
               await refresh();
            }
         } catch (err) {
            console.error('Failed to refresh token:', err);
         } finally {
            if (isMounted) {
               setIsLoading(false);
            }
         }
      };

      if (admin?.accessToken) {
         setIsLoading(false);
      } else {
         verifyRefreshToken();
      }

      return () => {
         isMounted = false;
      };
   }, []); 

   if (isLoading) {
      return (
         <div className="flex items-center justify-center min-h-screen">
            <p>Loading...</p>
         </div>
      );
   }

   if (!admin?.accessToken) {
      return <Navigate to="/login" replace />;
   }

   return <Outlet />;
}

export default PersistLogin;
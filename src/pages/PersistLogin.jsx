import { Outlet } from "react-router-dom";
import { useQuery } from '@tanstack/react-query';
import useRefreshToken from '../hooks/useRefreshToken';
import useAuth from '../hooks/useAuth';

const PersistLogin = () => {
   const refresh = useRefreshToken();
   const { admin } = useAuth();

   const { isLoading, isError } = useQuery({
      queryKey: ['refreshToken'], 
      queryFn: async () => await refresh(), 
      enabled: !admin?.accessToken, 
      retry: false, 
      refetchOnWindowFocus: false 
   });

   if (isLoading) {
      return <p>Loading...</p>;
   }

   if (isError) {
      return <p>Error refreshing token. Please login again.</p>;
   }

   return <Outlet />;
}

export default PersistLogin
import { createContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
   const [admin, setAdmin] = useState(() => {
      const savedJWT = localStorage.getItem("jwt");
      
      if (savedJWT) {
         try {
            const decodedToken = jwtDecode(savedJWT);
            return { ...decodedToken, accessToken: savedJWT };
         } 
         catch (error) {
            console.error('Invalid token', error);
            return null;
         }
      }
      
      return null;
   });

   useEffect(() => {
      if (admin?.accessToken) {
         localStorage.setItem("jwt", admin.accessToken);
      } 
      else {
         localStorage.removeItem("jwt");
      }
   }, [admin]);

   return (
      <AuthContext.Provider value={{ admin, setAdmin }}>
         {children}
      </AuthContext.Provider>
   );
}
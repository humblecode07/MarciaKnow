import { createBrowserRouter, RouterProvider } from "react-router-dom"
import Login from "./pages/Login"
import './App.css'
import Dashboard from "./pages/Dashboard"
import AdminLayout from "./pages/AdminLayout"
import MapEditor from "./pages/Kiosk/MapEditor"
import TestKiosk from "./pages/Kiosk/TestKiosk"
import KioskSettings from "./pages/Kiosk/KioskSettings"
import Reports from "./pages/Reports"
import Users from "./pages/Users"
import Profile from "./pages/Profile"
import CampusMap from "./components/TestKiosk/CampusMap"
import KioskDetails from "./pages/Kiosk/KioskSettings/KioskDetails"
import BuildingDetails from "./pages/Kiosk/MapEditor/BuildingDetails"
import RoomDetails from "./pages/Kiosk/MapEditor/RoomDetails"
import ScanGuide from "./pages/ScanGuide"
import ClientKiosk from "./pages/Kiosk/ClientKiosk"
import KioskHome from "./pages/Kiosk/KioskHome"
import { AuthProvider } from "./context/AuthContext"
import PersistLogin from "./pages/PersistLogin"
import RequireAuth from "./components/RequireAuth"

const superAdminRole = Number(import.meta.env.VITE_ROLE_SUPER_ADMIN);
const adminRole = Number(import.meta.env.VITE_ROLE_ADMIN);

const router = createBrowserRouter([
   {
      path: '/',
      element: <KioskHome />
   },
   {
      path: '/:kioskID',
      element: <ClientKiosk />
   },
   {
      path: '/login',
      element: <Login />
   },
   {
      path: 'qr-code/:buildingID/edit-room/:kioskID/:roomID',
      element: <ScanGuide />
   },
   {
      path: 'qr-code/:buildingID/edit-room/:kioskID',
      element: <ScanGuide />
   },
   {
      path: '*',
      element: <PersistLogin />,
      children: [
         {
            path: 'admin',
            element: (
               <RequireAuth allowedRoles={[adminRole, superAdminRole]} >
                  <AdminLayout />,
               </RequireAuth>
            ),
            children: [
               {
                  path: '',
                  element: <Dashboard />
               },
               {
                  path: 'test-kiosk',
                  element: <TestKiosk />
               },
               {
                  path: 'map-editor',
                  element: <MapEditor />
               },
               {
                  path: 'map-editor/:buildingID/edit-building/:kioskID',
                  element: <RoomDetails />
               },
               {
                  path: 'map-editor/:buildingID/add-room',
                  element: <RoomDetails />
               },
               {
                  path: 'map-editor/:buildingID/edit-room/:kioskID/:roomID',
                  element: <RoomDetails />
               },
               {
                  path: 'kiosk-settings',
                  element: <KioskSettings />
               },
               {
                  path: 'kiosk-settings/add-kiosk',
                  element: <KioskDetails />
               },
               {
                  path: 'kiosk-settings/edit-kiosk/:kioskID',
                  element: <KioskDetails />
               },
               {
                  path: 'reports',
                  element: <Reports />
               },
               {
                  path: 'users',
                  element: <Users />
               },
               {
                  path: 'profile',
                  element: <Profile />
               },
            ]
         }
      ]
   },
])

function App() {
   return (
      <AuthProvider >
         <RouterProvider router={router} />
      </AuthProvider>
   )
}

export default App

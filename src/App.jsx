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

const router = createBrowserRouter([
   {
      path: '/login',
      element: <Login />
   },
   {
      path: '/admin',
      element: <AdminLayout />,
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
            path: 'map-editor/:buildingID/edit-building/',
            element: <BuildingDetails />
         },
         {
            path: 'map-editor/:buildingID/add-room',
            element: <RoomDetails />
         },
         {
            path: 'map-editor/:buildingID/edit-room/:roomID',
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
   },
   {
      path: '/sample',
      element: <CampusMap />
   }
])

function App() {
   return (
      <RouterProvider router={router} />
   )
}

export default App

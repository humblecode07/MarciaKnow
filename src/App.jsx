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
            path: 'kiosk-settings',
            element: <KioskSettings />
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

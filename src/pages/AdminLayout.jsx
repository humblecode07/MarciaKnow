import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

const AdminLayout = () => {
  return (
    <div className='flex h-[calc(100vh-3.875rem)] overflow-auto'>
      <Sidebar />
      <Outlet />
    </div>
  )
}

export default AdminLayout

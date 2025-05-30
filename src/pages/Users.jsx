import React from 'react'
import AdminUserIcon from '../assets/Icons/AdminUserIcon'
import SearchIcon from '../assets/Icons/SearchIcon'
import { useQuery } from '@tanstack/react-query';
import { fetchAdmins } from '../api/api';
import DangoIcon from '../assets/Icons/DangoIcon';
import EmailIcon from '../assets/Icons/EmailIcon';
import Divider from '../components/Divider';
import CallIcon from '../assets/Icons/CallIcon';
import ClockIcon from '../assets/Icons/ClockIcon';
import CalendarIcon from '../assets/Icons/CalendarIcon';
import AdminViewIcon from '../assets/Icons/AdminViewIcon';

const Users = () => {
  const { data: adminsData, error: adminsError, isLoading: adminsLoading } = useQuery({
    queryKey: ['admins'],
    queryFn: fetchAdmins,
  });

  if (adminsLoading) return <div>Loading...</div>;

  if (adminsError) {
    console.error('Error fetching admins:', adminsError);
    return <div>Error loading admins data.</div>;
  }

  console.log(adminsData);

  return (
    <div className="w-[73.98dvw] flex flex-col gap-[1.5rem] ml-[19.5625rem] mt-[1.875rem]">
      <div className='w-full h-[2.875rem] flex justify-between'>
        <div className='flex items-center gap-[1.6875rem]'>
          <div className='flex flex-col gap-[0.1875rem]'>
            <span className='font-poppins text-[1.125rem] font-bold'>ADMIN MANAGEMENT</span>
            <p className='text-[#737373] text-[.875rem] font-roboto'>Manage your organization's administrators.</p>
          </div>
          <div className='px-[0.6875rem] py-[0.5325rem] flex gap-[0.6875rem] border-b-solid border-b-[1px] border-black items-center'>
            <SearchIcon />
            <input
              type="text"
              placeholder='Search...'
              className='w-[15.8125rem]  font-roboto text-[.875rem]'
            />
          </div>
        </div>
        <button className='flex gap-[0.625rem] items-center justify-center bg-[#D1D6FA] border-solid border-[1px] border-[#110D79] py-[0.28125rem] px-[1rem] cursor-pointer'>
          <AdminUserIcon />
          <span className='font-poppins font-bold text-[#110D79] text-[.75rem]'>Add New Admin</span>
        </button>
      </div>
      <div className='flex flex-col'>
        {adminsData.map((admin) => {
          return (
            <>
              <div key={admin._id} className='flex flex-col gap-[1.75rem] px-[1.5rem] py-[1.375rem] bg-[#FBFCF8] shadow-md'>
                <div className='flex justify-between items-center'>
                  <div className='flex gap-[.75rem]'>
                    <img
                      src={`http://localhost:3000/admin/${admin.profile}`}
                      alt=""
                      className='w-[3rem] h-[3rem] rounded-full object-cover'
                    />
                    <div className='flex flex-col gap-[0.1875rem]'>
                      <span className='font-roboto font-semibold'>{admin.full_name}</span>
                      <div className='flex gap-[0.8125rem] items-center'>
                        <div className='px-[0.46875rem] py-[.25rem] bg-[#F3E8FF] rounded-full flex'>
                          <span className='text-[#5B21B6] font-roboto font-medium text-[.75rem] items-center justify-center'>{admin.roles.includes(Number(import.meta.env.VITE_ROLE_SUPER_ADMIN)) ? 'Super Admin' : 'Admin'}</span>
                        </div>
                        <span className={`font-roboto text-[.75rem] ${admin.status === 'online' ? 'text-green-500' : 'text-red-500'}`}>
                          {admin.status === 'online' ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className=''>
                    <DangoIcon />
                  </div>
                </div>
                <div className='flex flex-col gap-[1rem]'>
                  <div className='flex gap-[0.5625rem] items-center'>
                    <EmailIcon />
                    <span className='font-roboto text-[.75rem] text-[#4B5563]'>{admin.email || 'N/A'}</span>
                  </div>
                  <div className='flex gap-[0.5625rem] items-center'>
                    <CallIcon />
                    <span className='font-roboto text-[.75rem] text-[#4B5563]'>{admin?.contact || 'N/A'}</span>
                  </div>
                  <Divider />
                  <div className='flex gap-[0.5625rem] items-center'>
                    <ClockIcon />
                    <span className='font-roboto text-[.75rem] text-[#4B5563]'><span className='font-bold'>Last Login: </span>{admin?.lastLogin || 'N/A'}</span>
                  </div>
                  <div className='flex gap-[0.5625rem] items-center'>
                    <CalendarIcon />
                    <span className='font-roboto text-[.75rem] text-[#4B5563]'><span className='font-bold'>Joined: </span> 2023-01-15</span>
                  </div>
                </div>
                <button className='flex items-center justify-center gap-[.5rem] border-solid border-[1px] border-black py-[.25rem] bg-[#FBF9F6]'>
                  <AdminViewIcon />
                  <span className='font-roboto text-[.875rem]'>View</span>
                </button>
              </div>
            </>
          )
        })}
      </div>
    </div>
  )
}

export default Users

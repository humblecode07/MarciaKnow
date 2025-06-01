import React, { useState, useMemo } from 'react'
import AdminUserIcon from '../assets/Icons/AdminUserIcon'
import SearchIcon from '../assets/Icons/SearchIcon'
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createAdmin, fetchAdmins } from '../api/api';
import DangoIcon from '../assets/Icons/DangoIcon';
import EmailIcon from '../assets/Icons/EmailIcon';
import Divider from '../components/Divider';
import CallIcon from '../assets/Icons/CallIcon';
import ClockIcon from '../assets/Icons/ClockIcon';
import CalendarIcon from '../assets/Icons/CalendarIcon';
import AdminViewIcon from '../assets/Icons/AdminViewIcon';
import LogoutIcon from '../assets/Icons/LogoutIcon';
import CreateAdminModal from '../modals/CreateAdminModal';
import { NavLink } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const Users = () => {
  const { admin } = useAuth();

  const queryClient = useQueryClient();
  const { data: adminsData, error: adminsError, isLoading: adminsLoading } = useQuery({
    queryKey: ['admins'],
    queryFn: fetchAdmins,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter admins based on search query
  const filteredAdmins = useMemo(() => {
    if (!adminsData || !searchQuery.trim()) {
      return adminsData || [];
    }

    const query = searchQuery.toLowerCase().trim();

    return adminsData.filter(admin => {
      const nameMatch = admin.full_name?.toLowerCase().includes(query);

      const emailMatch = admin.email?.toLowerCase().includes(query);

      const isSuperAdmin = admin.roles.includes(Number(import.meta.env.VITE_ROLE_SUPER_ADMIN));
      const roleText = isSuperAdmin ? 'super admin' : 'admin';
      const roleMatch = roleText.includes(query);

      const statusText = admin.status === 'online' ? 'active' : 'inactive';
      const statusMatch = statusText.includes(query);

      const contactMatch = admin.contact?.toLowerCase().includes(query);

      return nameMatch || emailMatch || roleMatch || statusMatch || contactMatch;
    });
  }, [adminsData, searchQuery]);

  const handleAddAdmin = async (formData) => {
    try {
      const response = await createAdmin(formData);
      console.log(response);
      queryClient.invalidateQueries(['admins']);
    } catch (error) {
      console.error('Failed to add new admin:', error.message);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchClear = () => {
    setSearchQuery('');
  };

  if (adminsLoading) return <div>Loading...</div>;

  if (adminsError) {
    console.error('Error fetching admins:', adminsError);
    return <div>Error loading admins data.</div>;
  }

  console.log(admin);
  console.log(adminsData);

  return (
    <div className="w-[73.98dvw] flex flex-col gap-[1.5rem] ml-[19.5625rem] mt-[1.875rem]">
      <div className='w-full h-[2.875rem] flex justify-between'>
        <div className='flex items-center gap-[1.6875rem]'>
          <div className='flex flex-col gap-[0.1875rem]'>
            <span className='font-poppins text-[1.125rem] font-bold'>ADMIN MANAGEMENT</span>
            <p className='text-[#737373] text-[.875rem] font-roboto'>Manage your organization's administrators.</p>
          </div>
          <div className='px-[0.6875rem] py-[0.5325rem] flex gap-[0.6875rem] border-b-solid border-b-[1px] border-black items-center relative'>
            <SearchIcon />
            <input
              type="text"
              placeholder='Search by name, email, role, or status...'
              className='w-[15.8125rem] font-roboto text-[.875rem] outline-none'
              value={searchQuery}
              onChange={handleSearchChange}
            />
            {searchQuery && (
              <button
                onClick={handleSearchClear}
                className='absolute right-2 text-gray-400 hover:text-gray-600 text-sm'
              >
                ✕
              </button>
            )}
          </div>
        </div>
        <button onClick={() => setIsModalOpen(true)} className='flex gap-[0.625rem] items-center justify-center bg-[#D1D6FA] border-solid border-[1px] border-[#110D79] py-[0.28125rem] px-[1rem] cursor-pointer'>
          <AdminUserIcon />
          <span className='font-poppins font-bold text-[#110D79] text-[.75rem]'>Add New Admin</span>
        </button>
      </div>

      {/* Search Results Info */}
      {searchQuery && (
        <div className='text-sm text-gray-600 font-roboto'>
          {filteredAdmins.length === 0
            ? `No admins found for "${searchQuery}"`
            : `Found ${filteredAdmins.length} admin${filteredAdmins.length === 1 ? '' : 's'} matching "${searchQuery}"`
          }
        </div>
      )}

      <div className='flex flex-col gap-[1rem]'>
        {filteredAdmins.length === 0 && searchQuery ? (
          <div className='text-center py-8 text-gray-500'>
            <p>No administrators match your search criteria.</p>
            <p className='text-sm mt-2'>Try searching for a different term or clear the search to see all admins.</p>
          </div>
        ) : (
          filteredAdmins.map((adminData) => {
            return (
              <div key={adminData._id} className='flex flex-col gap-[1.75rem] px-[1.5rem] py-[1.375rem] bg-[#FBFCF8] shadow-md'>
                <div className='flex justify-between items-center'>
                  <div className='flex gap-[.75rem]'>
                    <img
                      src={adminData.profile ? `http://localhost:3000/admin/profile/${adminData.profile}` : '/default-avatar.png'}
                      alt=""
                      className='w-[3rem] h-[3rem] rounded-full object-cover'
                      onError={(e) => {
                        e.target.src = '/default-avatar.png';
                      }}
                    />
                    <div className='flex flex-col gap-[0.1875rem]'>
                      <span className='font-roboto font-semibold'>{adminData.full_name}</span>
                      <div className='flex gap-[0.8125rem] items-center'>
                        <div className={`px-[0.46875rem] py-[.25rem] ${adminData.roles.includes(Number(import.meta.env.VITE_ROLE_SUPER_ADMIN)) ? 'bg-[#F3E8FF]' : 'bg-[#D1D6FA]'} rounded-full flex`}>
                          <span className={`${adminData.roles.includes(Number(import.meta.env.VITE_ROLE_SUPER_ADMIN)) ? 'text-[#5B21B6]' : 'text-[#110D79]'} font-roboto font-medium text-[.75rem] items-center justify-center`}>{adminData.roles.includes(Number(import.meta.env.VITE_ROLE_SUPER_ADMIN)) ? 'Super Admin' : 'Admin'}</span>
                        </div>
                        <span className={`font-roboto text-[.75rem] ${adminData.status === 'online' ? 'text-green-500' : 'text-red-500'}`}>
                          {adminData.status === 'online' ? 'ONLINE' : 'OFFLINE'}
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
                    <span className='font-roboto text-[.75rem] text-[#4B5563]'>{adminData.email || 'N/A'}</span>
                  </div>
                  <div className='flex gap-[0.5625rem] items-center'>
                    <CallIcon />
                    <span className='font-roboto text-[.75rem] text-[#4B5563]'>{adminData?.contact || 'N/A'}</span>
                  </div>
                  <Divider />
                  <div className='flex gap-[0.5625rem] items-center'>
                    <ClockIcon />
                    <span className='font-roboto text-[.75rem] text-[#4B5563]'><span className='font-bold'>Last Login: </span>{adminData?.lastLogin || 'N/A'}</span>
                  </div>
                  <div className='flex gap-[0.5625rem] items-center'>
                    <CalendarIcon />
                    <span className='font-roboto text-[.75rem] text-[#4B5563]'><span className='font-bold'>Joined: </span>{adminData.joined ? new Date(adminData.joined).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
                {adminData.roles.includes(Number(import.meta.env.VITE_ROLE_SUPER_ADMIN)) ?
                  <NavLink to={`/admin/${adminData._id}`} className='flex items-center justify-center gap-[.5rem] border-solid border-[1px] border-black py-[.25rem] bg-[#FBF9F6]'>
                    <AdminViewIcon />
                    <span className='font-roboto text-[.875rem]'>View</span>
                  </NavLink> :
                  <div className='flex gap-[1.1875rem]'>
                    <NavLink to={`/admin/${adminData._id}`} className='w-full flex items-center justify-center gap-[.5rem] border-solid border-[1px] border-black py-[.25rem] bg-[#FBF9F6]'>
                      <AdminViewIcon />
                      <span className='font-roboto text-[.875rem]'>View</span>
                    </NavLink>
                    <button className='w-full flex items-center justify-center gap-[.5rem] border-solid border-[1px] border-[#AF1E1E] py-[.25rem] bg-[#FAD1D1]'>
                      <LogoutIcon color={`AF1E1E`} />
                      <span className='font-roboto text-[.875rem] text-[#AF1E1E]'>Disable</span>
                    </button>
                  </div>
                }
              </div>
            )
          })
        )}
      </div>
      <CreateAdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddAdmin}
      />
    </div>
  )
}

export default Users
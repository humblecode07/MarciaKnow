import { useState } from 'react';
import Divider from '../components/Divider';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { fetchAdmin, updateAdminField, updateAdminPassword } from '../api/api';
import { EmailModal, PasswordModal, UsernameModal } from '../modals/SettingsModal';

const Settings = () => {
   const { adminID } = useParams();
   const queryClient = useQueryClient();

   const { data: adminData, error, isLoading } = useQuery({
      queryKey: ['adminSetting', adminID], // ✅ more specific cache key
      queryFn: () => fetchAdmin(adminID),
   });

   const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
   const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
   const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false);

   const handleUploadField = async (field, value) => {
      try {
         let response = null;
         if (field === 'email' || field === 'username') {
            response = await updateAdminField({ field, value }, adminID);

         }
         else {
            console.log('a')
            response = await updateAdminPassword({ currentPassword: field, newPassword: value }, adminID);
         }

         console.log(response);
         queryClient.invalidateQueries(['adminSetting', adminID]);
      } catch (error) {
         console.log(error);
      }
   };

   if (isLoading) return <p>Loading...</p>;
   if (error) return <p>Error: {error.message}</p>;

   return (
      <div className="w-[73.98dvw] flex flex-col gap-[1.1875rem] ml-[19.5625rem] mt-[1.875rem]">
         <span className='font-poppins text-[1.25rem] font-bold'>Account Settings</span>

         {/* Account Preferences */}
         <div className='flex flex-col gap-[0.5625rem]'>
            <span className='font-roboto font-bold text-[#4B5563] text-[.75rem]'>ACCOUNT PREFERENCES</span>
            <Divider />
         </div>

         <div className='flex flex-col gap-[1rem]'>
            {/* Email Address */}
            <div className='flex justify-between font-roboto'>
               <div className='flex flex-col'>
                  <span className='font-bold'>Email Address</span>
                  <span className='text-[.875rem]'>{adminData?.email || 'N/A'}</span>
               </div>
               <button
                  className='border-solid border-[1px] border-[#110D79] bg-[#D1D6FA] flex items-center justify-center rounded-full text-[#110D79] text-[.875rem] py-[0.6875rem] px-[1.125rem] cursor-pointer hover:bg-[#C1C9F9] transition-colors'
                  onClick={() => setIsEmailModalOpen(true)}
               >
                  <span>CHANGE</span>
               </button>
            </div>

            {/* Password */}
            <div className='flex justify-between font-roboto'>
               <div className='flex flex-col'>
                  <span className='font-bold'>Change Password</span>
                  <span className='text-[.875rem]'>Password must be at least 8 characters long</span>
               </div>
               <button
                  className='border-solid border-[1px] border-[#110D79] bg-[#D1D6FA] flex items-center justify-center rounded-full text-[#110D79] text-[.875rem] py-[0.6875rem] px-[1.125rem] cursor-pointer hover:bg-[#C1C9F9] transition-colors'
                  onClick={() => setIsPasswordModalOpen(true)}
               >
                  <span>CHANGE</span>
               </button>
            </div>
         </div>

         {/* Customized Profile */}
         <span className='font-poppins text-[1.25rem] font-bold'>Customized Profile</span>

         <div className='flex flex-col gap-[0.5625rem]'>
            <span className='font-roboto font-bold text-[#4B5563] text-[.75rem]'>PROFILE INFORMATION</span>
            <Divider />
         </div>

         <div className='flex flex-col gap-[1rem]'>
            <div className='flex justify-between font-roboto'>
               <div className='flex flex-col'>
                  <span className='font-bold'>Username</span>
                  <span className='text-[.875rem]'>{adminData?.username || '?'}</span>
               </div>
               <button
                  className='border-solid border-[1px] border-[#110D79] bg-[#D1D6FA] flex items-center justify-center rounded-full text-[#110D79] text-[.875rem] py-[0.6875rem] px-[1.125rem] cursor-pointer hover:bg-[#C1C9F9] transition-colors'
                  onClick={() => setIsUsernameModalOpen(true)}
               >
                  <span>CHANGE</span>
               </button>
            </div>
            <div className='flex flex-col gap-[0.5625rem] font-roboto'>
               <div className='flex flex-col'>
                  <span className='font-bold'>About me</span>
                  <span className='text-[.875rem]'>A brief description of yourself shown on your profile.</span>
               </div>
               <textarea
                  className='border-solid border-[1px] border-black py-[.75rem] px-[1.125rem] text-[.875rem] rounded focus:outline-none focus:ring-2 focus:ring-[#110D79]'
                  placeholder='Describe yourself...'
                  rows={4}
                  defaultValue={adminData?.about || ''}
               />
               <button
                  className='w-fit border-solid border-[1px] border-[#110D79] bg-[#D1D6FA] flex items-center justify-center rounded-full text-[#110D79] text-[.875rem] py-[0.6875rem] px-[1.125rem] cursor-pointer hover:bg-[#C1C9F9] transition-colors'
                  onClick={() => alert('TODO: Save "About Me" field')}
               >
                  <span>CHANGE</span>
               </button>
            </div>
         </div>

         {/* Profile Image */}
         <div className='flex flex-col gap-[0.5625rem]'>
            <span className='font-roboto font-bold text-[#4B5563] text-[.75rem]'>IMAGE</span>
            <Divider />
         </div>

         <div className='flex flex-col gap-[0.5625rem] font-roboto'>
            <div className='flex flex-col'>
               <span className='font-bold'>Profile image</span>
               <span className='text-[.875rem]'>Images must be .png or .jpg format</span>
            </div>
            <img
               src={adminData?.profile
                  ? `http://localhost:3000/admin/profile/${adminData.profile}`
                  : '/default-profile.jpg'}
               className='w-[7.375rem] h-[7.375rem] rounded-full border-solid border-black border-1'
               alt="Profile"
            />
            <button
               className='w-fit border-solid border-[1px] border-[#110D79] bg-[#D1D6FA] flex items-center justify-center rounded-full text-[#110D79] text-[.875rem] py-[0.6875rem] px-[1.125rem] cursor-pointer hover:bg-[#C1C9F9] transition-colors'
               onClick={() => alert('TODO: Implement profile image change modal')}
            >
               <span>CHANGE</span>
            </button>
         </div>

         {/* Modals */}
         <EmailModal
            isOpen={isEmailModalOpen}
            onClose={() => setIsEmailModalOpen(false)}
            onSave={handleUploadField}
            currentEmail={adminData?.email}
         />
         <PasswordModal
            isOpen={isPasswordModalOpen}
            onClose={() => setIsPasswordModalOpen(false)}
            onSave={handleUploadField}
         />
         <UsernameModal
            isOpen={isUsernameModalOpen}
            onClose={() => setIsUsernameModalOpen(false)}
            onSave={handleUploadField}
            currentUser={adminData?.username}
         />
      </div>
   );
};

export default Settings;

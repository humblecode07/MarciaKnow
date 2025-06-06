import { useState } from 'react';
import Divider from '../components/Divider';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { fetchAdmin, updateAdmin, updateAdminField, updateAdminPassword, pingAdmin } from '../api/api';
import { EmailModal, PasswordModal, ProfileImageModal, UsernameModal, UploadStatusModal, ContactModal } from '../modals/SettingsModal';
import { useEffect } from 'react';

const Settings = () => {
   const { adminID } = useParams();
   const queryClient = useQueryClient();

   const { data: adminData, error, isLoading } = useQuery({
      queryKey: ['adminSetting', adminID],
      queryFn: () => fetchAdmin(adminID),
   });

   const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
   const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
   const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false);
   const [isContactModalOpen, setIsContactModalOpen] = useState(false);
   const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

   const [statusModal, setStatusModal] = useState({
      isOpen: false,
      status: 'success', // 'success', 'error', 'loading'
      title: '',
      message: ''
   });

   const [description, setDescription] = useState(adminData?.description || '');
   const [inputError, setInputError] = useState('');

   const showStatusModal = (status, title = '', message = '') => {
      setStatusModal({
         isOpen: true,
         status,
         title,
         message
      });
   };

   const closeStatusModal = () => {
      setStatusModal(prev => ({ ...prev, isOpen: false }));
   };

   const handleProfileSave = async (formData) => {
      try {
         showStatusModal('loading', 'Uploading...', 'Please wait while we upload your profile image.');

         const response = await updateAdmin(formData, adminID);
         console.log('Profile image updated:', response);

         queryClient.invalidateQueries(['adminSetting', adminID]);

         showStatusModal('success', 'Profile Updated!', 'Your profile image has been updated successfully.');

      } catch (error) {
         console.error('Error updating profile image:', error);
         showStatusModal(
            'error',
            'Upload Failed',
            error?.response?.data?.message || 'Failed to update profile image. Please try again.'
         );
      }
   };

   const handleUploadField = async (field, value) => {
      try {
         let response = null;

         if (field !== 'description') {
            showStatusModal('loading', 'Updating...', 'Please wait while we update your information.');
         }

         if (field === 'email' || field === 'username' || field === 'description' || field === 'contact') {
            response = await updateAdminField({ field, value }, adminID);

            if (field === 'description') {
               showStatusModal('success', 'Description Updated!', 'Your profile description has been saved.');
            } else {
               showStatusModal('success', 'Profile Updated!', `Your ${field} has been updated successfully.`);
            }
         }
         else {
            response = await updateAdminPassword({ currentPassword: field, newPassword: value }, adminID);
            showStatusModal('success', 'Password Changed!', 'Your password has been updated successfully.');
         }

         console.log(response);
         queryClient.invalidateQueries(['adminSetting', adminID]);

      } catch (error) {
         console.log(error);

         const errorMessage = error?.response?.data?.message || 'An error occurred. Please try again.';
         showStatusModal('error', 'Update Failed', errorMessage);
      }
   };

   useEffect(() => {
      if (adminData?.description !== undefined) {
         setDescription(adminData.description || '');
      }
   }, [adminData]);

   useEffect(() => {
      const interval = setInterval(() => {
         pingAdmin();
      }, 30000);

      pingAdmin();

      return () => clearInterval(interval);
   }, []);

   if (isLoading) return <p>Loading...</p>;
   if (error) return <p>Error: {error.message}</p>;

   return (
      <div className="w-[73.98dvw] flex flex-col gap-[1.1875rem] ml-[19.5625rem] mt-[1.875rem]">
         <span className='font-poppins text-[1.25rem] font-bold'>Account Settings</span>
         <div className='flex flex-col gap-[0.5625rem]'>
            <span className='font-roboto font-bold text-[#4B5563] text-[.75rem]'>ACCOUNT PREFERENCES</span>
            <Divider />
         </div>
         <div className='flex flex-col gap-[1rem]'>
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
            <div className='flex justify-between font-roboto'>
               <div className='flex flex-col'>
                  <span className='font-bold'>Contact</span>
                  <span className='text-[.875rem]'>{adminData?.contact || '?'}</span>
               </div>
               <button
                  className='border-solid border-[1px] border-[#110D79] bg-[#D1D6FA] flex items-center justify-center rounded-full text-[#110D79] text-[.875rem] py-[0.6875rem] px-[1.125rem] cursor-pointer hover:bg-[#C1C9F9] transition-colors'
                  onClick={() => setIsContactModalOpen(true)}
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
                  value={description}
                  onChange={(e) => {
                     setDescription(e.target.value);
                     setInputError('');
                  }}
               />
               {inputError && (
                  <span className='text-red-500 text-sm'>{inputError}</span>
               )}
               <button
                  className='w-fit border-solid border-[1px] border-[#110D79] bg-[#D1D6FA] flex items-center justify-center rounded-full text-[#110D79] text-[.875rem] py-[0.6875rem] px-[1.5rem] cursor-pointer hover:bg-[#C1C9F9] transition-colors'
                  onClick={() => handleUploadField('description', description)}
               >
                  <span>SAVE</span>
               </button>
            </div>
         </div>
         <div className='flex flex-col gap-[0.5625rem]'>
            <span className='font-roboto font-bold text-[#4B5563] text-[.75rem]'>IMAGE</span>
            <Divider />
         </div>
         <div className='flex flex-col gap-[0.5625rem] font-roboto'>
            <div className='flex justify-between items-start'>
               <div className='flex flex-col'>
                  <span className='font-bold'>Profile image</span>
                  <span className='text-[.875rem]'>Images must be .png or .jpg format</span>
               </div>
               <button
                  className='border-solid border-[1px] border-[#110D79] bg-[#D1D6FA] flex items-center justify-center rounded-full text-[#110D79] text-[.875rem] py-[0.6875rem] px-[1.125rem] cursor-pointer hover:bg-[#C1C9F9] transition-colors'
                  onClick={() => setIsProfileModalOpen(true)}
               >
                  <span>CHANGE</span>
               </button>
            </div>
            <img
               src={adminData?.profile
                  ? `${import.meta.env.VITE_BASE_URL}/admin/profile/${adminData.profile}`
                  : '/default-profile.jpg'}
               className='w-[7.375rem] h-[7.375rem] rounded-full border-solid border-black border-1 object-cover'
               alt="Profile"
               onError={(e) => {
                  e.target.src = '/default-profile.jpg';
               }}
            />
         </div>
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
         <ContactModal
            isOpen={isContactModalOpen}
            onClose={() => setIsContactModalOpen(false)}
            onSave={handleUploadField}
            currentUser={adminData?.contact}
         />
         <ProfileImageModal
            isOpen={isProfileModalOpen}
            onClose={() => setIsProfileModalOpen(false)}
            onSave={handleProfileSave}
            currentProfileImage={adminData?.profile
               ? `${import.meta.env.VITE_BASE_URL}/admin/profile/${adminData.profile}`
               : null}
         />
         <UploadStatusModal
            isOpen={statusModal.isOpen}
            onClose={closeStatusModal}
            status={statusModal.status}
            title={statusModal.title}
            message={statusModal.message}
         />
      </div>
   );
};

export default Settings;
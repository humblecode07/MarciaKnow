import React, { useState } from 'react'

export const EmailModal = ({ isOpen, onClose, onSave, currentEmail }) => {
   const [email, setEmail] = useState(currentEmail || '');
   const [error, setError] = useState('');

   const handleSubmit = (e) => {
      e.preventDefault();

      if (!email.endsWith('@dyci.edu.ph')) {
         setError('Email must end with @dyci.edu.ph');
         return;
      }

      onSave('email', email);
      onClose();
   };

   const handleBackdropClick = (e) => {
      if (e.target === e.currentTarget) {
         onClose();
      }
   };

   if (!isOpen) return null;

   return (
      <div
         className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center font-roboto'
         onClick={handleBackdropClick}
      >
         <div className='bg-white border-solid border-1 shadow-lg p-[2rem] w-[31.25rem] max-w-[90vw]'>
            <form onSubmit={handleSubmit} className='flex flex-col gap-[0.625rem]'>
               <div className='flex flex-col gap-[0.5rem]'>
                  <h2 className='text-xl font-bold'>Change school email address</h2>
                  <span className='text-[.75rem] text-[#4B5563]'>
                     Email must end with @dyci.edu.ph
                  </span>
               </div>

               <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                     setEmail(e.target.value);
                     setError(''); // Clear error when typing
                  }}
                  className='border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#110D79]'
                  placeholder="Enter your new email address"
                  required
               />

               {error && (
                  <span className='text-red-500 text-sm'>{error}</span>
               )}

               <div className='flex gap-[0.5rem] justify-end mt-4'>
                  <button
                     type="button"
                     onClick={onClose}
                     className='px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors'
                  >
                     Cancel
                  </button>
                  <button
                     type="submit"
                     className='border-solid border-[1px] border-[#110D79] bg-[#D1D6FA] flex items-center justify-center rounded-full text-[#110D79] text-[.875rem] py-[0.6875rem] px-[1.125rem] cursor-pointer hover:bg-[#C1C9F9] transition-colors'
                  >
                     <span>CHANGE</span>
                  </button>
               </div>
            </form>
         </div>
      </div>
   )
}

export const PasswordModal = ({ isOpen, onClose, onSave }) => {
   const [currentPassword, setCurrentPassword] = useState('');
   const [newPassword, setNewPassword] = useState('');
   const [error, setError] = useState('');

   const handleSubmit = (e) => {
      e.preventDefault();

      if (!newPassword || newPassword.length < 8) {
         setError('New password must be at least 8 characters long');
         return;
      }

      if (!currentPassword) {
         setError('Please enter your current password');
         return;
      }

      onSave(currentPassword, newPassword);
      onClose();
   };

   const handleBackdropClick = (e) => {
      if (e.target === e.currentTarget) {
         onClose();
      }
   };

   if (!isOpen) return null;

   return (
      <div
         className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center font-roboto'
         onClick={handleBackdropClick}
      >
         <div className='bg-white border-solid border-1 shadow-lg p-[2rem] w-[31.25rem] max-w-[90vw]'>
            <form onSubmit={handleSubmit} className='flex flex-col gap-[0.625rem]'>
               <div className='flex flex-col gap-[0.5rem]'>
                  <h2 className='text-xl font-bold'>Change Password</h2>
                  <span className='text-[.75rem] text-[#4B5563]'>
                     Your new password must be at least 8 characters long.
                  </span>
               </div>

               <input
                  type='password'
                  value={currentPassword}
                  onChange={(e) => {
                     setCurrentPassword(e.target.value);
                     setError('');
                  }}
                  className='border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#110D79]'
                  placeholder='Enter current password'
                  required
               />

               <input
                  type='password'
                  value={newPassword}
                  onChange={(e) => {
                     setNewPassword(e.target.value);
                     setError('');
                  }}
                  className='border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#110D79]'
                  placeholder='Enter new password'
                  required
               />

               {error && (
                  <span className='text-red-500 text-sm'>{error}</span>
               )}

               <div className='flex gap-[0.5rem] justify-end mt-4'>
                  <button
                     type='button'
                     onClick={onClose}
                     className='px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors'
                  >
                     Cancel
                  </button>
                  <button
                     type='submit'
                     className='border-solid border-[1px] border-[#110D79] bg-[#D1D6FA] flex items-center justify-center rounded-full text-[#110D79] text-[.875rem] py-[0.6875rem] px-[1.125rem] cursor-pointer hover:bg-[#C1C9F9] transition-colors'
                  >
                     <span>CHANGE</span>
                  </button>
               </div>
            </form>
         </div>
      </div>
   );
};

export const UsernameModal = ({ isOpen, onClose, onSave, currentUser }) => {
   const [user, setUser] = useState(currentUser || '');
   const [error, setError] = useState('');

   const handleSubmit = (e) => {
      e.preventDefault();

      onSave('username', user);
      onClose();
   };

   const handleBackdropClick = (e) => {
      if (e.target === e.currentTarget) {
         onClose();
      }
   };

   if (!isOpen) return null;

   return (
      <div
         className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center font-roboto'
         onClick={handleBackdropClick}
      >
         <div className='bg-white border-solid border-1 shadow-lg p-[2rem] w-[31.25rem] max-w-[90vw]'>
            <form onSubmit={handleSubmit} className='flex flex-col gap-[0.625rem]'>
               <div className='flex flex-col gap-[0.5rem]'>
                  <h2 className='text-xl font-bold'>Change username</h2>
                  <span className='text-[.75rem] text-[#4B5563]'>
                     Username must start with @
                  </span>
               </div>
               <input
                  type="text"
                  value={user}
                  onChange={(e) => {
                     setUser(e.target.value);
                     setError(''); 
                  }}
                  className='border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#110D79]'
                  placeholder="Enter your new username"
                  required
               />

               {error && (
                  <span className='text-red-500 text-sm'>{error}</span>
               )}

               <div className='flex gap-[0.5rem] justify-end mt-4'>
                  <button
                     type="button"
                     onClick={onClose}
                     className='px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors'
                  >
                     Cancel
                  </button>
                  <button
                     type="submit"
                     className='border-solid border-[1px] border-[#110D79] bg-[#D1D6FA] flex items-center justify-center rounded-full text-[#110D79] text-[.875rem] py-[0.6875rem] px-[1.125rem] cursor-pointer hover:bg-[#C1C9F9] transition-colors'
                  >
                     <span>CHANGE</span>
                  </button>
               </div>
            </form>
         </div>
      </div>
   )
}
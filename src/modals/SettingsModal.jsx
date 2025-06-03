import React, { useState } from 'react'
import { useEffect } from 'react';
import { useRef } from 'react';

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

export const ContactModal = ({ isOpen, onClose, onSave, currentContact }) => {
   const [contact, setContact] = useState(currentContact || '');
   const [error, setError] = useState('');

   const handleSubmit = (e) => {
      e.preventDefault();

      const isValidPHNumber = /^09\d{9}$/.test(contact);

      if (!isValidPHNumber) {
         setError('Please enter a valid Philippine mobile number (e.g., 09XXXXXXXXX)');
         return;
      }

      onSave('contact', contact);
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
                  <h2 className='text-xl font-bold'>Change contact number</h2>
                  <span className='text-[.75rem] text-[#4B5563]'>
                     Only Philippine numbers are supported
                  </span>
               </div>

               <input
                  type="text"
                  value={contact}
                  onChange={(e) => {
                     setContact(e.target.value);
                     setError(''); // Clear error when typing
                  }}
                  className='border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#110D79]'
                  placeholder="Enter your new contact"
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

export const ProfileImageModal = ({ isOpen, onClose, onSave, currentProfileImage }) => {
   const [selectedFile, setSelectedFile] = useState(null);
   const [previewUrl, setPreviewUrl] = useState(currentProfileImage || null);
   const [error, setError] = useState('');
   const [isUploading, setIsUploading] = useState(false);
   const fileInputRef = useRef(null);

   const handleFileSelect = (e) => {
      const file = e.target.files[0];

      if (!file) {
         setSelectedFile(null);
         setPreviewUrl(currentProfileImage || null);
         setError('');
         return;
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
         setError('Only JPEG and PNG files are allowed');
         setSelectedFile(null);
         setPreviewUrl(currentProfileImage || null);
         return;
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
         setError('File size must be less than 5MB');
         setSelectedFile(null);
         setPreviewUrl(currentProfileImage || null);
         return;
      }

      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
         const { width, height } = img;
         const minDimension = 100;
         const maxDimension = 2048;

         if (width < minDimension || height < minDimension || width > maxDimension || height > maxDimension) {
            setError(`Image dimensions must be between ${minDimension}x${minDimension} and ${maxDimension}x${maxDimension} pixels`);
            setSelectedFile(null);
            setPreviewUrl(currentProfileImage || null);
            setPreviewUrl(objectUrl);
            setError('');
            return;
         }

         setSelectedFile(file);
         setPreviewUrl(objectUrl);
         setError('');
         setPreviewUrl(objectUrl);
         setError('');
      };

      img.onerror = () => {
         setError('Invalid image file');
         setSelectedFile(null);
         setPreviewUrl(currentProfileImage || null);
         setPreviewUrl(objectUrl);
         setError('');
      };

      img.src = objectUrl;
   };

   useEffect(() => {
      return () => {
         if (previewUrl && previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl);
         }
      };
   }, [previewUrl]);

   const handleSubmit = async (e) => {
      e.preventDefault();

      if (!selectedFile) {
         setError('Please select an image file');
         return;
      }

      setIsUploading(true);

      try {
         const formData = new FormData();
         formData.append('image', selectedFile);

         await onSave(formData);
         onClose();

         setSelectedFile(null);
         setPreviewUrl(currentProfileImage || null);
         setError('');
      }
      catch (err) {
         setError(err.response?.data?.message || 'Failed to upload profile image');
      }
      finally {
         setIsUploading(false);
      }
   };

   const handleBackdropClick = (e) => {
      if (e.target === e.currentTarget) {
         onClose();
      }
   };

   const handleClose = () => {
      setSelectedFile(null);
      setPreviewUrl(currentProfileImage || null);
      setError('');
      setIsUploading(false);
      onClose();
   };

   const triggerFileInput = () => {
      fileInputRef.current?.click();
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
                  <h2 className='text-xl font-bold'>Change Profile Image</h2>
                  <span className='text-[.75rem] text-[#4B5563]'>
                     Upload a JPEG or PNG image (100x100 to 2048x2048 pixels, max 5MB)
                  </span>
               </div>
               <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  onChange={handleFileSelect}
                  className='hidden'
               />
               <div className='flex flex-col items-center gap-[0.5rem]'>
                  <div className='w-32 h-32 rounded-full border-2 border-gray-300 overflow-hidden bg-gray-100 flex items-center justify-center'>
                     {previewUrl ? (
                        <img
                           src={previewUrl}
                           alt="Profile preview"
                           className='w-full h-full object-cover'
                        />
                     ) : (
                        <div className='text-gray-400 text-sm text-center'>
                           No image selected
                        </div>
                     )}
                  </div>
                  <button
                     type="button"
                     onClick={triggerFileInput}
                     className='text-[#110D79] text-sm underline hover:text-[#0F0B6B] transition-colors'
                     disabled={isUploading}
                  >
                     {selectedFile ? 'Change Image' : 'Select Image'}
                  </button>
               </div>
               {selectedFile && (
                  <div className='text-sm text-gray-600 text-center'>
                     Selected: {selectedFile.name}
                  </div>
               )}
               {error && (
                  <span className='text-red-500 text-sm'>{error}</span>
               )}
               <div className='flex gap-[0.5rem] justify-end mt-4'>
                  <button
                     type="button"
                     onClick={handleClose}
                     className='px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors'
                     disabled={isUploading}
                  >
                     Cancel
                  </button>
                  <button
                     type="submit"
                     disabled={!selectedFile || isUploading}
                     className='border-solid border-[1px] border-[#110D79] bg-[#D1D6FA] flex items-center justify-center rounded-full text-[#110D79] text-[.875rem] py-[0.6875rem] px-[1.125rem] cursor-pointer hover:bg-[#C1C9F9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                     <span>{isUploading ? 'UPLOADING...' : 'CHANGE'}</span>
                  </button>
               </div>
            </form>
         </div>
      </div>
   );
};

export const UploadStatusModal = ({
   isOpen,
   onClose,
   status, 
   title,
   message,
   autoClose = true,
   autoCloseDelay = 3000
}) => {

   useEffect(() => {
      if (isOpen && status === 'success' && autoClose) {
         const timer = setTimeout(() => {
            onClose();
         }, autoCloseDelay);

         return () => clearTimeout(timer);
      }
   }, [isOpen, status, autoClose, autoCloseDelay, onClose]);

   const handleBackdropClick = (e) => {
      if (e.target === e.currentTarget && status !== 'loading') {
         onClose();
      }
   };

   if (!isOpen) return null;

   const getIcon = () => {
      switch (status) {
         case 'success':
            return (
               <div className='w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4'>
                  <svg className='w-8 h-8 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                     <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                  </svg>
               </div>
            );
         case 'error':
            return (
               <div className='w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4'>
                  <svg className='w-8 h-8 text-red-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                     <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                  </svg>
               </div>
            );
         case 'loading':
            return (
               <div className='w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4'>
                  <div className='w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin'></div>
               </div>
            );
         default:
            return null;
      }
   };

   const getColors = () => {
      switch (status) {
         case 'success':
            return {
               title: 'text-green-800',
               message: 'text-green-600',
               button: 'bg-green-600 hover:bg-green-700 text-white'
            };
         case 'error':
            return {
               title: 'text-red-800',
               message: 'text-red-600',
               button: 'bg-red-600 hover:bg-red-700 text-white'
            };
         case 'loading':
            return {
               title: 'text-blue-800',
               message: 'text-blue-600',
               button: 'bg-gray-400 cursor-not-allowed text-white'
            };
         default:
            return {
               title: 'text-gray-800',
               message: 'text-gray-600',
               button: 'bg-gray-600 hover:bg-gray-700 text-white'
            };
      }
   };

   const colors = getColors();

   return (
      <div
         className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center font-roboto'
         onClick={handleBackdropClick}
      >
         <div className='bg-white shadow-xl p-8 w-[25rem] max-w-[90vw] text-center flex flex-col items-center justify-center'>
            {getIcon()}

            <h2 className={`text-xl font-bold mb-2 ${colors.title}`}>
               {title || (status === 'success' ? 'Success!' : status === 'error' ? 'Error!' : 'Processing...')}
            </h2>

            <p className={`text-sm mb-6 ${colors.message}`}>
               {message || (
                  status === 'success'
                     ? 'Your changes have been saved successfully.'
                     : status === 'error'
                        ? 'Something went wrong. Please try again.'
                        : 'Please wait while we process your request...'
               )}
            </p>

            {status !== 'loading' && (
               <button
                  onClick={onClose}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${colors.button}`}
                  disabled={status === 'loading'}
               >
                  {status === 'success' ? 'OK' : 'Try Again'}
               </button>
            )}

            {status === 'success' && autoClose && (
               <p className='text-xs text-gray-500 mt-3'>
                  This message will close automatically in {autoCloseDelay / 1000} seconds
               </p>
            )}
         </div>
      </div>
   );
};
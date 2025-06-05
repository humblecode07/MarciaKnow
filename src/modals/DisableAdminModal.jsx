// Updated DisableAdminModal component - Key fixes

import React from 'react';

const DisableAdminModal = ({ isOpen, onClose, onConfirm, adminData, isLoading }) => {
   if (!isOpen) return null;

   const isDisabled = adminData?.isDisabled === true;
   const actionText = isDisabled ? 'Enable' : 'Disable';
   const actionColor = isDisabled ? '#16A34A' : '#AF1E1E';
   const bgColor = isDisabled ? '#D1FAE5' : '#FAD1D1';

   return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
         <div className="bg-white p-6 w-full max-w-md mx-4">
            <div className="flex flex-col gap-4">
               <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold font-poppins">
                     {actionText} Administrator
                  </h2>
                  <button
                     onClick={onClose}
                     className="text-gray-400 hover:text-gray-600 text-xl"
                     disabled={isLoading}
                  >
                     ✕
                  </button>
               </div>
               <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <img
                     src={adminData?.profile ? `https://marciaknow-backend.vercel.app/admin/profile/${adminData.profile}` : '/default-avatar.png'}
                     alt=""
                     className="w-12 h-12 rounded-full object-cover"
                     onError={(e) => {
                        e.target.src = '/default-avatar.png';
                     }}
                  />
                  <div>
                     <p className="font-semibold font-roboto">{adminData?.full_name}</p>
                     <p className="text-sm text-gray-600 font-roboto">{adminData?.email}</p>
                     <div className="flex gap-2 items-center mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${adminData?.roles?.includes(Number(import.meta.env.VITE_ROLE_SUPER_ADMIN))
                           ? 'bg-purple-100 text-purple-700'
                           : 'bg-blue-100 text-blue-700'
                           }`}>
                           {adminData?.roles?.includes(Number(import.meta.env.VITE_ROLE_SUPER_ADMIN)) ? 'Super Admin' : 'Admin'}
                        </span>
                        {/* Fix: Show account status based on isDisabled field */}
                        <span className={`text-xs font-medium ${adminData?.isDisabled ? 'text-red-500' : 'text-green-500'}`}>
                           {adminData?.isDisabled ? 'DISABLED' : 'ACTIVE'}
                        </span>
                     </div>
                  </div>
               </div>

               {/* Confirmation Message */}
               <div className="text-center py-2">
                  <p className="text-gray-700 font-roboto">
                     Are you sure you want to <span className="font-semibold">{actionText.toLowerCase()}</span> this administrator?
                  </p>
                  {!isDisabled && (
                     <p className="text-sm text-red-600 mt-2 font-roboto">
                        This admin will lose access to the system immediately.
                     </p>
                  )}
                  {isDisabled && (
                     <p className="text-sm text-green-600 mt-2 font-roboto">
                        This admin will regain access to the system.
                     </p>
                  )}
               </div>

               {/* Action Buttons */}
               <div className="flex gap-3 mt-4">
                  <button
                     onClick={onClose}
                     className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 font-roboto"
                     disabled={isLoading}
                  >
                     Cancel
                  </button>
                  <button
                     onClick={onConfirm}
                     disabled={isLoading}
                     className="flex-1 px-4 py-2 border font-roboto font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                     style={{
                        backgroundColor: bgColor,
                        borderColor: actionColor,
                        color: actionColor
                     }}
                  >
                     {isLoading ? 'Processing...' : actionText}
                  </button>
               </div>
            </div>
         </div>
      </div>
   );
};

export default DisableAdminModal;
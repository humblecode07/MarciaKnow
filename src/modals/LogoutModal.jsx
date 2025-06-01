const LogoutModal = ({ isOpen, onClose, onConfirm }) => {
   if (!isOpen) return null;

   return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
         <div className="bg-white p-6 w-80 mx-4">
            <div className="flex items-center justify-center mb-4">
               <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                     <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                     <polyline points="16,17 21,12 16,7" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                     <line x1="21" y1="12" x2="9" y2="12" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
               </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
               Confirm Logout
            </h3>

            <p className="text-gray-600 text-center mb-6">
               Are you sure you want to log out? You will need to sign in again to access your account.
            </p>

            <div className="flex gap-3">
               <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
               >
                  Cancel
               </button>
               <button
                  onClick={onConfirm}
                  className="flex-1 px-4 py-2 bg-red-600 text-white hover:bg-red-700 transition-colors font-medium"
               >
                  Logout
               </button>
            </div>
         </div>
      </div>
   );
};

export default LogoutModal

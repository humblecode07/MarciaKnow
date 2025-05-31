import { useState } from "react";
import AdminUserIcon from "../assets/Icons/AdminUserIcon";
import XIcon from "../assets/Icons/XIcon";
import ImageIcon from "../assets/Icons/ImageIcon";

const CreateAdminModal = ({ isOpen, onClose, onSubmit }) => {
   const [formData, setFormData] = useState({
      full_name: '',
      email: '',
      password: '',
      contact: '',
      image: null
   });

   const [errors, setErrors] = useState({});
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [imagePreview, setImagePreview] = useState(null);

   const validateForm = () => {
      const newErrors = {};

      if (!formData.full_name.trim()) {
         newErrors.full_name = 'Full name is required';
      }

      if (!formData.email.trim()) {
         newErrors.email = 'Email is required';
      } 
      else if (!formData.email.endsWith('@dyci.edu.ph')) {
         newErrors.email = 'Email must end with @dyci.edu.ph';
      } 
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
         newErrors.email = 'Please enter a valid email address';
      }

      if (!formData.password) {
         newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
         newErrors.password = 'Password must be at least 6 characters';
      }

      if (!formData.contact.trim()) {
         newErrors.contact = 'Contact number is required';
      } 
      else if (!/^\+?[\d\s-()]+$/.test(formData.contact)) {
         newErrors.contact = 'Please enter a valid contact number';
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
   };

   const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({
         ...prev,
         [name]: value
      }));

      if (errors[name]) {
         setErrors(prev => ({
            ...prev,
            [name]: ''
         }));
      }
   };

   const handleImageChange = (e) => {
      const file = e.target.files[0];
      if (file) {
         setFormData(prev => ({
            ...prev,
            image: file
         }));

         // Create preview
         const reader = new FileReader();
         reader.onloadend = () => {
            setImagePreview(reader.result);
         };
         reader.readAsDataURL(file);

         if (errors.image) {
            setErrors(prev => ({
               ...prev,
               image: ''
            }));
         }
      }
   };

   const handleSubmit = async () => {
      if (!validateForm()) {
         return;
      }

      setIsSubmitting(true);

      try {
         const submitData = new FormData();
         submitData.append('full_name', formData.full_name);
         submitData.append('email', formData.email);
         submitData.append('password', formData.password);
         submitData.append('contact', formData.contact);
         if (formData.image) {
            submitData.append('image', formData.image);
         }

         await onSubmit(submitData);

         setFormData({
            full_name: '',
            email: '',
            password: '',
            contact: '',
            image: null
         });

         setImagePreview(null);
         setErrors({});
         onClose();
      } catch (error) {
         console.error('Error submitting form:', error);
         setErrors({ submit: 'Failed to create admin. Please try again.' });
      } finally {
         setIsSubmitting(false);
      }
   };

   const handleClose = () => {
      setFormData({
         full_name: '',
         email: '',
         password: '',
         contact: '',
         image: null
      });
      setImagePreview(null);
      setErrors({});
      onClose();
   };

   if (!isOpen) return null;

   return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
         <div className="bg-white w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
               <div className="flex items-center gap-3">
                  <AdminUserIcon />
                  <h2 className="font-poppins text-lg font-bold text-gray-900">Add New Admin</h2>
               </div>
               <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
               >
                  <XIcon />
               </button>
            </div>
            <div className="p-6 space-y-4">
               {errors.submit && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3">
                     {errors.submit}
                  </div>
               )}
               <div className="flex flex-col gap-2">
                  <label className="font-roboto text-sm font-medium text-gray-700">
                     Profile Image
                  </label>
                  <div className="flex items-center gap-4">
                     <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                        {imagePreview ? (
                           <img
                              src={imagePreview}
                              alt="Preview"
                              className="w-full h-full object-cover"
                           />
                        ) : (
                           <ImageIcon />
                        )}
                     </div>
                     <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 cursor-pointer hover:bg-gray-50">
                        <ImageIcon />
                        <span className="font-roboto text-sm">Choose Image</span>
                        <input
                           type="file"
                           accept="image/*"
                           onChange={handleImageChange}
                           className="hidden"
                        />
                     </label>
                  </div>
                  {errors.image && (
                     <span className="text-red-500 text-xs font-roboto">{errors.image}</span>
                  )}
               </div>

               {/* Full Name */}
               <div className="flex flex-col gap-2">
                  <label className="font-roboto text-sm font-medium text-gray-700">
                     Full Name *
                  </label>
                  <input
                     type="text"
                     name="full_name"
                     value={formData.full_name}
                     onChange={handleInputChange}
                     className={`px-3 py-2 border rounded font-roboto text-sm ${errors.full_name ? 'border-red-300' : 'border-gray-300'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                     placeholder="Enter full name"
                  />
                  {errors.full_name && (
                     <span className="text-red-500 text-xs font-roboto">{errors.full_name}</span>
                  )}
               </div>

               {/* Email */}
               <div className="flex flex-col gap-2">
                  <label className="font-roboto text-sm font-medium text-gray-700">
                     Email *
                  </label>
                  <input
                     type="email"
                     name="email"
                     value={formData.email}
                     onChange={handleInputChange}
                     className={`px-3 py-2 border rounded font-roboto text-sm ${errors.email ? 'border-red-300' : 'border-gray-300'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                     placeholder="example@dyci.edu.ph"
                  />
                  {errors.email && (
                     <span className="text-red-500 text-xs font-roboto">{errors.email}</span>
                  )}
                  <span className="text-xs text-gray-500 font-roboto">
                     Email must end with @dyci.edu.ph
                  </span>
               </div>

               {/* Password */}
               <div className="flex flex-col gap-2">
                  <label className="font-roboto text-sm font-medium text-gray-700">
                     Password *
                  </label>
                  <input
                     type="password"
                     name="password"
                     value={formData.password}
                     onChange={handleInputChange}
                     className={`px-3 py-2 border rounded font-roboto text-sm ${errors.password ? 'border-red-300' : 'border-gray-300'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                     placeholder="Enter password"
                  />
                  {errors.password && (
                     <span className="text-red-500 text-xs font-roboto">{errors.password}</span>
                  )}
               </div>
               <div className="flex flex-col gap-2">
                  <label className="font-roboto text-sm font-medium text-gray-700">
                     Contact Number *
                  </label>
                  <input
                     type="tel"
                     name="contact"
                     value={formData.contact}
                     onChange={handleInputChange}
                     className={`px-3 py-2 border rounded font-roboto text-sm ${errors.contact ? 'border-red-300' : 'border-gray-300'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                     placeholder="+63 XXX XXX XXXX"
                  />
                  {errors.contact && (
                     <span className="text-red-500 text-xs font-roboto">{errors.contact}</span>
                  )}
               </div>
               <div className="flex gap-3 pt-4">
                  <button
                     type="button"
                     onClick={handleClose}
                     className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-roboto text-sm hover:bg-gray-50 transition-colors"
                  >
                     Cancel
                  </button>
                  <button
                     type="button"
                     onClick={handleSubmit}
                     disabled={isSubmitting}
                     className={`flex-1 px-4 py-2 font-roboto text-sm transition-colors ${isSubmitting
                           ? 'bg-gray-400 cursor-not-allowed'
                           : 'bg-[#110D79] hover:bg-[#0f0b6b]'
                        } text-white`}
                  >
                     {isSubmitting ? 'Creating...' : 'Create Admin'}
                  </button>
               </div>
            </div>
         </div>
      </div>
   );
};

export default CreateAdminModal
import React, { useState } from 'react';
import { axiosPrivate } from '../api/api';

const FeedbackModal = ({ isOpen, onClose, kiosk }) => {
   const [formData, setFormData] = useState({
      message: '',
      category: 'Suggestion',
      userEmail: '',
      userPhone: '',
      pageSection: '',
      kioskLocation: kiosk?.name || ''
   });
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [submitStatus, setSubmitStatus] = useState(null);

   const categories = ['Bug', 'Suggestion', 'Complaint', 'Praise'];

   const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({
         ...prev,
         [name]: value
      }));
   };

   const handleSubmit = async (e) => {
      e.preventDefault();

      if (!formData.message.trim()) {
         alert('Please provide a message');
         return;
      }

      setIsSubmitting(true);
      setSubmitStatus(null);

      try {
         const response = await axiosPrivate.post('/feedback/submit', formData, {
            headers: {
               'Content-Type': 'application/json',
            },
         });

         setSubmitStatus('success');

         setTimeout(() => {
            setFormData({
               message: '',
               category: 'Suggestion',
               userEmail: '',
               userPhone: '',
               pageSection: '',
               kioskLocation: kiosk?.name || ''
            });
            setSubmitStatus(null);
            onClose();
         }, 2000);

      } catch (error) {
         console.error('Error submitting feedback:', error);
         setSubmitStatus('error');

         if (error.response?.data?.message) {
            alert(`Error: ${error.response.data.message}`);
         } else {
            alert('Failed to submit feedback. Please try again.');
         }
      } finally {
         setIsSubmitting(false);
      }
   };

   if (!isOpen) return null;

   return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 sm:p-6 md:p-8">
         <div className="bg-white shadow-xl w-full max-w-[90vw] sm:max-w-[80vw] md:max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
               <h2 className="text-xl font-righteous text-[#110D79]">Send Feedback</h2>
               <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                  disabled={isSubmitting}
               >
                  ×
               </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
               <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                     Feedback Type
                  </label>
                  <select
                     name="category"
                     value={formData.category}
                     onChange={handleInputChange}
                     className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#110D79] focus:border-transparent"
                     required
                  >
                     {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                     ))}
                  </select>
               </div>

               {/* Message */}
               <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                     Message *
                  </label>
                  <textarea
                     name="message"
                     value={formData.message}
                     onChange={handleInputChange}
                     rows={4}
                     maxLength={2000}
                     placeholder="Please describe your feedback in detail..."
                     className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#110D79] focus:border-transparent resize-vertical"
                     required
                  />
                  <div className="text-right text-sm text-gray-500 mt-1">
                     {formData.message.length}/2000
                  </div>
               </div>

               {/* Page Section */}
               <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                     Page/Section (Optional)
                  </label>
                  <input
                     type="text"
                     name="pageSection"
                     value={formData.pageSection}
                     onChange={handleInputChange}
                     placeholder="Which part of the app is this about?"
                     maxLength={100}
                     className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#110D79] focus:border-transparent"
                  />
               </div>

               {/* Contact Information */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email (Optional)
                     </label>
                     <input
                        type="email"
                        name="userEmail"
                        value={formData.userEmail}
                        onChange={handleInputChange}
                        placeholder="your.email@example.com"
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#110D79] focus:border-transparent"
                     />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone (Optional)
                     </label>
                     <input
                        type="tel"
                        name="userPhone"
                        value={formData.userPhone}
                        onChange={handleInputChange}
                        placeholder="Your phone number"
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#110D79] focus:border-transparent"
                     />
                  </div>
               </div>

               {/* Kiosk Info */}
               <div className="mb-6 p-3 bg-gray-50 rounded-md">
                  <div className="text-sm text-gray-600">
                     <div><strong>Kiosk:</strong> {kiosk?.name || 'Unknown'}</div>
                     <div><strong>Location:</strong> {formData.kioskLocation}</div>
                     <div><strong>Time:</strong> {new Date().toLocaleString()}</div>
                  </div>
               </div>

               {/* Status Messages */}
               {submitStatus === 'success' && (
                  <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
                     Feedback submitted successfully! Thank you for your input.
                  </div>
               )}
               {submitStatus === 'error' && (
                  <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                     Error submitting feedback. Please try again.
                  </div>
               )}

               {/* Submit Buttons */}
               <div className="flex gap-3 justify-end">
                  <button
                     type="button"
                     onClick={onClose}
                     disabled={isSubmitting}
                     className="px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                     Cancel
                  </button>
                  <button
                     type="submit"
                     disabled={isSubmitting || !formData.message.trim()}
                     className="px-6 py-2 bg-[#4329D8] text-white hover:bg-[#3422B8] disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                     {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                  </button>
               </div>
            </form>
         </div>
      </div>
   );
};

export default FeedbackModal;
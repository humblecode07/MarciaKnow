import React, { useState, useRef } from 'react';
import domtoimage from 'dom-to-image-more';
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
   const [screenshot, setScreenshot] = useState(null);
   const [screenshotMetadata, setScreenshotMetadata] = useState(null);
   const [isCapturing, setIsCapturing] = useState(false);
   const fileInputRef = useRef(null);
   const [attachments, setAttachments] = useState([]);

   const categories = ['Bug', 'Suggestion', 'Complaint', 'Praise'];

   const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({
         ...prev,
         [name]: value
      }));
   };

   // Helper function to get image dimensions and metadata
   const getImageMetadata = (file) => {
      return new Promise((resolve) => {
         if (!file.type.startsWith('image/')) {
            // For non-image files, return default metadata
            resolve({
               width: 0,
               height: 0,
               aspect_ratio: 0,
               size: file.size,
               mimetype: file.type,
               filename: file.name
            });
            return;
         }

         const img = new Image();
         const url = URL.createObjectURL(file);

         img.onload = () => {
            const metadata = {
               width: img.naturalWidth,
               height: img.naturalHeight,
               aspect_ratio: parseFloat((img.naturalWidth / img.naturalHeight).toFixed(2)),
               size: file.size,
               mimetype: file.type,
               filename: file.name
            };
            URL.revokeObjectURL(url);
            resolve(metadata);
         };

         img.onerror = () => {
            URL.revokeObjectURL(url);
            // Fallback metadata for corrupted images
            resolve({
               width: 0,
               height: 0,
               aspect_ratio: 0,
               size: file.size,
               mimetype: file.type,
               filename: file.name
            });
         };

         img.src = url;
      });
   };

   const captureScreenshot = async () => {
      setIsCapturing(true);

      try {
         // Get the target element to capture
         const targetElement = document.body;

         // Configure dom-to-image options
         const options = {
            quality: 0.8,
            bgcolor: '#ffffff',
            width: window.innerWidth,
            height: window.innerHeight,
            style: {
               transform: 'scale(0.5)',
               transformOrigin: 'top left',
               width: window.innerWidth + 'px',
               height: window.innerHeight + 'px'
            },
            filter: (node) => {
               // Filter out elements that might cause issues
               if (node.classList) {
                  return !node.classList.contains('ignore-screenshot');
               }
               // Skip problematic elements
               const tagName = node.tagName;
               return !(tagName === 'IFRAME' || tagName === 'VIDEO' || tagName === 'EMBED' || tagName === 'OBJECT');
            }
         };

         // Try different methods in order of preference
         let blob;
         let captureWidth = window.innerWidth;
         let captureHeight = window.innerHeight;

         try {
            // Method 1: toPng (most compatible)
            const dataUrl = await domtoimage.toPng(targetElement, options);
            blob = await dataUrlToBlob(dataUrl);
         } catch (error) {
            console.warn('toPng failed, trying toJpeg:', error);

            try {
               // Method 2: toJpeg (fallback)
               const dataUrl = await domtoimage.toJpeg(targetElement, {
                  ...options,
                  quality: 0.8
               });
               blob = await dataUrlToBlob(dataUrl);
            } catch (jpegError) {
               console.warn('toJpeg failed, trying alternative capture:', jpegError);

               // Method 3: Capture specific container
               const altResult = await tryAlternativeCapture();
               if (altResult) {
                  blob = altResult.blob;
                  captureWidth = altResult.width;
                  captureHeight = altResult.height;
               }
            }
         }

         if (blob) {
            setScreenshot(blob);
            // Store metadata for the screenshot
            setScreenshotMetadata({
               width: Math.floor(captureWidth * 0.5), // Adjusted for scale
               height: Math.floor(captureHeight * 0.5),
               aspect_ratio: parseFloat((captureWidth / captureHeight).toFixed(2)),
               size: blob.size,
               mimetype: blob.type,
               filename: `screenshot-${Date.now()}.png`
            });
         }

      } catch (error) {
         console.error('Error capturing screenshot:', error);
         alert('Unable to capture screenshot. Please try again or attach a file instead.');
      } finally {
         setIsCapturing(false);
      }
   };

   // Alternative capture method - capture main content area
   const tryAlternativeCapture = async () => {
      const mainContent = document.querySelector('main') ||
         document.querySelector('#root') ||
         document.querySelector('.app') ||
         document.querySelector('.container') ||
         document.body.children[0];

      if (mainContent) {
         const rect = mainContent.getBoundingClientRect();
         const options = {
            quality: 0.7,
            bgcolor: '#ffffff',
            style: {
               transform: 'scale(0.4)',
               transformOrigin: 'top left'
            },
            filter: (node) => {
               if (node.classList) {
                  return !node.classList.contains('ignore-screenshot');
               }
               const tagName = node.tagName;
               return !(tagName === 'IFRAME' || tagName === 'VIDEO' || tagName === 'EMBED');
            }
         };

         try {
            const dataUrl = await domtoimage.toPng(mainContent, options);
            const blob = await dataUrlToBlob(dataUrl);
            return {
               blob,
               width: rect.width,
               height: rect.height
            };
         } catch (error) {
            // Try JPEG as final fallback
            const dataUrl = await domtoimage.toJpeg(mainContent, {
               ...options,
               quality: 0.6
            });
            const blob = await dataUrlToBlob(dataUrl);
            return {
               blob,
               width: rect.width,
               height: rect.height
            };
         }
      }
      return null;
   };

   const dataUrlToBlob = (dataUrl) => {
      return new Promise((resolve) => {
         const arr = dataUrl.split(',');
         const mime = arr[0].match(/:(.*?);/)[1];
         const bstr = atob(arr[1]);
         let n = bstr.length;
         const u8arr = new Uint8Array(n);
         while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
         }
         resolve(new Blob([u8arr], { type: mime }));
      });
   };

   const handleFileSelect = async (e) => {
      const files = Array.from(e.target.files);
      if (files.length + attachments.length > 5) {
         alert('Maximum 5 files allowed');
         return;
      }

      // Process files and get metadata
      const filesWithMetadata = await Promise.all(
         files.map(async (file) => {
            const metadata = await getImageMetadata(file);
            return {
               file,
               metadata
            };
         })
      );

      setAttachments(prev => [...prev, ...filesWithMetadata]);
   };

   const removeAttachment = (index) => {
      setAttachments(prev => prev.filter((_, i) => i !== index));
   };

   const removeScreenshot = () => {
      setScreenshot(null);
      setScreenshotMetadata(null);
   };

   const validateFileSize = (file, maxSizeMB = 10) => {
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      return file.size <= maxSizeBytes;
   };

   const handleSubmit = async (e) => {
      e.preventDefault();

      if (!formData.message.trim()) {
         alert('Please provide a message');
         return;
      }

      const oversizedFiles = attachments.filter(
         ({ file }) => !validateFileSize(file, 10)
      );

      if (screenshot && !validateFileSize(screenshot, 10)) {
         alert('Screenshot is too large (max 10MB)');
         return;
      }

      if (oversizedFiles.length > 0) {
         alert(`Some files are too large (max 10MB): ${oversizedFiles.map(f => f.metadata.filename).join(', ')}`);
         return;
      }

      setIsSubmitting(true);
      setSubmitStatus(null);

      try {
         const submitData = new FormData();

         // Add form fields
         Object.keys(formData).forEach(key => {
            submitData.append(key, formData[key]);
         });

         // Collect all metadata into a single array
         const allAttachmentMetadata = [];

         // If there's a screenshot, add it and its metadata first
         if (screenshot && screenshotMetadata) {
            submitData.append('attachments', screenshot, screenshotMetadata.filename);
            allAttachmentMetadata.push(screenshotMetadata);
         }

         // Add other attachments and their metadata
         attachments.forEach(({ file, metadata }) => {
            submitData.append('attachments', file);
            allAttachmentMetadata.push(metadata);
         });

         // ONLY append all metadata as a single JSON string ONCE
         if (allAttachmentMetadata.length > 0) {
            submitData.append('attachmentMetadata', JSON.stringify(allAttachmentMetadata));
         }

         const response = await axiosPrivate.post('/feedback/submit', submitData, {
            headers: {
               'Content-Type': 'multipart/form-data',
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
            setScreenshot(null);
            setScreenshotMetadata(null);
            setAttachments([]);
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
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
         <div className="bg-white shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
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

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6">
               {/* Category Selection */}
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

               {/* Screenshot Section */}
               <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                     Screenshot
                  </label>
                  <div className="flex gap-2 mb-2">
                     <button
                        type="button"
                        onClick={captureScreenshot}
                        disabled={isCapturing || screenshot}
                        className="px-4 py-2 bg-[#4329D8] text-white rounded-md hover:bg-[#3422B8] disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                     >
                        {isCapturing ? 'Capturing...' : screenshot ? 'Screenshot Captured' : 'Capture Screenshot'}
                     </button>
                     {screenshot && (
                        <button
                           type="button"
                           onClick={removeScreenshot}
                           className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
                        >
                           Remove Screenshot
                        </button>
                     )}
                  </div>
                  {screenshot && (
                     <div className="text-sm text-green-600">
                        ✓ Screenshot captured and ready to submit
                     </div>
                  )}
               </div>

               {/* File Attachments */}
               <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                     Additional Files (Max 5)
                  </label>
                  <input
                     type="file"
                     ref={fileInputRef}
                     onChange={handleFileSelect}
                     multiple
                     accept="image/*,.pdf,.doc,.docx,.txt"
                     className="hidden"
                  />
                  <button
                     type="button"
                     onClick={() => fileInputRef.current?.click()}
                     disabled={attachments.length >= 5}
                     className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                  >
                     Add Files ({attachments.length}/5)
                  </button>

                  {/* File List */}
                  {attachments.length > 0 && (
                     <div className="mt-2 space-y-1">
                        {attachments.map((file, index) => (
                           <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                              <span className="text-sm truncate">{file.name}</span>
                              <button
                                 type="button"
                                 onClick={() => removeAttachment(index)}
                                 className="text-red-500 hover:text-red-700 ml-2"
                              >
                                 Remove
                              </button>
                           </div>
                        ))}
                     </div>
                  )}
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
                     className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
                  >
                     Cancel
                  </button>
                  <button
                     type="submit"
                     disabled={isSubmitting || !formData.message.trim()}
                     className="px-6 py-2 bg-[#4329D8] text-white rounded-md hover:bg-[#3422B8] disabled:bg-gray-400 disabled:cursor-not-allowed"
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
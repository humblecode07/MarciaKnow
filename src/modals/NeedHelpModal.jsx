import React, { useState } from 'react';
import { Search, MapPin, MessageCircle, Phone, Mail, Clock, ChevronRight, ChevronDown, X } from 'lucide-react';

const NeedHelpModal = ({ showHelp, setShowHelp, onTriggerAI }) => {
   const [expandedSection, setExpandedSection] = useState(null);
   const [selectedCategory, setSelectedCategory] = useState('search');

   const helpCategories = {
      search: {
         title: "Search Help",
         icon: <Search className="w-4 h-4" />,
         content: [
            {
               question: "How do I search for a location?",
               answer: "Use the search bar in the left panel. Type the name of the building, room, or facility you're looking for."
            },
            {
               question: "Search tips for better results",
               answer: "Try these tips:\n• Use building codes (e.g., 'CS' for Computer Science)\n• Search by room numbers (e.g., 'Room 101')\n• Use keywords like 'library', 'cafeteria', 'gym'\n• Check your spelling"
            },
            {
               question: "What if I can't find what I'm looking for?",
               answer: "Try different keywords or ask our AI assistant for help!"
            }
         ]
      },
      navigation: {
         title: "Navigation Help",
         icon: <MapPin className="w-4 h-4" />,
         content: [
            {
               question: "How do I get directions?",
               answer: "Once you find your destination, click on it and select 'Show Navigation' to get step-by-step directions from your current kiosk location."
            },
            {
               question: "Understanding the campus map",
               answer: "• Blue dots show kiosk locations\n• Colored paths show your route\n• Building outlines help you identify structures\n• Click on any building for more details"
            },
            {
               question: "What are the colored paths?",
               answer: "Different colored paths represent different route options. Follow the highlighted path for the recommended route to your destination."
            }
         ]
      },
      features: {
         title: "Kiosk Features",
         icon: <MessageCircle className="w-4 h-4" />,
         content: [
            {
               question: "What can the AI assistant do?",
               answer: "Our AI can help you find locations, get directions, answer questions about facilities, and provide campus information."
            },
            {
               question: "How do I use QR codes?",
               answer: "Generate QR codes for any location to share with friends or save for later. Scan QR codes with your phone to get instant directions."
            },
            {
               question: "Quick suggestions",
               answer: "Use the quick suggestion buttons for common destinations like the library, main buildings, or cashier office."
            }
         ]
      },
      contact: {
         title: "Need More Help?",
         icon: <Phone className="w-4 h-4" />,
         content: [
            {
               question: "Campus Information Desk",
               answer: "Located at the Main Building, Ground Floor\nOpen: Monday-Friday, 8:00 AM - 5:00 PM"
            },
            {
               question: "Technical Support",
               answer: "If you're experiencing technical issues with this kiosk, please report it using the feedback button."
            },
            {
               question: "Emergency Contacts",
               answer: "Security: Local 911\nCampus Security: (123) 456-7890\nMedical Emergency: Campus Clinic - (123) 456-7891"
            }
         ]
      }
   };

   const toggleSection = (index) => {
      setExpandedSection(expandedSection === index ? null : index);
   };

   const handleCategoryChange = (category) => {
      setSelectedCategory(category);
      setExpandedSection(null);
   };

   const handleAIHelp = () => {
      setShowHelp(false);
      if (onTriggerAI) {
         onTriggerAI();
      }
   };

   if (!showHelp) return null;

   return (
      <div className='fixed inset-0 bg-black/50 z-30 flex items-center justify-center p-4'>
         <div className='bg-white w-full max-w-2xl max-h-[90vh] shadow-xl font-roboto relative overflow-hidden'>
            {/* Header */}
            <div className='bg-[#070e38] text-white p-4 flex items-center justify-between'>
               <div className='flex items-center gap-3'>
                  <div className='w-8 h-8 bg-white/20 rounded-full flex items-center justify-center'>
                     <MessageCircle className="w-4 h-4" />
                  </div>
                  <h2 className='font-bold text-lg'>Help Center</h2>
               </div>
               <button
                  className='text-white hover:bg-white/20 p-1 rounded'
                  onClick={() => setShowHelp(false)}
               >
                  <X className="w-5 h-5" />
               </button>
            </div>

            <div className='flex h-[500px]'>
               {/* Sidebar */}
               <div className='w-1/3 bg-gray-50 border-r overflow-y-auto'>
                  {Object.entries(helpCategories).map(([key, category]) => (
                     <button
                        key={key}
                        onClick={() => handleCategoryChange(key)}
                        className={`w-full text-left p-4 border-b flex items-center gap-3 transition-colors ${selectedCategory === key
                              ? 'bg-[#110D79] text-white'
                              : 'hover:bg-gray-100'
                           }`}
                     >
                        {category.icon}
                        <span className='font-medium text-sm'>{category.title}</span>
                     </button>
                  ))}
               </div>

               {/* Content */}
               <div className='flex-1 overflow-y-auto'>
                  <div className='p-6'>
                     <h3 className='text-xl font-semibold mb-4 text-[#110D79]'>
                        {helpCategories[selectedCategory].title}
                     </h3>

                     <div className='space-y-3'>
                        {helpCategories[selectedCategory].content.map((item, index) => (
                           <div key={index} className='border border-gray-200 rounded-lg'>
                              <button
                                 onClick={() => toggleSection(index)}
                                 className='w-full text-left p-4 flex items-center justify-between hover:bg-gray-50 transition-colors'
                              >
                                 <span className='font-medium text-sm'>{item.question}</span>
                                 {expandedSection === index ? (
                                    <ChevronDown className="w-4 h-4 text-gray-500" />
                                 ) : (
                                    <ChevronRight className="w-4 h-4 text-gray-500" />
                                 )}
                              </button>

                              {expandedSection === index && (
                                 <div className='px-4 pb-4 text-sm text-gray-700 border-t bg-gray-50'>
                                    <div className='pt-3 whitespace-pre-line leading-relaxed'>
                                       {item.answer}
                                    </div>
                                 </div>
                              )}
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
            <div className='bg-gray-50 p-4 border-t'>
               <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2 text-sm text-gray-600'>
                     <Clock className="w-4 h-4" />
                     <span>Still need help?</span>
                  </div>
                  <button
                     onClick={handleAIHelp}
                     className='bg-[#DBB341] hover:bg-[#c9a32e] text-white px-6 py-2 font-medium transition-colors'
                  >
                     Ask MarciaBot 🤖
                  </button>
               </div>
            </div>
         </div>
      </div>
   );
};

export default NeedHelpModal;
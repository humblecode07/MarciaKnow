import React, { useState, useEffect, useMemo } from 'react';
import { MessageSquare, Clock, User, AlertCircle, CheckCircle, XCircle, Filter, Search, Eye, Edit2, Trash2, ArrowUpDown, MoreHorizontal, TrendingUp, TrendingDown } from 'lucide-react';
import { fetchFeedbacks as fetchFeedbacksAPI, updateFeedbackStatus } from '../api/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const UserFeedback = () => {
   const queryClient = useQueryClient();

   const [filters, setFilters] = useState({
      category: '',
      status: '',
      priority: '',
      search: ''
   });
   const [selectedFeedback, setSelectedFeedback] = useState(null);
   const [showDetailModal, setShowDetailModal] = useState(false);
   const [sortField, setSortField] = useState('createdAt');
   const [sortDirection, setSortDirection] = useState('desc');

   // Fetch all feedbacks (without filters applied on server)
   const {
      data: allFeedbacks = [],
      isLoading,
      error
   } = useQuery({
      queryKey: ['feedbacks', filters], // optional: add filters to key for cache diff
      queryFn: async () => {
         return await fetchFeedbacksAPI(filters); // ✅ Pass filters properly
      },
      keepPreviousData: true
   });

   // Apply filters on client side
   const filteredFeedbacks = useMemo(() => {
      let filtered = [...allFeedbacks];

      // Apply category filter
      if (filters.category) {
         filtered = filtered.filter(fb => fb.category === filters.category);
      }

      // Apply status filter
      if (filters.status) {
         filtered = filtered.filter(fb => fb.status === filters.status);
      }

      // Apply priority filter
      if (filters.priority) {
         filtered = filtered.filter(fb => fb.priority === filters.priority);
      }

      // Apply search filter
      if (filters.search) {
         const searchLower = filters.search.toLowerCase();
         filtered = filtered.filter(fb =>
            fb.message.toLowerCase().includes(searchLower) ||
            fb.kioskLocation?.toLowerCase().includes(searchLower)
         );
      }

      return filtered;
   }, [allFeedbacks, filters]);

   // Derived stats (from filtered feedbacks)
   const stats = useMemo(() => {
      const getCount = (status) => filteredFeedbacks.filter(f => f.status === status).length;
      const getCategoryCount = (cat) => filteredFeedbacks.filter(f => f.category === cat).length;

      return {
         total: filteredFeedbacks.length,
         new: getCount('New'),
         inProgress: getCount('In Progress'),
         resolved: getCount('Resolved'),
         byCategory: {
            Bug: getCategoryCount('Bug'),
            Suggestion: getCategoryCount('Suggestion'),
            Complaint: getCategoryCount('Complaint'),
            Praise: getCategoryCount('Praise')
         }
      };
   }, [filteredFeedbacks]);

   const sortedFeedbacks = useMemo(() => {
      const sorted = [...filteredFeedbacks].sort((a, b) => {
         let aValue = a[sortField];
         let bValue = b[sortField];

         if (sortField === 'createdAt') {
            aValue = new Date(aValue);
            bValue = new Date(bValue);
         }

         return sortDirection === 'asc'
            ? aValue > bValue ? 1 : -1
            : aValue < bValue ? 1 : -1;
      });
      return sorted;
   }, [filteredFeedbacks, sortField, sortDirection]);

   // Status change mutation (optional: useMutation for better cache control)
   const handleStatusChange = async (feedbackId, newStatus) => {
      try {
         const response = await updateFeedbackStatus(feedbackId, { status: newStatus });

         if (response.success) {
            queryClient.invalidateQueries(['feedbacks']); // refresh feedbacks
         } else {
            alert('Failed to update status.');
         }
      } catch (error) {
         console.error('Error updating status:', error);
         alert('An error occurred while updating the status.');
      }
   };

   // Helpers
   const handleFilterChange = (filterType, value) => {
      setFilters(prev => ({
         ...prev,
         [filterType]: value
      }));
   };

   const clearFilters = () => {
      setFilters({
         category: '',
         status: '',
         priority: '',
         search: ''
      });
   };

   const viewDetails = (feedback) => {
      setSelectedFeedback(feedback);
      setShowDetailModal(true);
   };

   const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('en-US', {
         year: 'numeric',
         month: 'short',
         day: 'numeric',
         hour: '2-digit',
         minute: '2-digit'
      });
   };

   const getStatusColor = (status) => {
      switch (status) {
         case 'New': return 'bg-blue-50 text-blue-700 border-blue-200';
         case 'Reviewed': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
         case 'In Progress': return 'bg-orange-50 text-orange-700 border-orange-200';
         case 'Resolved': return 'bg-green-50 text-green-700 border-green-200';
         default: return 'bg-gray-50 text-gray-700 border-gray-200';
      }
   };

   const getCategoryColor = (category) => {
      switch (category) {
         case 'Bug': return 'bg-red-50 text-red-700 border-red-200';
         case 'Suggestion': return 'bg-blue-50 text-blue-700 border-blue-200';
         case 'Complaint': return 'bg-orange-50 text-orange-700 border-orange-200';
         case 'Praise': return 'bg-green-50 text-green-700 border-green-200';
         default: return 'bg-gray-50 text-gray-700 border-gray-200';
      }
   };

   const getPriorityColor = (priority) => {
      switch (priority) {
         case 'Critical': return 'text-red-600 bg-red-50';
         case 'High': return 'text-orange-600 bg-orange-50';
         case 'Medium': return 'text-yellow-600 bg-yellow-50';
         case 'Low': return 'text-green-600 bg-green-50';
         default: return 'text-gray-600 bg-gray-50';
      }
   };

   const handleSort = (field) => {
      if (sortField === field) {
         setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
      } else {
         setSortField(field);
         setSortDirection('desc');
      }
   };

   return (
      <div className="w-[73.98dvw] flex gap-[1rem] ml-[19.5625rem] mt-[1.875rem]">
         <div className='w-full flex flex-col gap-[1.5rem]'>
            <div className='flex justify-between items-center'>
               <div className='flex flex-col'>
                  <span className='font-poppins font-bold text-[1.125rem]'>Feedback Reports</span>
                  <p className='font-roboto text-[.875rem] text-[#737373]'>
                     View user-submitted feedback and reports to understand concerns, suggestions, and experiences.
                  </p>
               </div>
            </div>

            {/* Statistics Cards */}
            <div className='grid grid-cols-5 gap-6'>
               <div className='bg-white shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow'>
                  <div className='flex items-center justify-between'>
                     <div>
                        <p className='text-sm font-medium text-gray-600 mb-1'>Total Feedback</p>
                        <p className='text-3xl font-bold text-gray-900'>{stats.total}</p>
                        <p className='text-xs text-gray-500 flex items-center mt-1'>
                           <TrendingUp className='w-3 h-3 mr-1 text-green-500' />
                           All entries
                        </p>
                     </div>
                     <div className='w-12 h-12 bg-indigo-100 flex items-center justify-center'>
                        <MessageSquare className='w-6 h-6 text-indigo-600' />
                     </div>
                  </div>
               </div>

               <div className='bg-white shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow'>
                  <div className='flex items-center justify-between'>
                     <div>
                        <p className='text-sm font-medium text-gray-600 mb-1'>New</p>
                        <p className='text-3xl font-bold text-blue-600'>{stats.new}</p>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                           <div
                              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${stats.total > 0 ? (stats.new / stats.total) * 100 : 0}%` }}
                           ></div>
                        </div>
                     </div>
                     <div className='w-12 h-12 bg-blue-100 flex items-center justify-center'>
                        <AlertCircle className='w-6 h-6 text-blue-600' />
                     </div>
                  </div>
               </div>

               <div className='bg-white shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow'>
                  <div className='flex items-center justify-between'>
                     <div>
                        <p className='text-sm font-medium text-gray-600 mb-1'>In Progress</p>
                        <p className='text-3xl font-bold text-orange-600'>{stats.inProgress}</p>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                           <div
                              className="bg-orange-600 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${stats.total > 0 ? (stats.inProgress / stats.total) * 100 : 0}%` }}
                           ></div>
                        </div>
                     </div>
                     <div className='w-12 h-12 bg-orange-100 flex items-center justify-center'>
                        <Clock className='w-6 h-6 text-orange-600' />
                     </div>
                  </div>
               </div>

               <div className='bg-white shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow'>
                  <div className='flex items-center justify-between'>
                     <div>
                        <p className='text-sm font-medium text-gray-600 mb-1'>Resolved</p>
                        <p className='text-3xl font-bold text-green-600'>{stats.resolved}</p>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                           <div
                              className="bg-green-600 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${stats.total > 0 ? (stats.resolved / stats.total) * 100 : 0}%` }}
                           ></div>
                        </div>
                     </div>
                     <div className='w-12 h-12 bg-green-100 flex items-center justify-center'>
                        <CheckCircle className='w-6 h-6 text-green-600' />
                     </div>
                  </div>
               </div>

               <div className='bg-white shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow'>
                  <div className='flex items-center justify-between'>
                     <div>
                        <p className='text-sm font-medium text-gray-600 mb-1'>Top Category</p>
                        <p className='text-xl font-bold text-gray-900'>
                           {Object.entries(stats.byCategory).reduce((a, b) =>
                              stats.byCategory[a[0]] > stats.byCategory[b[0]] ? a : b, ['N/A', 0])[0]}
                        </p>
                        <p className='text-xs text-gray-500 mt-1'>
                           {Object.entries(stats.byCategory).reduce((a, b) =>
                              stats.byCategory[a[0]] > stats.byCategory[b[0]] ? a : b, ['', 0])[1]} reports
                        </p>
                     </div>
                     <div className='w-12 h-12 bg-purple-100 flex items-center justify-center'>
                        <TrendingUp className='w-6 h-6 text-purple-600' />
                     </div>
                  </div>
               </div>
            </div>

            {/* Filters Bar */}
            <div className='bg-white shadow-sm border border-gray-100 p-6'>
               <div className='flex flex-wrap gap-4 items-center'>
                  <div className='flex items-center gap-2'>
                     <Filter size={18} className='text-gray-500' />
                     <span className='font-medium text-gray-700'>Filters</span>
                  </div>

                  <div className='flex gap-3'>
                     <select
                        value={filters.category}
                        onChange={(e) => handleFilterChange('category', e.target.value)}
                        className='px-4 py-2 border border-gray-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                     >
                        <option value="">All Categories</option>
                        <option value="Bug">Bug</option>
                        <option value="Suggestion">Suggestion</option>
                        <option value="Complaint">Complaint</option>
                        <option value="Praise">Praise</option>
                     </select>

                     <select
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className='px-4 py-2 border border-gray-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                     >
                        <option value="">All Status</option>
                        <option value="New">New</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                     </select>

                     <select
                        value={filters.priority}
                        onChange={(e) => handleFilterChange('priority', e.target.value)}
                        className='px-4 py-2 border border-gray-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                     >
                        <option value="">All Priorities</option>
                        <option value="Critical">Critical</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                     </select>
                  </div>

                  <div className='flex items-center gap-2 flex-1 max-w-md'>
                     <Search size={18} className='text-gray-400' />
                     <input
                        type="text"
                        placeholder="Search feedback messages..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        className='flex-1 px-4 py-2 border border-gray-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                     />
                  </div>

                  <button
                     onClick={clearFilters}
                     className='px-4 py-2 bg-indigo-600 text-white text-sm hover:bg-indigo-700 transition-colors font-medium'
                  >
                     Clear All
                  </button>
               </div>
            </div>

            {/* Feedback Table */}
            <div className='bg-white shadow-sm border border-gray-100 overflow-hidden'>
               <div className='px-6 py-4 border-b border-gray-200'>
                  <h2 className='text-lg font-semibold text-gray-800'>Feedback Entries</h2>
               </div>

               <div className='overflow-x-auto'>
                  <table className='w-full'>
                     <thead className='bg-gray-50'>
                        <tr>
                           <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                              <button
                                 onClick={() => handleSort('_id')}
                                 className='flex items-center gap-1 hover:text-gray-700'
                              >
                                 ID
                                 <ArrowUpDown size={12} />
                              </button>
                           </th>
                           <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                              Message
                           </th>
                           <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                              Category
                           </th>
                           <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                              Status
                           </th>
                           <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                              Priority
                           </th>
                           <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                              Location
                           </th>
                           <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                              <button
                                 onClick={() => handleSort('createdAt')}
                                 className='flex items-center gap-1 hover:text-gray-700'
                              >
                                 Created
                                 <ArrowUpDown size={12} />
                              </button>
                           </th>
                           <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                              Actions
                           </th>
                        </tr>
                     </thead>
                     <tbody className='bg-white divide-y divide-gray-200'>
                        {isLoading ? (
                           <tr>
                              <td colSpan="8" className='px-6 py-12 text-center text-gray-500'>
                                 <div className='flex items-center justify-center'>
                                    <div className='animate-spin h-6 w-6 border-b-2 border-indigo-600'></div>
                                    <span className='ml-2'>Loading feedback...</span>
                                 </div>
                              </td>
                           </tr>
                        ) : sortedFeedbacks.length > 0 ? (
                           sortedFeedbacks.map((feedback) => (
                              <tr key={feedback._id} className='hover:bg-gray-50 transition-colors'>
                                 <td className='px-6 py-4 whitespace-nowrap'>
                                    <div className='text-sm font-medium text-gray-900'>
                                       FB-{feedback._id.slice(-6).toUpperCase()}
                                    </div>
                                 </td>
                                 <td className='px-6 py-4'>
                                    <div className='text-sm text-gray-900 max-w-xs truncate'>
                                       {feedback.message}
                                    </div>
                                    {feedback.pageSection && (
                                       <div className='text-xs text-gray-500 mt-1'>
                                          Section: {feedback.pageSection}
                                       </div>
                                    )}
                                 </td>
                                 <td className='px-6 py-4 whitespace-nowrap'>
                                    <span className={`inline-flex px-2 py-1 text-xs font-medium border ${getCategoryColor(feedback.category)}`}>
                                       {feedback.category}
                                    </span>
                                 </td>
                                 <td className='px-6 py-4 whitespace-nowrap'>
                                    <span className={`inline-flex px-2 py-1 text-xs font-medium  border ${getStatusColor(feedback.status)}`}>
                                       {feedback.status}
                                    </span>
                                 </td>
                                 <td className='px-6 py-4 whitespace-nowrap'>
                                    <span className={`inline-flex px-2 py-1 text-xs font-medium ${getPriorityColor(feedback.priority)}`}>
                                       {feedback.priority}
                                    </span>
                                 </td>
                                 <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                                    {feedback.kioskLocation || 'Unknown'}
                                 </td>
                                 <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                                    {formatDate(feedback.createdAt)}
                                 </td>
                                 <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                                    <button
                                       onClick={() => viewDetails(feedback)}
                                       className='text-indigo-600 hover:text-indigo-900 p-1  hover:bg-indigo-50 transition-colors'
                                       title="View Details"
                                    >
                                       <Eye size={16} />
                                    </button>
                                 </td>
                                 <select
                                    value={feedback.status}
                                    onChange={(e) => handleStatusChange(feedback._id, e.target.value)}
                                    className='mt-2 border text-xs rounded px-2 py-1 focus:outline-none focus:ring focus:border-indigo-500'
                                 >
                                    <option value="New">New</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Resolved">Resolved</option>
                                 </select>
                              </tr>
                           ))
                        ) : (
                           <tr>
                              <td colSpan="8" className='px-6 py-12 text-center text-gray-500'>
                                 <MessageSquare className='mx-auto h-12 w-12 text-gray-400 mb-4' />
                                 <p className='text-lg font-medium'>No feedback found</p>
                                 <p className='text-sm'>Try adjusting your filters to see more results.</p>
                              </td>
                           </tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>

         {/* Detail Modal */}
         {showDetailModal && selectedFeedback && (
            <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
               <div className='bg-white shadow-xl max-w-3xl w-full max-h-[90vh] overflow-auto'>
                  <div className='px-6 py-4 border-b border-gray-200 flex justify-between items-center'>
                     <h3 className='text-xl font-semibold text-gray-800'>Feedback Details</h3>
                     <button
                        onClick={() => setShowDetailModal(false)}
                        className='text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 transition-colors'
                     >
                        <XCircle size={20} />
                     </button>
                  </div>

                  <div className='p-6 space-y-6'>
                     <div className='grid grid-cols-2 gap-6'>
                        <div>
                           <label className='block text-sm font-medium text-gray-700 mb-1'>Feedback ID</label>
                           <p className='text-sm text-gray-900 font-mono bg-gray-50 px-3 py-2 '>
                              FB-{selectedFeedback._id.slice(-6).toUpperCase()}
                           </p>
                        </div>
                        <div>
                           <label className='block text-sm font-medium text-gray-700 mb-1'>Category</label>
                           <span className={`inline-flex px-3 py-1 text-sm font-medium border ${getCategoryColor(selectedFeedback.category)}`}>
                              {selectedFeedback.category}
                           </span>
                        </div>
                        <div>
                           <label className='block text-sm font-medium text-gray-700 mb-1'>Status</label>
                           <span className={`inline-flex px-3 py-1 text-sm font-medium border ${getStatusColor(selectedFeedback.status)}`}>
                              {selectedFeedback.status}
                           </span>
                        </div>
                        <div>
                           <label className='block text-sm font-medium text-gray-700 mb-1'>Priority</label>
                           <span className={`inline-flex px-3 py-1 text-sm font-medium ${getPriorityColor(selectedFeedback.priority)}`}>
                              {selectedFeedback.priority}
                           </span>
                        </div>
                     </div>

                     <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Message</label>
                        <div className='bg-gray-50 p-4 border'>
                           <p className='text-gray-900 leading-relaxed'>{selectedFeedback.message}</p>
                        </div>
                     </div>

                     <div className='grid grid-cols-2 gap-6'>
                        <div>
                           <label className='block text-sm font-medium text-gray-700 mb-1'>Kiosk Location</label>
                           <p className='text-sm text-gray-900'>{selectedFeedback.kioskLocation || 'Not specified'}</p>
                        </div>
                        <div>
                           <label className='block text-sm font-medium text-gray-700 mb-1'>Page Section</label>
                           <p className='text-sm text-gray-900'>{selectedFeedback.pageSection || 'Not specified'}</p>
                        </div>
                     </div>

                     {(selectedFeedback.userEmail || selectedFeedback.userPhone) && (
                        <div className='grid grid-cols-2 gap-6'>
                           {selectedFeedback.userEmail && (
                              <div>
                                 <label className='block text-sm font-medium text-gray-700 mb-1'>Email</label>
                                 <p className='text-sm text-gray-900'>{selectedFeedback.userEmail}</p>
                              </div>
                           )}
                           {selectedFeedback.userPhone && (
                              <div>
                                 <label className='block text-sm font-medium text-gray-700 mb-1'>Phone</label>
                                 <p className='text-sm text-gray-900'>{selectedFeedback.userPhone}</p>
                              </div>
                           )}
                        </div>
                     )}

                     <div className='grid grid-cols-2 gap-6 pt-4 border-t border-gray-200'>
                        <div>
                           <label className='block text-sm font-medium text-gray-700 mb-1'>Created</label>
                           <p className='text-sm text-gray-900'>{formatDate(selectedFeedback.createdAt)}</p>
                        </div>
                        <div>
                           <label className='block text-sm font-medium text-gray-700 mb-1'>Last Updated</label>
                           <p className='text-sm text-gray-900'>{formatDate(selectedFeedback.updatedAt)}</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default UserFeedback;
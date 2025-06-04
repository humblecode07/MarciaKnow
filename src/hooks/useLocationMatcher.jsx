// hooks/useLocationMatcher.js
import { useCallback, useMemo } from 'react';
import {
   processAILocationResponse,
   findBestMatch,
   suggestAlternatives,
   getConfidenceLevel
} from '../services/locationService';

/**
 * Custom hook for location matching functionality
 */
export const useLocationMatcher = (buildings, rooms) => {
   // Memoize the processed data
   const processedBuildings = useMemo(() => buildings || [], [buildings]);
   const processedRooms = useMemo(() => rooms || [], [rooms]);

   // Process AI location detection
   const processAILocation = useCallback((locationData) => {
      return processAILocationResponse(locationData, processedBuildings, processedRooms);
   }, [processedBuildings, processedRooms]);

   // Find any location match
   const findLocation = useCallback((searchTerm, threshold = 0.6) => {
      return findBestMatch(searchTerm, processedBuildings, processedRooms, threshold);
   }, [processedBuildings, processedRooms]);

   // Get suggestions for a search term
   const getSuggestions = useCallback((searchTerm, maxSuggestions = 3) => {
      return suggestAlternatives(searchTerm, processedBuildings, processedRooms, maxSuggestions);
   }, [processedBuildings, processedRooms]);

   // Check if data is available
   const isDataReady = useMemo(() => {
      return processedBuildings.length > 0 || processedRooms.length > 0;
   }, [processedBuildings, processedRooms]);

   return {
      processAILocation,
      findLocation,
      getSuggestions,
      isDataReady,
      getConfidenceLevel
   };
};
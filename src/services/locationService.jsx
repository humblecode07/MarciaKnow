// services/locationService.js

/**
 * Normalize search terms for better matching
 */
export const normalizeSearchTerm = (term) => {
   return term.toLowerCase().trim()
      .replace(/\s+/g, ' ') // normalize spaces
      .replace(/building/gi, 'bldg') // normalize building abbreviations
      .replace(/bldg\.?/gi, 'building'); // handle both forms
};

/**
 * Calculate string similarity score using Levenshtein distance
 */
export const calculateSimilarity = (str1, str2) => {
   const s1 = normalizeSearchTerm(str1);
   const s2 = normalizeSearchTerm(str2);

   // Exact match
   if (s1 === s2) return 1.0;

   // Contains match
   if (s1.includes(s2) || s2.includes(s1)) return 0.8;

   // Simple Levenshtein distance approximation
   const maxLen = Math.max(s1.length, s2.length);
   const distance = levenshteinDistance(s1, s2);
   return 1 - (distance / maxLen);
};

/**
 * Levenshtein distance algorithm
 */
const levenshteinDistance = (str1, str2) => {
   const matrix = [];
   for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
   }
   for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
   }
   for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
         if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
            matrix[i][j] = matrix[i - 1][j - 1];
         } else {
            matrix[i][j] = Math.min(
               matrix[i - 1][j - 1] + 1,
               matrix[i][j - 1] + 1,
               matrix[i - 1][j] + 1
            );
         }
      }
   }
   return matrix[str2.length][str1.length];
};

/**
 * Find best building match
 */
export const findBuildingMatch = (searchTerm, buildings, threshold = 0.6) => {
   if (!searchTerm || !buildings?.length) return null;

   let bestMatch = null;
   let bestScore = 0;

   for (const building of buildings) {
      const nameScore = building.name ?
         calculateSimilarity(searchTerm, building.name) : 0;
      const codeScore = building.code ?
         calculateSimilarity(searchTerm, building.code) : 0;
      const descScore = building.description ?
         calculateSimilarity(searchTerm, building.description) : 0;

      const maxScore = Math.max(nameScore, codeScore, descScore);

      if (maxScore > bestScore && maxScore >= threshold) {
         bestScore = maxScore;
         bestMatch = {
            item: building,
            score: maxScore,
            matchedField: nameScore === maxScore ? 'name' :
               codeScore === maxScore ? 'code' : 'description'
         };
      }
   }

   return bestMatch;
};

/**
 * Find best room match
 */
export const findRoomMatch = (searchTerm, rooms, threshold = 0.6) => {
   if (!searchTerm || !rooms?.length) return null;

   let bestMatch = null;
   let bestScore = 0;

   for (const room of rooms) {
      const nameScore = room.name ?
         calculateSimilarity(searchTerm, room.name) : 0;
      const numberScore = room.number ?
         calculateSimilarity(searchTerm, room.number) : 0;
      const buildingScore = room.building ?
         calculateSimilarity(searchTerm, room.building) : 0;
      const descScore = room.description ?
         calculateSimilarity(searchTerm, room.description) : 0;

      const maxScore = Math.max(nameScore, numberScore, buildingScore, descScore);

      if (maxScore > bestScore && maxScore >= threshold) {
         bestScore = maxScore;
         bestMatch = {
            item: room,
            score: maxScore,
            matchedField: nameScore === maxScore ? 'name' :
               numberScore === maxScore ? 'number' :
                  buildingScore === maxScore ? 'building' : 'description'
         };
      }
   }

   return bestMatch;
};

/**
 * Find best match regardless of type
 */
export const findBestMatch = (searchTerm, buildings, rooms, threshold = 0.6) => {
   const buildingMatch = findBuildingMatch(searchTerm, buildings, threshold);
   const roomMatch = findRoomMatch(searchTerm, rooms, threshold);

   if (!buildingMatch && !roomMatch) return null;
   if (!buildingMatch) return { ...roomMatch, type: 'room' };
   if (!roomMatch) return { ...buildingMatch, type: 'building' };

   // Return the one with higher score
   return buildingMatch.score >= roomMatch.score ?
      { ...buildingMatch, type: 'building' } :
      { ...roomMatch, type: 'room' };
};

/**
 * Get confidence level based on score
 */
export const getConfidenceLevel = (score) => {
   if (score >= 0.9) return 'high';
   if (score >= 0.7) return 'medium';
   return 'low';
};

/**
 * Suggest alternatives for failed matches
 */
export const suggestAlternatives = (searchTerm, buildings, rooms, maxSuggestions = 3) => {
   const allItems = [
      ...(buildings || []).map(b => ({
         ...b,
         type: 'building',
         displayName: b.name || b.code
      })),
      ...(rooms || []).map(r => ({
         ...r,
         type: 'room',
         displayName: r.name || r.number
      }))
   ];

   const suggestions = allItems
      .map(item => ({
         ...item,
         score: calculateSimilarity(searchTerm, item.displayName)
      }))
      .filter(item => item.score > 0.3) // minimum threshold for suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSuggestions);

   return suggestions;
};

/**
 * Validate location data structure
 */
export const validateLocationData = (locationData) => {
   if (!locationData) return false;

   const requiredFields = ['name', 'type', 'confidence', 'action'];
   return requiredFields.every(field => locationData.hasOwnProperty(field));
};

/**
 * Process AI location response and find matches
 */
export const processAILocationResponse = (locationData, buildings, rooms) => {
   if (!validateLocationData(locationData)) {
      console.warn('Invalid location data structure:', locationData);
      return null;
   }

   const { name, type, confidence, action } = locationData;
   let match = null;

   // Try to find exact match based on specified type
   if (type === 'building') {
      match = findBuildingMatch(name, buildings);
      if (match) match.type = 'building';
   } else if (type === 'room') {
      match = findRoomMatch(name, rooms);
      if (match) match.type = 'room';
   } else {
      // Type not specified, search both
      match = findBestMatch(name, buildings, rooms);
   }

   if (match) {
      return {
         ...match,
         originalQuery: name,
         aiConfidence: confidence,
         action: action,
         finalConfidence: getConfidenceLevel(match.score)
      };
   }

   // No match found, suggest alternatives
   const alternatives = suggestAlternatives(name, buildings, rooms);

   return {
      item: null,
      score: 0,
      type: null,
      originalQuery: name,
      aiConfidence: confidence,
      action: action,
      finalConfidence: 'none',
      suggestions: alternatives
   };
};
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3'
import BlackXIcon from '../assets/Icons/BlackXIcon';
import AddIcon from '../assets/Icons/AddIcon';
import { v4 as uuidv4 } from 'uuid'
import NavigationIconsModal from '../modals/NavigationIconsModal';

const GRID_SIZE = 10; // Smaller grid for finer control (reduced from 20)
const MIN_BUILDING_SIZE = 600; // Increased from 200 to 600 for much larger buildings

export default function BuildingLayoutBuilder({ building = { path: "M 50 50 L 450 50 L 450 350 L 300 350 L 300 250 L 200 250 L 200 350 L 50 350 Z" }, navigationIcons, floors, setFloors, buildingData, setBuilding, modeType, room, setRoom, setViewMode, width, height }) {

   const [selectedRoomIndex, setSelectedRoomIndex] = useState(null);
   const [draggedRoomIndex, setDraggedRoomIndex] = useState(null);
   const [isDragging, setIsDragging] = useState(false);
   const [resizingRoomIndex, setResizingRoomIndex] = useState(null);
   const [isResizing, setIsResizing] = useState(false);
   const [viewBox, setViewBox] = useState('0 0 1000 1000');
   const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
   const [scaledBuildingPath, setScaledBuildingPath] = useState(building.path);
   const pathRef = useRef(null);

   const [currentFloor, setCurrentFloor] = useState(room?.floor || 1);

   // rooms state is now derived from floors[currentFloor]
   const rooms = floors[currentFloor] || [];

   const [mode, setMode] = useState("placeRoom"); // or "drawPath"
   const [currentPathPoints, setCurrentPathPoints] = useState([]);

   console.log(room);

   const [zoom, setZoom] = useState(1);
   const [panX, setPanX] = useState(0);
   const [panY, setPanY] = useState(0);
   const [isPanning, setIsPanning] = useState(false);
   const [panStart, setPanStart] = useState({ x: 0, y: 0 });

   const [showFloorDropdown, setShowFloorDropdown] = useState(false);

   // Add this helper function to get viewBox bounds
   const getViewBoxBounds = () => {
      const [x, y, width, height] = viewBox.split(' ').map(Number);
      return { x, y, width, height };
   };

   const svgRef = useRef(null);

   // Logging function for data changes
   const logDataForSchema = (action, data) => {
      console.log('=== SCHEMA DATA LOG ===');
      console.log('Action:', action);
      console.log('Timestamp:', new Date().toISOString());
      console.log('Current Floor:', currentFloor);
      console.log('All Floors Data:', floors);
      console.log('Specific Change Data:', data);
      console.log('======================');
   };

   // Scale building if it's too small
   const scaleBuildingIfNeeded = (path) => {
      // Extract all coordinates from the path
      const coords = path.match(/[\d.-]+/g)?.map(Number) || [];
      if (coords.length < 4) return path;

      // Calculate bounding box manually
      const xCoords = coords.filter((_, i) => i % 2 === 0);
      const yCoords = coords.filter((_, i) => i % 2 === 1);

      const minX = Math.min(...xCoords);
      const maxX = Math.max(...xCoords);
      const minY = Math.min(...yCoords);
      const maxY = Math.max(...yCoords);

      const width = maxX - minX;
      const height = maxY - minY;
      const maxDimension = Math.max(width, height);

      if (maxDimension < MIN_BUILDING_SIZE) {
         const scaleFactor = MIN_BUILDING_SIZE / maxDimension;
         const centerX = minX + width / 2;
         const centerY = minY + height / 2;

         // Scale all coordinates
         return path.replace(/[\d.-]+/g, (match, offset, string) => {
            const allMatches = string.match(/[\d.-]+/g);
            const index = allMatches.indexOf(match);
            const coord = parseFloat(match);

            if (index % 2 === 0) { // x coordinate
               const scaledX = centerX + (coord - centerX) * scaleFactor;
               return scaledX.toFixed(2);
            } else { // y coordinate
               const scaledY = centerY + (coord - centerY) * scaleFactor;
               return scaledY.toFixed(2);
            }
         });
      }

      return path;
   };

   useEffect(() => {
      if (pathRef.current) {
         const scaledPath = scaleBuildingIfNeeded(building.path);
         setScaledBuildingPath(scaledPath);

         const bbox = pathRef.current.getBBox();
         const padding = 100; // Increased padding from 50 to 100 for more space
         setViewBox(`${bbox.x - padding} ${bbox.y - padding} ${bbox.width + padding * 2} ${bbox.height + padding * 2}`);
      }
   }, [building?.path]);

   // Reset selectedRoomIndex when currentFloor changes
   useEffect(() => {
      setSelectedRoomIndex(null);
   }, [currentFloor]);

   // Log data changes whenever floors state changes
   useEffect(() => {
      if (Object.keys(floors).length > 0 && floors[1].length > 0) {
         logDataForSchema('FLOORS_UPDATED', floors);
      }
   }, [floors]);

   const addRoom = (x = null, y = null) => {
      let roomX = x;
      let roomY = y;

      if (x === null || y === null) {
         if (pathRef.current) {
            const bbox = pathRef.current.getBBox();
            // Start from center and try to find a valid position
            const centerX = bbox.x + bbox.width / 2;
            const centerY = bbox.y + bbox.height / 2;

            // Try center first
            const testPoint = { x: centerX, y: centerY };
            if (pathRef.current.isPointInFill(testPoint)) {
               roomX = snapToGrid(centerX - GRID_SIZE * 3); // Center the room
               roomY = snapToGrid(centerY - GRID_SIZE * 2);
            } else {
               // Find first valid point by scanning
               let found = false;
               for (let testY = bbox.y + 20; testY < bbox.y + bbox.height - 20 && !found; testY += 20) {
                  for (let testX = bbox.x + 20; testX < bbox.x + bbox.width - 20 && !found; testX += 20) {
                     const testPt = { x: testX, y: testY };
                     if (pathRef.current.isPointInFill(testPt)) {
                        roomX = snapToGrid(testX);
                        roomY = snapToGrid(testY);
                        found = true;
                     }
                  }
               }

               if (!found) {
                  alert("No suitable space found inside the building. Try manually placing the room.");
                  return;
               }
            }
         } else {
            roomX = 100;
            roomY = 100;
         }
      }

      const newRoom = {
         id: `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
         x: roomX,
         y: roomY,
         width: GRID_SIZE * 6,
         height: GRID_SIZE * 4,
         label: `Room ${rooms.length + 1}`,
         description: "",
         color: d3.schemeCategory10[rooms.length % 10],
         floor: currentFloor,
         navigationPath: [],
         navigationGuide: [], // ADD THIS LINE
         imageIds: [],
         createdAt: new Date().toISOString()
      }

      setFloors((prev) => {
         const updated = { ...prev };
         const floorRooms = updated[currentFloor] || [];
         updated[currentFloor] = [...floorRooms, newRoom];
         return updated;
      });

      logDataForSchema('ROOM_ADDED', newRoom);
   };

   const updateRoom = (roomIndex, updates) => {
      setFloors(prev => {
         const updatedFloors = { ...prev };
         const currentRooms = [...updatedFloors[currentFloor]];
         currentRooms[roomIndex] = {
            ...currentRooms[roomIndex],
            ...updates,
            updatedAt: new Date().toISOString()
         };
         updatedFloors[currentFloor] = currentRooms;
         return updatedFloors;
      });

      logDataForSchema('ROOM_UPDATED', { roomIndex, updates });
   };

   const deleteRoom = (roomIndex) => {
      const roomToDelete = rooms[roomIndex];
      setFloors(prev => {
         const updatedFloors = { ...prev };
         const currentRooms = [...updatedFloors[currentFloor]];
         currentRooms.splice(roomIndex, 1);
         updatedFloors[currentFloor] = currentRooms;
         return updatedFloors;
      });

      logDataForSchema('ROOM_DELETED', { roomIndex, deletedRoom: roomToDelete });
      setSelectedRoomIndex(null);
   };

   const addFloor = () => {
      const newFloorNumber = Math.max(...Object.keys(floors).map(Number)) + 1;
      const newFloorData = {
         floorNumber: newFloorNumber,
         rooms: [],
         createdAt: new Date().toISOString()
      };

      setFloors((prev) => ({ ...prev, [newFloorNumber]: [] }));
      setCurrentFloor(newFloorNumber);

      logDataForSchema('FLOOR_ADDED', newFloorData);
   };

   const saveNavigationPath = () => {
      if (selectedRoomIndex !== null && currentPathPoints.length > 0) {
         const pathData = {
            roomIndex: selectedRoomIndex,
            path: currentPathPoints,
            pathLength: currentPathPoints.length,
            createdAt: new Date().toISOString()
         };

         updateRoom(selectedRoomIndex, { navigationPath: currentPathPoints });
         setCurrentPathPoints([]);

         logDataForSchema('NAVIGATION_PATH_SAVED', pathData);
         alert("Path saved!");
      }
   };

   const getSVGPoint = (e, svg) => {
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;

      // Get the current transform matrix and invert it
      const screenCTM = svg.getScreenCTM();
      if (screenCTM) {
         return pt.matrixTransform(screenCTM.inverse());
      }

      // Fallback if getScreenCTM fails
      const rect = svg.getBoundingClientRect();
      return {
         x: (e.clientX - rect.left) / zoom - panX / zoom,
         y: (e.clientY - rect.top) / zoom - panY / zoom
      };
   };
   const snapToGrid = (value) => Math.round(value / GRID_SIZE) * GRID_SIZE;

   const [selectedRoomId, setSelectedRoomId] = useState(room?.id);

   const handleRoomMouseDown = (e, roomIndex) => {
      e.stopPropagation();
      const room = rooms[roomIndex];
      setSelectedRoomId(room.id); // Use room ID instead of index
      setDraggedRoomIndex(roomIndex);
      setIsDragging(true);

      const svg = e.currentTarget.closest('svg');
      const svgP = getSVGPoint(e, svg);

      setDragStart({
         x: svgP.x - room.x,
         y: svgP.y - room.y
      });
   };

   const handleResizeMouseDown = (e, roomIndex) => {
      e.stopPropagation();
      setSelectedRoomIndex(roomIndex);
      setResizingRoomIndex(roomIndex);
      setIsResizing(true);
   };

   const handleMouseDown = (e) => {
      // Only start panning if not in a specific mode and not clicking on interactive elements
      if (mode === "drawPath" || isDragging || isResizing) return;

      // Check if we're clicking on a room or other interactive element
      const target = e.target;
      if (target.closest('[data-room]') || target.closest('[data-resize-handle]')) return;

      setIsPanning(true);
      const rect = e.currentTarget.getBoundingClientRect();
      setPanStart({
         x: e.clientX - rect.left - panX,
         y: e.clientY - rect.top - panY
      });
   };



   const handleMouseUp = () => {
      setIsDragging(false);
      setDraggedRoomIndex(null);
      setIsResizing(false);
      setResizingRoomIndex(null);
      setIsPanning(false);
   };

   const handleWheel = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.1, Math.min(5, zoom * delta));

      // Zoom towards mouse position
      const zoomRatio = newZoom / zoom;
      const newPanX = mouseX - (mouseX - panX) * zoomRatio;
      const newPanY = mouseY - (mouseY - panY) * zoomRatio;

      setZoom(newZoom);
      setPanX(newPanX);
      setPanY(newPanY);
   };

   // Add this to your existing state declarations
   const [buildingElements, setBuildingElements] = useState(buildingData.stairs || {});
   const [selectedElementIndex, setSelectedElementIndex] = useState(null);
   const [elementMode, setElementMode] = useState("room"); // "room" or "stairs"

   // Add building element functions
   const addStairs = (x = null, y = null) => {
      let stairX = x;
      let stairY = y;

      if (x === null || y === null) {
         if (pathRef.current) {
            const bbox = pathRef.current.getBBox();
            const centerX = bbox.x + bbox.width / 2;
            const centerY = bbox.y + bbox.height / 2;

            const testPoint = { x: centerX, y: centerY };
            if (pathRef.current.isPointInFill(testPoint)) {
               stairX = snapToGrid(centerX - GRID_SIZE * 2);
               stairY = snapToGrid(centerY - GRID_SIZE * 3);
            } else {
               let found = false;
               for (let testY = bbox.y + 20; testY < bbox.y + bbox.height - 20 && !found; testY += 20) {
                  for (let testX = bbox.x + 20; testX < bbox.x + bbox.width - 20 && !found; testX += 20) {
                     const testPt = { x: testX, y: testY };
                     if (pathRef.current.isPointInFill(testPt)) {
                        stairX = snapToGrid(testX);
                        stairY = snapToGrid(testY);
                        found = true;
                     }
                  }
               }

               if (!found) {
                  alert("No suitable space found inside the building. Try manually placing the stairs.");
                  return;
               }
            }
         } else {
            stairX = 150;
            stairY = 150;
         }
      }

      const newStairs = {
         id: `stairs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
         type: 'stairs',
         x: stairX,
         y: stairY,
         width: GRID_SIZE * 4,
         height: GRID_SIZE * 6,
         label: `Stairs ${Object.values(buildingElements[currentFloor] || {}).filter(el => el.type === 'stairs').length + 1}`,
         floor: currentFloor,
         direction: 'up',
         createdAt: new Date().toISOString()
      };

      // Update both states simultaneously
      setBuildingElements(prev => {
         const updated = { ...prev };
         const floorElements = updated[currentFloor] || {};
         updated[currentFloor] = { ...floorElements, [newStairs.id]: newStairs };
         return updated;
      });

      setBuilding(prev => ({
         ...prev,
         stairs: {
            ...prev.stairs,
            [currentFloor]: {
               ...prev.stairs?.[currentFloor],
               [newStairs.id]: newStairs
            }
         }
      }));

      logDataForSchema('STAIRS_ADDED', newStairs);
   };

   const updateBuildingElement = (elementId, updates) => {
      const updatedElement = {
         ...buildingElements[currentFloor]?.[elementId],
         ...updates,
         updatedAt: new Date().toISOString()
      };

      // Update buildingElements state
      setBuildingElements(prev => {
         const updated = { ...prev };
         const floorElements = { ...updated[currentFloor] };
         floorElements[elementId] = updatedElement;
         updated[currentFloor] = floorElements;
         return updated;
      });

      // Update building.stairs state (sync both states)
      setBuilding(prev => ({
         ...prev,
         stairs: {
            ...prev.stairs,
            [currentFloor]: {
               ...prev.stairs?.[currentFloor],
               [elementId]: updatedElement
            }
         }
      }));

      logDataForSchema('BUILDING_ELEMENT_UPDATED', { elementId, updates });
   };

   const deleteBuildingElement = (elementId) => {
      const elementToDelete = buildingElements[currentFloor]?.[elementId];

      // Remove from buildingElements state
      setBuildingElements(prev => {
         const updated = { ...prev };
         const floorElements = { ...updated[currentFloor] };
         delete floorElements[elementId];
         updated[currentFloor] = floorElements;
         return updated;
      });

      // Remove from building.stairs state
      setBuilding(prev => {
         const updatedStairs = { ...prev.stairs };
         if (updatedStairs[currentFloor]) {
            const floorStairs = { ...updatedStairs[currentFloor] };
            delete floorStairs[elementId];
            updatedStairs[currentFloor] = floorStairs;
         }

         return {
            ...prev,
            stairs: updatedStairs
         };
      });

      logDataForSchema('BUILDING_ELEMENT_DELETED', { elementId, deletedElement: elementToDelete });
      setSelectedElementIndex(null);
   };

   // Update handleSvgClick to handle element placement
   const handleSvgClickUpdated = (e) => {
      if (isPanning || isDragging || isResizing) return;

      const svg = e.currentTarget;
      const svgP = getSVGPoint(e, svg);

      if (!pathRef.current || !pathRef.current.isPointInFill(svgP)) return;

      if (mode === "drawPath" && selectedRoomIndex !== null) {
         setCurrentPathPoints((prev) => [...prev, { x: svgP.x, y: svgP.y }]);
      } else if (elementMode === "stairs") {
         addStairs(snapToGrid(svgP.x - GRID_SIZE * 2), snapToGrid(svgP.y - GRID_SIZE * 3));
      }
   };

   // Add element mouse handlers
   const handleElementMouseDown = (e, elementId) => {
      e.stopPropagation();
      setSelectedElementIndex(elementId);
      setDraggedRoomIndex(elementId);
      setIsDragging(true);

      const svg = e.currentTarget.closest('svg');
      const svgP = getSVGPoint(e, svg);
      const element = buildingElements[currentFloor][elementId];

      setDragStart({
         x: svgP.x - element.x,
         y: svgP.y - element.y
      });
   };

   // Update handleMouseMove to handle element dragging
   const handleMouseMoveUpdated = (e) => {
      const svg = e.currentTarget;

      if (isPanning) {
         const rect = svg.getBoundingClientRect();
         const newPanX = e.clientX - rect.left - panStart.x;
         const newPanY = e.clientY - rect.top - panStart.y;

         setPanX(newPanX);
         setPanY(newPanY);
         return;
      }

      const svgP = getSVGPoint(e, svg);

      if (isDragging && draggedRoomIndex !== null) {
         const newX = snapToGrid(svgP.x - dragStart.x);
         const newY = snapToGrid(svgP.y - dragStart.y);

         // Check if it's a room or building element
         const room = rooms.find((_, i) => i === draggedRoomIndex);
         const element = buildingElements[currentFloor]?.[draggedRoomIndex];

         if (room) {
            // Handle room dragging (existing logic)
            if (pathRef.current) {
               const roomCorners = [
                  { x: newX, y: newY },
                  { x: newX + room.width, y: newY },
                  { x: newX, y: newY + room.height },
                  { x: newX + room.width, y: newY + room.height },
                  { x: newX + room.width / 2, y: newY + room.height / 2 }
               ];

               const allInside = roomCorners.every(corner =>
                  pathRef.current.isPointInFill(corner, pathRef.current)
               );

               if (allInside) {
                  updateRoom(draggedRoomIndex, { x: newX, y: newY });
               }
            }
         } else if (element) {
            // Handle building element dragging
            if (pathRef.current) {
               const elementCorners = [
                  { x: newX, y: newY },
                  { x: newX + element.width, y: newY },
                  { x: newX, y: newY + element.height },
                  { x: newX + element.width, y: newY + element.height },
                  { x: newX + element.width / 2, y: newY + element.height / 2 }
               ];

               const allInside = elementCorners.every(corner =>
                  pathRef.current.isPointInFill(corner, pathRef.current)
               );

               if (allInside) {
                  updateBuildingElement(draggedRoomIndex, { x: newX, y: newY });
               }
            }
         }
      }

      // Handle resizing (existing logic for rooms)
      if (isResizing && resizingRoomIndex !== null) {
         const room = rooms[resizingRoomIndex];
         const newWidth = Math.max(GRID_SIZE * 2, snapToGrid(svgP.x - room.x));
         const newHeight = Math.max(GRID_SIZE * 2, snapToGrid(svgP.y - room.y));

         if (pathRef.current) {
            const testCorners = [
               { x: room.x + newWidth, y: room.y + newHeight },
               { x: room.x + newWidth / 2, y: room.y + newHeight / 2 }
            ];

            const fitsInBuilding = testCorners.every(corner =>
               pathRef.current.isPointInFill(corner, pathRef.current)
            );

            if (fitsInBuilding) {
               updateRoom(resizingRoomIndex, { width: newWidth, height: newHeight });
            }
         } else {
            updateRoom(resizingRoomIndex, { width: newWidth, height: newHeight });
         }
      }
   };

   const addNavigationGuideCard = (roomIndex) => {
      const newGuide = {
         id: uuidv4(),
         icon: navigationIcons?.data?.[0]?.icon || '',
         description: ""
      }
      const currentGuides = rooms[roomIndex].navigationGuide || [];
      updateRoom(roomIndex, { navigationGuide: [...currentGuides, newGuide] });
   }

   const updateNavigationGuideStep = (roomIndex, rule, guideIndex, value) => {
      const currentGuides = [...(rooms[roomIndex].navigationGuide || [])];
      if (rule === "ICON") {
         currentGuides[guideIndex] = { ...currentGuides[guideIndex], icon: value };
      } else if (rule === "DESCRIPTION") {
         currentGuides[guideIndex] = { ...currentGuides[guideIndex], description: value };
      }
      updateRoom(roomIndex, { navigationGuide: currentGuides });
   };

   const removeNavigationGuideCard = (roomIndex, guideId) => {
      const currentGuides = rooms[roomIndex].navigationGuide || [];
      const updatedGuides = currentGuides.filter(guide => guide.id !== guideId);
      updateRoom(roomIndex, { navigationGuide: updatedGuides });
   }

   useEffect(() => {
      if (building?.path) {
         let processedPath = building.path;

         // Check and correct building angle
         const detectedAngle = calculateBuildingAngle(building.path);
         if (Math.abs(detectedAngle) > 2) { // 2 degree tolerance
            processedPath = rotateBuildingPath(building.path, detectedAngle);
            console.log(`Building rotated by ${detectedAngle.toFixed(1)} degrees`);
         }

         // Apply scaling
         const scaledPath = scaleBuildingIfNeeded(processedPath);
         setScaledBuildingPath(scaledPath);

         // Update viewBox after path is processed
         setTimeout(() => {
            // Calculate viewBox from processed path coordinates
            const coords = scaledPath.match(/[\d.-]+/g)?.map(Number) || [];
            if (coords.length >= 4) {
               const xCoords = coords.filter((_, i) => i % 2 === 0);
               const yCoords = coords.filter((_, i) => i % 2 === 1);

               const minX = Math.min(...xCoords);
               const maxX = Math.max(...xCoords);
               const minY = Math.min(...yCoords);
               const maxY = Math.max(...yCoords);

               const width = maxX - minX;
               const height = maxY - minY;
               const padding = 100;

               setViewBox(`${minX - padding} ${minY - padding} ${width + padding * 2} ${height + padding * 2}`);
            }
         }, 0);
      }
   }, [building?.path]);

   useEffect(() => {
      const svg = svgRef.current;
      if (svg) {
         const wheelHandler = (e) => {
            e.preventDefault();
            handleWheel(e);
         };

         svg.addEventListener('wheel', wheelHandler, { passive: false });

         return () => {
            svg.removeEventListener('wheel', wheelHandler);
         };
      }
   }, [zoom, panX, panY]);

   const handleImageUpload = (e, roomIndex) => {
      const files = Array.from(e.target.files);

      // Store actual File objects instead of data URLs
      const newImages = files.map(file => ({
         id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
         name: file.name,
         size: file.size,
         type: file.type,
         file: file, // Store the actual File object for later upload
         previewUrl: URL.createObjectURL(file), // Create preview URL
         uploadedAt: new Date().toISOString()
      }));

      const currentImages = rooms[roomIndex].images || [];

      console.log(newImages);

      updateRoom(roomIndex, { images: [...currentImages, ...newImages] });

      logDataForSchema('IMAGES_SELECTED', { roomIndex, imageCount: newImages.length });
   };


   const deleteImage = (roomIndex, imageId) => {
      const currentImages = rooms[roomIndex].images || [];
      const imageToDelete = currentImages.find(img => img.id === imageId);

      // Revoke the preview URL to free memory
      if (imageToDelete && imageToDelete.previewUrl) {
         URL.revokeObjectURL(imageToDelete.previewUrl);
      }

      const updatedImages = currentImages.filter(img => img.id !== imageId);

      updateRoom(roomIndex, { images: updatedImages });

      logDataForSchema('IMAGE_REMOVED', { roomIndex, imageId });
   };


   // Add this useEffect after your existing useEffects
   useEffect(() => {
      // Initialize buildingElements from buildingData.stairs when component mounts
      if (buildingData?.stairs && Object.keys(buildingElements).length === 0) {
         setBuildingElements(buildingData.stairs);
      }
   }, [buildingData]);

   // useEffect(() => {
   //    if (Object.keys(buildingElements).length > 0) {
   //       setBuilding(prev => ({
   //          ...prev,
   //          stairs: buildingElements
   //       }));
   //    }
   // }, [buildingElements]);

   console.log(selectedRoomId)

   return (
      <div className="h-full flex flex-col gap-4 font-roboto" style={{ userSelect: (isDragging || isResizing) ? 'none' : 'auto', width: width }}>

         {modeType !== import.meta.env.VITE_TEST_KIOSK ?
            <>
               <div>
                  <span className="font-bold text-lg">Building Layout Builder</span>
                  <p className="text-sm text-gray-500">
                     Use the buttons to place rooms and building elements, or switch to path drawing mode to create navigation paths.
                  </p>
               </div>
               <div className="flex flex-wrap gap-3 items-center p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                  <div className="flex gap-2">
                     <button
                        onClick={() => {
                           setElementMode("room");
                           addRoom();
                        }}
                        className={`px-4 py-2 text-sm rounded-md hover:opacity-90 font-medium transition-all ${elementMode === "room"
                           ? 'bg-indigo-600 text-white shadow-sm'
                           : 'bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100'
                           }`}
                     >
                        + Add Room
                     </button>
                     <button
                        onClick={() => {
                           setElementMode("stairs");
                           if (elementMode !== "stairs") {
                              alert("Click inside the building to place stairs");
                           }
                        }}
                        className={`px-4 py-2 text-sm rounded-md hover:opacity-90 font-medium transition-all ${elementMode === "stairs"
                           ? 'bg-orange-500 text-white shadow-sm'
                           : 'bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100'
                           }`}
                     >
                        + Add Stairs
                     </button>
                     <button
                        onClick={() => setMode("drawPath")}
                        className={`px-4 py-2 text-sm rounded-md font-medium transition-all ${mode === "drawPath"
                           ? 'bg-emerald-500 text-white shadow-sm'
                           : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                           }`}
                     >
                        Draw Navigation Path
                     </button>
                  </div>

                  <div className="flex gap-3 items-center">
                     <label className="text-sm font-medium text-gray-700">Floor:</label>
                     <select
                        value={currentFloor}
                        onChange={(e) => setCurrentFloor(parseInt(e.target.value))}
                        className="border border-gray-200 px-3 py-2 text-sm rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                     >
                        {Object.keys(floors).map((floor) => (
                           <option key={floor} value={floor}>
                              Floor {floor}
                           </option>
                        ))}
                     </select>
                     <button
                        className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium transition-colors shadow-sm"
                        onClick={addFloor}
                     >
                        + Add Floor
                     </button>
                  </div>
               </div>
            </>
            : null}
         {building?.path && (
            <>
               <svg
                  ref={svgRef}
                  viewBox={viewBox}
                  width={'100%'}
                  height={height}
                  onClick={handleSvgClickUpdated}
                  onMouseDown={handleMouseDown}
                  className={`border border-gray-200 bg-gray-50 rounded-lg shadow-sm ${mode === "drawPath" ? 'cursor-pointer' :
                     elementMode === "stairs" ? 'cursor-crosshair' :
                        isPanning ? 'cursor-grabbing' : 'cursor-grab'
                     }`}
                  onMouseMove={handleMouseMoveUpdated}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onWheel={handleWheel}
                  style={{
                     userSelect: 'none',
                     display: 'block'
                  }}
               >
                  <g transform={`translate(${panX}, ${panY}) scale(${zoom})`}>
                  </g>

                  {/* Clip the grid inside the building */}
                  <defs>
                     <clipPath id="building-clip">
                        <path d={scaledBuildingPath} />
                     </clipPath>
                     {/* Add gradient definitions for modern look */}
                     <linearGradient id="roomGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.1" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0.3" />
                     </linearGradient>
                     <linearGradient id="stairsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.1" />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.3" />
                     </linearGradient>
                  </defs>

                  {/* Building outline with modern styling */}
                  <path
                     ref={pathRef}
                     d={scaledBuildingPath}
                     fill="#ffffff"
                     stroke="#6b7280"
                     strokeWidth={2}
                     filter="drop-shadow(0 1px 3px rgba(0, 0, 0, 0.1))"
                  />

                  {/* Refined grid lines */}
                  <g clipPath="url(#building-clip)">
                     {Array.from({ length: Math.ceil(1200 / GRID_SIZE) }).map((_, i) => (
                        <line
                           key={`v-${i}`}
                           x1={i * GRID_SIZE}
                           y1={-200}
                           x2={i * GRID_SIZE}
                           y2={1000}
                           stroke="#f3f4f6"
                           strokeWidth="0.5"
                        />
                     ))}
                     {Array.from({ length: Math.ceil(1200 / GRID_SIZE) }).map((_, i) => (
                        <line
                           key={`h-${i}`}
                           x1={-200}
                           y1={i * GRID_SIZE}
                           x2={1200}
                           y2={i * GRID_SIZE}
                           stroke="#f3f4f6"
                           strokeWidth="0.5"
                        />
                     ))}
                  </g>

                  {/* Modern room rendering */}
                  {rooms.map((room, index) => (
                     <g key={room.id || index}>
                        {/* Room with modern styling */}
                        <rect
                           x={room.x}
                           y={room.y}
                           width={room.width}
                           height={room.height}
                           fill="#6366f1"
                           fillOpacity="0.1"
                           stroke={selectedRoomIndex === index ? "#6366f1" : "#d1d5db"}
                           strokeWidth={selectedRoomIndex === index ? 2 : 1}
                           rx="4"
                           cursor="move"
                           data-room="true"
                           onMouseDown={(e) => handleRoomMouseDown(e, index)}
                           onClick={(e) => {
                              e.stopPropagation();
                              if (!isDragging && !isResizing) {
                                 setSelectedRoomIndex(index);
                                 setSelectedElementIndex(null);
                              }
                              if (modeType === import.meta.env.VITE_TEST_KIOSK) {
                                 console.log(room)
                                 setRoom(room)
                              }
                           }}
                        />

                        {/* Room border accent */}
                        <rect
                           x={room.x}
                           y={room.y}
                           width={room.width}
                           height={4}
                           fill="#6366f1"
                           rx="4"
                           pointerEvents="none"
                        />

                        {/* Room label with modern typography */}
                        <text
                           x={room.x + room.width / 2}
                           y={room.y + room.height / 2 + 2}
                           fontSize="11"
                           textAnchor="middle"
                           fill="#374151"
                           fontWeight="600"
                           pointerEvents="none"
                           style={{ userSelect: 'none', whiteSpace: 'pre' }}
                        >
                           {room.label.split('\n').map((line, i) => (
                              <tspan key={i} x={room.x + room.width / 2} dy={i === 0 ? 0 : 14}>
                                 {line}
                              </tspan>
                           ))}
                        </text>


                        {/* Modern resize handle */}
                        {selectedRoomIndex === index && (
                           <circle
                              cx={room.x + room.width - 4}
                              cy={room.y + room.height - 4}
                              r="4"
                              fill="#6366f1"
                              stroke="#ffffff"
                              strokeWidth="2"
                              cursor="nwse-resize"
                              data-resize-handle="true"
                              onMouseDown={(e) => handleResizeMouseDown(e, index)}
                           />
                        )}

                        {/* Enhanced navigation path */}
                        {selectedRoomId === room.id && room.navigationPath?.length > 1 && (
                           <polyline
                              points={room.navigationPath.map(p => `${p.x},${p.y}`).join(" ")}
                              fill="none"
                              stroke="#10b981"
                              strokeWidth="4"
                              strokeDasharray="8,4"
                              strokeLinecap="round"
                              pointerEvents="none"
                              opacity="0.8"
                           />
                        )}
                     </g>
                  ))}

                  {/* Modern kiosk UI - Fixed to top */}
                  {modeType === import.meta.env.VITE_TEST_KIOSK ?
                     (() => {
                        // Get the actual SVG viewport dimensions
                        const svgElement = svgRef.current;
                        const viewBoxValues = viewBox.split(' ').map(Number);
                        const [viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight] = viewBoxValues;

                        // Calculate top-left position in viewBox coordinates
                        const topX = viewBoxX + 16; // 16px from left edge
                        const topY = viewBoxY + 16; // 16px from top edge

                        return (
                           <g className="floating-ui">
                              {/* Modern Back Button - Fixed to top */}
                              <g
                                 onClick={(e) => {
                                    e.stopPropagation();
                                    setViewMode('campus');
                                    setRoom(null);
                                 }}
                                 style={{ cursor: 'pointer' }}
                              >
                                 <rect
                                    x={topX}
                                    y={topY}
                                    width={80}
                                    height={36}
                                    rx="8"
                                    fill="#ffffff"
                                    stroke="#e5e7eb"
                                    strokeWidth="1"
                                    filter="drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))"
                                 />
                                 <text
                                    x={topX + 40}
                                    y={topY + 22}
                                    fontSize="12"
                                    textAnchor="middle"
                                    fill="#374151"
                                    fontWeight="600"
                                    pointerEvents="none"
                                 >
                                    ← Back
                                 </text>
                              </g>

                              {/* Modern Floor Dropdown - Fixed to top */}
                              <g
                                 onClick={(e) => {
                                    e.stopPropagation();
                                    setShowFloorDropdown(!showFloorDropdown);
                                 }}
                                 style={{ cursor: 'pointer' }}
                              >
                                 <rect
                                    x={topX + 92}
                                    y={topY}
                                    width={100}
                                    height={36}
                                    rx="8"
                                    fill="#ffffff"
                                    stroke="#e5e7eb"
                                    strokeWidth="1"
                                    filter="drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))"
                                 />
                                 <text
                                    x={topX + 142}
                                    y={topY + 22}
                                    fontSize="12"
                                    textAnchor="middle"
                                    fill="#374151"
                                    fontWeight="600"
                                    pointerEvents="none"
                                 >
                                    Floor {currentFloor} ▼
                                 </text>
                              </g>

                              {/* Modern Dropdown Menu - Fixed to top */}
                              {showFloorDropdown && (
                                 <g>
                                    {Object.keys(floors).map((floor, index) => (
                                       <g
                                          key={floor}
                                          onClick={(e) => {
                                             e.stopPropagation();
                                             setCurrentFloor(parseInt(floor));
                                             setShowFloorDropdown(false);
                                          }}
                                          style={{ cursor: 'pointer' }}
                                       >
                                          <rect
                                             x={topX + 92}
                                             y={topY + 40 + (index * 32)}
                                             width={100}
                                             height={32}
                                             rx={index === Object.keys(floors).length - 1 ? "0 0 8 8" : "0"}
                                             fill={parseInt(floor) === currentFloor ? "#f0f9ff" : "#ffffff"}
                                             stroke="#e5e7eb"
                                             strokeWidth="1"
                                          />
                                          <text
                                             x={topX + 142}
                                             y={topY + 60 + (index * 32)}
                                             fontSize="11"
                                             textAnchor="middle"
                                             fill={parseInt(floor) === currentFloor ? "#0369a1" : "#6b7280"}
                                             fontWeight={parseInt(floor) === currentFloor ? "600" : "500"}
                                             pointerEvents="none"
                                          >
                                             Floor {floor}
                                          </text>
                                       </g>
                                    ))}
                                 </g>
                              )}
                           </g>
                        );
                     })()
                     : null}

                  {/* Modern stairs rendering */}
                  {Object.entries(buildingElements[currentFloor] || {}).map(([elementId, element]) => (
                     <g key={elementId}>
                        {element.type === 'stairs' && (
                           <>
                              {/* Modern stairs background */}
                              <rect
                                 x={element.x}
                                 y={element.y}
                                 width={element.width}
                                 height={element.height}
                                 fill="#f59e0b"
                                 fillOpacity="0.15"
                                 stroke={selectedElementIndex === elementId ? "#f59e0b" : "#d1d5db"}
                                 strokeWidth={selectedElementIndex === elementId ? 2 : 1}
                                 rx="4"
                                 cursor="move"
                                 data-element="true"
                                 onMouseDown={(e) => handleElementMouseDown(e, elementId)}
                                 onClick={(e) => {
                                    e.stopPropagation();
                                    if (!isDragging && !isResizing) {
                                       setSelectedElementIndex(elementId);
                                       setSelectedRoomIndex(null);
                                    }
                                 }}
                              />

                              {/* Stairs accent */}
                              <rect
                                 x={element.x}
                                 y={element.y}
                                 width={element.width}
                                 height={4}
                                 fill="#f59e0b"
                                 rx="4"
                                 pointerEvents="none"
                              />

                              {/* Modern stairs steps */}
                              {Array.from({ length: 5 }).map((_, i) => (
                                 <line
                                    key={i}
                                    x1={element.x + 8}
                                    y1={element.y + 12 + (i * (element.height - 16) / 5)}
                                    x2={element.x + element.width - 8}
                                    y2={element.y + 12 + (i * (element.height - 16) / 5)}
                                    stroke="#f59e0b"
                                    strokeWidth="1.5"
                                    strokeOpacity="0.6"
                                    pointerEvents="none"
                                 />
                              ))}

                              {/* Modern direction arrow */}
                              <polygon
                                 points={element.direction === 'up'
                                    ? `${element.x + element.width / 2},${element.y + 8} ${element.x + element.width / 2 - 4},${element.y + 16} ${element.x + element.width / 2 + 4},${element.y + 16}`
                                    : `${element.x + element.width / 2},${element.y + element.height - 8} ${element.x + element.width / 2 - 4},${element.y + element.height - 16} ${element.x + element.width / 2 + 4},${element.y + element.height - 16}`
                                 }
                                 fill="#f59e0b"
                                 pointerEvents="none"
                              />

                              {/* Modern stairs label */}
                              <text
                                 x={element.x + element.width / 2}
                                 y={element.y + element.height - 8}
                                 fontSize="10"
                                 textAnchor="middle"
                                 fill="#92400e"
                                 fontWeight="600"
                                 pointerEvents="none"
                                 style={{ userSelect: 'none' }}
                              >
                                 {element.label}
                              </text>
                           </>
                        )}
                     </g>
                  ))}

                  {/* Modern path drawing */}
                  {mode === "drawPath" && currentPathPoints.length > 0 && (
                     <polyline
                        points={currentPathPoints.map(p => `${p.x},${p.y}`).join(" ")}
                        fill="none"
                        stroke="#8b5cf6"
                        strokeWidth="3"
                        strokeDasharray="6,3"
                        strokeLinecap="round"
                        pointerEvents="none"
                        opacity="0.8"
                     />
                  )}
               </svg>

               {/* Modern path controls */}
               {mode === "drawPath" && selectedRoomIndex !== null && (
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg shadow-sm">
                     <p className="text-sm text-purple-800 mb-3 font-medium">
                        Click inside the building to add points to the navigation path for <span className="font-semibold">{rooms[selectedRoomIndex]?.label}</span>
                     </p>
                     <div className="flex gap-2">
                        {currentPathPoints.length > 0 && (
                           <button
                              className="px-4 py-2 text-sm bg-emerald-500 text-white rounded-md hover:bg-emerald-600 font-medium transition-colors shadow-sm"
                              onClick={saveNavigationPath}
                           >
                              Save Path ({currentPathPoints.length} points)
                           </button>
                        )}
                        <button
                           className="px-4 py-2 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 font-medium transition-colors shadow-sm"
                           onClick={() => setCurrentPathPoints([])}
                        >
                           Clear Path
                        </button>
                        <button
                           className="px-4 py-2 text-sm bg-indigo-500 text-white rounded-md hover:bg-indigo-600 font-medium transition-colors shadow-sm"
                           onClick={() => setMode("placeRoom")}
                        >
                           Exit Path Mode
                        </button>
                     </div>
                  </div>
               )}
            </>
         )}

         {modeType !== import.meta.env.VITE_TEST_KIOSK ?
            <>
               {/* Element Mode Indicator */}
               {elementMode === "stairs" && mode !== "drawPath" && (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded">
                     <p className="text-sm text-orange-800">
                        Stairs mode active - Click inside the building to place stairs
                     </p>
                     <button
                        className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 mt-2"
                        onClick={() => setElementMode("room")}
                     >
                        Switch to Room Mode
                     </button>
                  </div>
               )}

               {/* Room editor */}
               {selectedRoomIndex !== null && rooms[selectedRoomIndex] && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                     <h3 className="font-semibold text-blue-800 mb-2">Edit Room</h3>
                     <div className="flex flex-wrap gap-3 items-center mb-3">
                        <div>
                           <label className="block text-sm font-medium text-blue-700">
                              Room Label:
                           </label>
                           <textarea
                              type="text"
                              className="border border-blue-300 px-2 py-1 text-sm mt-1 rounded"
                              value={rooms[selectedRoomIndex].label}
                              onChange={(e) => updateRoom(selectedRoomIndex, { label: e.target.value })}
                           >
                           </textarea>
                        </div>

                        <div>
                           <label className="block text-sm font-medium text-blue-700">
                              Size:
                           </label>
                           <div className="flex gap-1 mt-1">
                              <input
                                 type="number"
                                 className="border border-blue-300 px-2 py-1 text-xs rounded w-16"
                                 value={rooms[selectedRoomIndex].width}
                                 onChange={(e) => updateRoom(selectedRoomIndex, { width: parseInt(e.target.value) || GRID_SIZE * 2 })}
                                 min={GRID_SIZE * 2}
                                 step={GRID_SIZE}
                              />
                              <span className="text-xs self-center">×</span>
                              <input
                                 type="number"
                                 className="border border-blue-300 px-2 py-1 text-xs rounded w-16"
                                 value={rooms[selectedRoomIndex].height}
                                 onChange={(e) => updateRoom(selectedRoomIndex, { height: parseInt(e.target.value) || GRID_SIZE * 2 })}
                                 min={GRID_SIZE * 2}
                                 step={GRID_SIZE}
                              />
                           </div>
                        </div>
                        <button
                           className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                           onClick={() => deleteRoom(selectedRoomIndex)}
                        >
                           Delete Room
                        </button>
                     </div>
                     <span className='text-[1rem]'>
                        Room Description
                     </span>
                     <textarea
                        placeholder={'Enter the room description here...'}
                        className='w-[36.25dvw] flex items-center text-[.875rem] border-solid border-[1px] border-black p-[1rem] outline-none'
                        onChange={(e) => updateRoom(selectedRoomIndex, { description: e.target.value })}
                        value={rooms[selectedRoomIndex]?.description || ''}
                     />
                     {/* Image Upload Section */}
                     <div className="border-t border-blue-200 pt-3">
                        <h4 className="font-medium text-black mb-2">
                           Room Images ({(rooms[selectedRoomIndex].images || []).length})
                        </h4>

                        <div className="mb-3">
                           <label className="block">
                              <span className="px-3 py-2 text-sm bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-600 inline-block">
                                 Upload Images
                              </span>
                              <input
                                 type="file"
                                 multiple
                                 accept="image/*"
                                 className="hidden"
                                 onChange={(e) => handleImageUpload(e, selectedRoomIndex)}
                              />
                           </label>
                        </div>

                        {/* Image Gallery - shows local preview images */}
                        {rooms[selectedRoomIndex].images && rooms[selectedRoomIndex].images.length > 0 && (
                           <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {rooms[selectedRoomIndex].images.map((image) => (
                                 <div key={image.id} className="relative group">
                                    <img
                                       src={image.previewUrl}
                                       alt={image.name}
                                       className="w-full h-20 object-cover rounded border"
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                                       <button
                                          onClick={() => deleteImage(selectedRoomIndex, image.id)}
                                          className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                                       >
                                          Remove
                                       </button>
                                    </div>
                                    <div className="text-xs text-gray-600 mt-1 truncate" title={image.name}>
                                       {image.name}
                                    </div>
                                 </div>
                              ))}
                           </div>
                        )}
                     </div>

                     <div className='flex flex-col gap-[1.1875rem]'>
                        <span className='font-bold text-[1rem]'>Navigation Guide</span>
                        <div className='flex flex-col gap-[.5rem]'>
                           {Array.isArray(rooms[selectedRoomIndex].navigationGuide) &&
                              rooms[selectedRoomIndex].navigationGuide.length > 0 ? (
                              rooms[selectedRoomIndex].navigationGuide.map((step, index) => (
                                 <div className='flex gap-[0.625rem]' key={step.id}>
                                    <NavigationIconsModal
                                       icon={step.icon}
                                       index={index}
                                       updateIcon={(rule, idx, value) => updateNavigationGuideStep(selectedRoomIndex, rule, idx, value)}
                                    />
                                    <textarea
                                       className='w-[30.90dvw] h-[5rem] border-solid border-[1px] border-black flex text-[.875rem] p-[1rem] outline-none'
                                       placeholder='Enter your navigation text here...'
                                       onChange={(e) => updateNavigationGuideStep(selectedRoomIndex, "DESCRIPTION", index, e.target.value)}
                                       value={step.description}
                                    />
                                    <button
                                       className="w-[2.5rem] h-[2.5rem] hover:bg-gray-300 focus:bg-gray-400 flex items-center justify-center rounded-full cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
                                       aria-label="Close"
                                       onClick={() => removeNavigationGuideCard(selectedRoomIndex, step.id)}
                                       onMouseUp={(e) => e.currentTarget.blur()}
                                    >
                                       <BlackXIcon />
                                    </button>
                                 </div>
                              ))
                           ) : (
                              <p>No navigation has been setup yet for this room</p>
                           )}
                        </div>
                        <button
                           onClick={() => addNavigationGuideCard(selectedRoomIndex)}
                           className='w-[36.25dvw] h-[2.25rem] flex items-center gap-[.5rem] px-[1rem] bg-[#D1D6FA] border-solid border-[1px] border-[#110D79] cursor-pointer'
                        >
                           <AddIcon />
                           <span className='text-[.875rem] text-[#110D79] font-bold'>Add more</span>
                        </button>
                     </div>
                  </div>
               )}

               {/* Building Element Editor */}
               {selectedElementIndex !== null && buildingElements[currentFloor]?.[selectedElementIndex] && (
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded">
                     <h3 className="font-semibold text-purple-800 mb-2">Edit {buildingElements[currentFloor][selectedElementIndex].type}</h3>
                     <div className="flex flex-wrap gap-3 items-center">
                        <div>
                           <label className="block text-sm font-medium text-purple-700">
                              Label:
                           </label>
                           <input
                              type="text"
                              className="border border-purple-300 px-2 py-1 text-sm mt-1 rounded"
                              value={buildingElements[currentFloor][selectedElementIndex].label}
                              onChange={(e) => updateBuildingElement(selectedElementIndex, { label: e.target.value })}
                           />
                        </div>
                        {buildingElements[currentFloor][selectedElementIndex].type === 'stairs' && (
                           <div>
                              <label className="block text-sm font-medium text-purple-700">
                                 Direction:
                              </label>
                              <select
                                 className="border border-purple-300 px-2 py-1 text-sm mt-1 rounded"
                                 value={buildingElements[currentFloor][selectedElementIndex].direction}
                                 onChange={(e) => updateBuildingElement(selectedElementIndex, { direction: e.target.value })}
                              >
                                 <option value="up">Up</option>
                                 <option value="down">Down</option>
                              </select>
                           </div>
                        )}
                        <button
                           className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                           onClick={() => deleteBuildingElement(selectedElementIndex)}
                        >
                           Delete Element
                        </button>
                     </div>
                  </div>
               )}

               {/* Room list */}
               <div className="bg-gray-50 p-3 rounded">
                  <h3 className="font-semibold mb-2">Floor {currentFloor} - Rooms ({rooms.length})</h3>
                  {rooms.length === 0 ? (
                     <p className="text-sm text-gray-500">No rooms placed yet. Click "Add Room" to get started!</p>
                  ) : (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {rooms.map((room, i) => (
                           <div
                              key={room.id || i}
                              className={`text-sm p-2 rounded cursor-pointer ${selectedRoomIndex === i ? 'bg-blue-200' : 'bg-white'}`}
                              onClick={() => {
                                 setSelectedRoomIndex(i);
                                 setSelectedElementIndex(null);
                              }}
                           >
                              <div className="font-medium">{room.label}</div>
                              <div className="text-xs text-gray-600">
                                 Position: ({room.x}, {room.y}) | Size: {room.width}×{room.height}
                                 {room.navigationPath?.length > 0 && (
                                    <span className="text-green-600"> | Has path ({room.navigationPath.length} points)</span>
                                 )}
                                 {room.images?.length > 0 && (
                                    <span className="text-blue-600"> | Images: {room.images.length}</span>
                                 )}
                              </div>
                           </div>
                        ))}
                     </div>
                  )}
               </div>

               {/* Building Elements List */}
               <div className="bg-gray-50 p-3 rounded">
                  <h3 className="font-semibold mb-2">Floor {currentFloor} - Building Elements ({Object.keys(buildingElements[currentFloor] || {}).length})</h3>
                  {Object.keys(buildingElements[currentFloor] || {}).length === 0 ? (
                     <p className="text-sm text-gray-500">No building elements placed yet. Click "Add Stairs" to get started!</p>
                  ) : (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {Object.entries(buildingElements[currentFloor] || {}).map(([elementId, element]) => (
                           <div
                              key={elementId}
                              className={`text-sm p-2 rounded cursor-pointer ${selectedElementIndex === elementId ? 'bg-purple-200' : 'bg-white'
                                 }`}
                              onClick={() => {
                                 setSelectedElementIndex(elementId);
                                 setSelectedRoomIndex(null);
                              }}
                           >
                              <div className="font-medium">{element.label} ({element.type})</div>
                              <div className="text-xs text-gray-600">
                                 Position: ({element.x}, {element.y}) | Size: {element.width}×{element.height}
                                 {element.type === 'stairs' && (
                                    <span className="text-purple-600"> | Direction: {element.direction}</span>
                                 )}
                              </div>
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            </>
            : null}
      </div>
   );
}

const calculateBuildingAngle = (pathString) => {
   if (!pathString) return 0;

   try {
      // Parse the path to extract coordinates
      const pathCommands = pathString.match(/[MLHVCSQTAZ][^MLHVCSQTAZ]*/gi);
      if (!pathCommands) return 0;

      const points = [];
      let currentX = 0, currentY = 0;

      pathCommands.forEach(command => {
         const type = command[0].toUpperCase();
         const coords = command.slice(1).trim().split(/[\s,]+/).map(Number).filter(n => !isNaN(n));

         switch (type) {
            case 'M':
            case 'L':
               if (coords.length >= 2) {
                  currentX = coords[0];
                  currentY = coords[1];
                  points.push({ x: currentX, y: currentY });
               }
               break;
            case 'H':
               if (coords.length >= 1) {
                  currentX = coords[0];
                  points.push({ x: currentX, y: currentY });
               }
               break;
            case 'V':
               if (coords.length >= 1) {
                  currentY = coords[0];
                  points.push({ x: currentX, y: currentY });
               }
               break;
         }
      });

      if (points.length < 2) return 0;

      // Calculate angles between consecutive points
      const angles = [];
      for (let i = 0; i < points.length - 1; i++) {
         const dx = points[i + 1].x - points[i].x;
         const dy = points[i + 1].y - points[i].y;

         if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) { // Ignore very short segments
            let angle = Math.atan2(dy, dx) * (180 / Math.PI);
            // Normalize angle to 0-90 range for building edges
            angle = ((angle % 90) + 90) % 90;
            if (angle > 45) angle = 90 - angle;
            angles.push(angle);
         }
      }

      if (angles.length === 0) return 0;

      // Find the most common angle (within tolerance)
      const tolerance = 5; // degrees
      const angleGroups = {};

      angles.forEach(angle => {
         let found = false;
         for (let key in angleGroups) {
            if (Math.abs(angle - parseFloat(key)) <= tolerance) {
               angleGroups[key].push(angle);
               found = true;
               break;
            }
         }
         if (!found) {
            angleGroups[angle.toFixed(1)] = [angle];
         }
      });

      // Find the group with the most angles
      let dominantAngle = 0;
      let maxCount = 0;

      for (let key in angleGroups) {
         if (angleGroups[key].length > maxCount) {
            maxCount = angleGroups[key].length;
            dominantAngle = angleGroups[key].reduce((sum, a) => sum + a, 0) / angleGroups[key].length;
         }
      }

      return dominantAngle;
   } catch (error) {
      console.warn('Error calculating building angle:', error);
      return 0;
   }
};

// Function to rotate a path string
const rotateBuildingPath = (pathString, angleInDegrees) => {
   if (!pathString || Math.abs(angleInDegrees) < 0.1) return pathString;

   try {
      // First, get the bounding box center for rotation
      const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const tempPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      tempPath.setAttribute('d', pathString);
      tempSvg.appendChild(tempPath);
      document.body.appendChild(tempSvg);

      const bbox = tempPath.getBBox();
      const centerX = bbox.x + bbox.width / 2;
      const centerY = bbox.y + bbox.height / 2;

      document.body.removeChild(tempSvg);

      // Parse and rotate the path
      const pathCommands = pathString.match(/[MLHVCSQTAZ][^MLHVCSQTAZ]*/gi);
      if (!pathCommands) return pathString;

      const angleRad = (-angleInDegrees * Math.PI) / 180; // Negative to correct the tilt
      const cos = Math.cos(angleRad);
      const sin = Math.sin(angleRad);

      const rotatedCommands = pathCommands.map(command => {
         const type = command[0];
         const coords = command.slice(1).trim().split(/[\s,]+/).map(Number).filter(n => !isNaN(n));

         if (coords.length >= 2) {
            const rotatedCoords = [];
            for (let i = 0; i < coords.length; i += 2) {
               if (i + 1 < coords.length) {
                  const x = coords[i];
                  const y = coords[i + 1];

                  // Translate to origin, rotate, translate back
                  const translatedX = x - centerX;
                  const translatedY = y - centerY;

                  const rotatedX = translatedX * cos - translatedY * sin + centerX;
                  const rotatedY = translatedX * sin + translatedY * cos + centerY;

                  rotatedCoords.push(Math.round(rotatedX * 100) / 100);
                  rotatedCoords.push(Math.round(rotatedY * 100) / 100);
               }
            }
            return type + rotatedCoords.join(' ');
         } else if (coords.length === 1) {
            // Handle H and V commands - for simplicity, we'll keep them as-is
            // In a real scenario, you might want to convert them to L commands after rotation
            return command;
         }

         return command;
      });

      return rotatedCommands.join(' ');
   } catch (error) {
      console.warn('Error rotating building path:', error);
      return pathString;
   }
};

// Function to ensure building has proper dimensions for grid
const ensureBuildingHasGrid = (pathString, minSize = 200) => {
   if (!pathString) return null;

   try {
      const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const tempPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      tempPath.setAttribute('d', pathString);
      tempSvg.appendChild(tempPath);
      document.body.appendChild(tempSvg);

      const bbox = tempPath.getBBox();
      document.body.removeChild(tempSvg);

      // Check if building is too small or has no area
      if (bbox.width < 10 || bbox.height < 10 || bbox.width * bbox.height < 100) {
         console.warn('Building path appears to be invalid or too small');
         return null;
      }

      return pathString;
   } catch (error) {
      console.warn('Error validating building path:', error);
      return null;
   }
};
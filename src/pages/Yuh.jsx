import React, { useState, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { Stage, Layer, Path, Rect } from 'react-konva';
import { Users, Car, TreePine, Wifi, Camera, Shield, Coffee, Utensils } from 'lucide-react';

const Stairs = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <path d="M22 21H2v-2h4v-2h4v-2h4v-2h4v-2h4V9h-4V7h-4V5h-4V3H6v2H2v2h4v2h4v2h4v2h4v2z"/>
  </svg>
);

// Custom Elevator component
const Elevator = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <path d="M7 9h10"/>
    <path d="M7 15h10"/>
    <path d="M12 6L15 9L12 12"/>
    <path d="M12 12L9 15L12 18"/>
  </svg>
);

const BuildingViewer = () => {
   const canvasRef = useRef(null);
   const [currentFloor, setCurrentFloor] = useState(1);
   const [floors, setFloors] = useState({
      1: {
         rooms: [
            { id: 1, x: 50, y: 50, width: 120, height: 80, name: 'Lobby', color: '#e3f2fd' },
            { id: 2, x: 200, y: 50, width: 100, height: 80, name: 'Reception', color: '#f3e5f5' },
         ],
         elements: [
            { id: 1, type: 'stairs', x: 300, y: 150, rotation: 0, name: 'Main Stairs' },
            { id: 2, type: 'elevator', x: 350, y: 150, rotation: 0, name: 'Elevator 1' },
         ]
      }
   });
   
   const [selectedRoom, setSelectedRoom] = useState(null);
   const [selectedElement, setSelectedElement] = useState(null);
   const [isDragging, setIsDragging] = useState(false);
   const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
   const [dragType, setDragType] = useState(null); // 'room' or 'element'

   // Navigation state
   const [navigationMode, setNavigationMode] = useState(false);
   const [startRoom, setStartRoom] = useState(null);
   const [endRoom, setEndRoom] = useState(null);
   const [navigationPath, setNavigationPath] = useState([]);
   
   const [obstacles, setObstacles] = useState([
      { x: 140, y: 100, width: 20, height: 40 },
      { x: 150, y: 140, width: 40, height: 20 }
   ]);

   // Available building elements with icons
   const buildingElements = [
      { type: 'stairs', icon: Stairs, name: 'Stairs', color: '#8B4513', size: 30 },
      { type: 'elevator', icon: Elevator, name: 'Elevator', color: '#4A90E2', size: 30 },
   ];

   const gridSize = 10;
   const snapToGrid = (value) => Math.round(value / 20) * 20;

   const getCurrentFloorData = () => {
      return floors[currentFloor] || { rooms: [], elements: [] };
   };

   const updateFloorData = (updates) => {
      setFloors(prev => ({
         ...prev,
         [currentFloor]: {
            ...prev[currentFloor],
            ...updates
         }
      }));
   };

   // A* Pathfinding Algorithm (same as before)
   const findPath = (start, end) => {
      const grid = createGrid();
      const startNode = { 
         x: Math.floor(start.x / gridSize), 
         y: Math.floor(start.y / gridSize) 
      };
      const endNode = { 
         x: Math.floor(end.x / gridSize), 
         y: Math.floor(end.y / gridSize) 
      };

      if (!isValidPosition(startNode, grid) || !isValidPosition(endNode, grid)) {
         return [];
      }

      const openSet = [startNode];
      const closedSet = [];
      const cameFrom = {};
      const gScore = {};
      const fScore = {};

      const key = (node) => `${node.x},${node.y}`;

      gScore[key(startNode)] = 0;
      fScore[key(startNode)] = heuristic(startNode, endNode);

      while (openSet.length > 0) {
         let current = openSet.reduce((min, node) =>
            (fScore[key(node)] || Infinity) < (fScore[key(min)] || Infinity) ? node : min
         );

         if (current.x === endNode.x && current.y === endNode.y) {
            const path = [];
            let temp = current;
            while (temp) {
               path.unshift({ x: temp.x * gridSize, y: temp.y * gridSize });
               temp = cameFrom[key(temp)];
            }
            return path;
         }

         openSet.splice(openSet.indexOf(current), 1);
         closedSet.push(current);

         const neighbors = getNeighbors(current, grid);

         for (const neighbor of neighbors) {
            if (closedSet.some(node => node.x === neighbor.x && node.y === neighbor.y)) {
               continue;
            }

            const tentativeGScore = gScore[key(current)] + 1;

            if (!openSet.some(node => node.x === neighbor.x && node.y === neighbor.y)) {
               openSet.push(neighbor);
            } else if (tentativeGScore >= (gScore[key(neighbor)] || Infinity)) {
               continue;
            }

            cameFrom[key(neighbor)] = current;
            gScore[key(neighbor)] = tentativeGScore;
            fScore[key(neighbor)] = gScore[key(neighbor)] + heuristic(neighbor, endNode);
         }
      }

      return [];
   };

   const isValidPosition = (node, grid) => {
      return node.x >= 0 && node.x < grid[0].length && 
             node.y >= 0 && node.y < grid.length &&
             grid[node.y] && grid[node.y][node.x] !== undefined;
   };

   const createGrid = () => {
      const gridWidth = Math.ceil(600 / gridSize);
      const gridHeight = Math.ceil(400 / gridSize);
      
      const grid = Array(gridHeight).fill(null).map(() =>
         Array(gridWidth).fill(0)
      );

      obstacles.forEach(obstacle => {
         const startX = Math.floor(obstacle.x / gridSize);
         const startY = Math.floor(obstacle.y / gridSize);
         const endX = Math.ceil((obstacle.x + obstacle.width) / gridSize);
         const endY = Math.ceil((obstacle.y + obstacle.height) / gridSize);

         for (let y = startX; y < endY && y < grid.length; y++) {
            for (let x = startX; x < endX && x < grid[0].length; x++) {
               if (grid[y] && grid[y][x] !== undefined) {
                  grid[y][x] = 1;
               }
            }
         }
      });

      return grid;
   };

   const getNeighbors = (node, grid) => {
      const neighbors = [];
      const directions = [
         { x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }
      ];

      for (const dir of directions) {
         const newX = node.x + dir.x;
         const newY = node.y + dir.y;

         if (newX >= 0 && newX < grid[0].length &&
            newY >= 0 && newY < grid.length &&
            grid[newY][newX] === 0) {
            neighbors.push({ x: newX, y: newY });
         }
      }

      return neighbors;
   };

   const heuristic = (a, b) => {
      return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
   };

   const getRoomCenter = (room) => {
      return {
         x: room.x + room.width / 2,
         y: room.y + room.height / 2
      };
   };

   // Update navigation path when start/end rooms change
   useEffect(() => {
      const currentData = getCurrentFloorData();
      const currentStartRoom = currentData.rooms.find(r => r.id === startRoom?.id);
      const currentEndRoom = currentData.rooms.find(r => r.id === endRoom?.id);
      
      if (currentStartRoom && currentEndRoom && currentStartRoom.id !== currentEndRoom.id) {
         const startCenter = getRoomCenter(currentStartRoom);
         const endCenter = getRoomCenter(currentEndRoom);
         const path = findPath(startCenter, endCenter);
         setNavigationPath(path);
      } else {
         setNavigationPath([]);
      }
   }, [startRoom, endRoom, currentFloor, floors, obstacles]);

   const drawCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw grid
      ctx.strokeStyle = '#f0f0f0';
      ctx.lineWidth = 1;

      for (let x = 0; x <= 600; x += 20) {
         ctx.beginPath();
         ctx.moveTo(x, 0);
         ctx.lineTo(x, 400);
         ctx.stroke();
      }

      for (let y = 0; y <= 400; y += 20) {
         ctx.beginPath();
         ctx.moveTo(0, y);
         ctx.lineTo(600, y);
         ctx.stroke();
      }

      // Draw obstacles
      ctx.fillStyle = '#666';
      obstacles.forEach(obstacle => {
         ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      });

      const currentData = getCurrentFloorData();

      // Draw rooms
      currentData.rooms.forEach(room => {
         ctx.fillStyle = room.color;
         ctx.fillRect(room.x, room.y, room.width, room.height);

         let borderColor = '#ccc';
         let lineWidth = 1;

         if (selectedRoom?.id === room.id) {
            borderColor = '#2196f3';
            lineWidth = 3;
         } else if (startRoom?.id === room.id) {
            borderColor = '#4caf50';
            lineWidth = 3;
         } else if (endRoom?.id === room.id) {
            borderColor = '#f44336';
            lineWidth = 3;
         }

         ctx.strokeStyle = borderColor;
         ctx.lineWidth = lineWidth;
         ctx.strokeRect(room.x, room.y, room.width, room.height);

         ctx.fillStyle = '#333';
         ctx.font = '12px Arial';
         ctx.textAlign = 'center';
         ctx.fillText(room.name, room.x + room.width / 2, room.y + room.height / 2);
      });

      // Draw building elements (stairs, elevators, etc.)
      currentData.elements.forEach(element => {
         const elementType = buildingElements.find(e => e.type === element.type);
         if (!elementType) return;

         const size = elementType.size;
         const halfSize = size / 2;

         // Draw element background
         let bgColor = elementType.color;
         let borderColor = '#666';
         let lineWidth = 2;

         if (selectedElement?.id === element.id) {
            borderColor = '#2196f3';
            lineWidth = 3;
            bgColor = elementType.color + '80'; // Add transparency
         }

         ctx.fillStyle = bgColor;
         ctx.fillRect(element.x - halfSize, element.y - halfSize, size, size);

         ctx.strokeStyle = borderColor;
         ctx.lineWidth = lineWidth;
         ctx.strokeRect(element.x - halfSize, element.y - halfSize, size, size);

         // Draw element icon (simplified representation)
         ctx.fillStyle = '#fff';
         ctx.font = 'bold 16px Arial';
         ctx.textAlign = 'center';
         
         // Simple icon representations
         let iconText = '';
         switch (element.type) {
            case 'stairs': iconText = '≣'; break;
            case 'elevator': iconText = '⬆'; break;
            case 'restroom': iconText = '🚻'; break;
            case 'parking': iconText = '🚗'; break;
            case 'garden': iconText = '🌲'; break;
            case 'wifi': iconText = '📶'; break;
            case 'camera': iconText = '📹'; break;
            case 'security': iconText = '🛡'; break;
            case 'cafe': iconText = '☕'; break;
            case 'kitchen': iconText = '🍴'; break;
            default: iconText = '?';
         }

         ctx.fillText(iconText, element.x, element.y + 5);

         // Draw element label
         ctx.font = '10px Arial';
         ctx.fillStyle = '#333';
         ctx.fillText(element.name, element.x, element.y + size/2 + 15);
      });

      // Draw navigation path
      if (navigationPath.length > 1) {
         ctx.strokeStyle = '#ff5722';
         ctx.lineWidth = 4;
         ctx.lineCap = 'round';
         ctx.lineJoin = 'round';

         ctx.beginPath();
         ctx.moveTo(navigationPath[0].x, navigationPath[0].y);

         for (let i = 1; i < navigationPath.length; i++) {
            ctx.lineTo(navigationPath[i].x, navigationPath[i].y);
         }

         ctx.stroke();

         ctx.fillStyle = '#ff5722';
         navigationPath.forEach((point, index) => {
            if (index === 0 || index === navigationPath.length - 1) {
               ctx.beginPath();
               ctx.arc(point.x, point.y, 6, 0, 2 * Math.PI);
               ctx.fill();
            } else {
               ctx.beginPath();
               ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
               ctx.fill();
            }
         });
      }

      // Draw navigation indicators
      if (startRoom) {
         const currentStartRoom = currentData.rooms.find(r => r.id === startRoom.id);
         if (currentStartRoom) {
            const center = getRoomCenter(currentStartRoom);
            ctx.fillStyle = '#4caf50';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('START', center.x, center.y - 20);
         }
      }

      if (endRoom) {
         const currentEndRoom = currentData.rooms.find(r => r.id === endRoom.id);
         if (currentEndRoom) {
            const center = getRoomCenter(currentEndRoom);
            ctx.fillStyle = '#f44336';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('END', center.x, center.y - 20);
         }
      }
   };

   useEffect(() => {
      drawCanvas();
   }, [currentFloor, floors, selectedRoom, selectedElement, navigationPath, startRoom, endRoom, obstacles]);

   const handleMouseDown = (e) => {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const currentData = getCurrentFloorData();

      // Check for element clicks first (they're smaller and might be on top)
      const clickedElement = currentData.elements.find(element => {
         const elementType = buildingElements.find(e => e.type === element.type);
         if (!elementType) return false;
         
         const size = elementType.size;
         const halfSize = size / 2;
         
         return x >= element.x - halfSize && x <= element.x + halfSize &&
                y >= element.y - halfSize && y <= element.y + halfSize;
      });

      const clickedRoom = currentData.rooms.find(room =>
         x >= room.x && x <= room.x + room.width &&
         y >= room.y && y <= room.y + room.height
      );

      if (navigationMode && clickedRoom) {
         if (!startRoom) {
            setStartRoom(clickedRoom);
         } else if (!endRoom && clickedRoom.id !== startRoom.id) {
            setEndRoom(clickedRoom);
         } else {
            setStartRoom(clickedRoom);
            setEndRoom(null);
         }
         return;
      }

      if (clickedElement) {
         setSelectedElement(clickedElement);
         setSelectedRoom(null);
         setIsDragging(true);
         setDragType('element');
         setDragOffset({ x: x - clickedElement.x, y: y - clickedElement.y });
      } else if (clickedRoom) {
         setSelectedRoom(clickedRoom);
         setSelectedElement(null);
         setIsDragging(true);
         setDragType('room');
         setDragOffset({ x: x - clickedRoom.x, y: y - clickedRoom.y });
      } else {
         setSelectedRoom(null);
         setSelectedElement(null);
      }
   };

   const handleMouseMove = (e) => {
      if (!isDragging || navigationMode) return;

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (dragType === 'room' && selectedRoom) {
         const newX = snapToGrid(x - dragOffset.x);
         const newY = snapToGrid(y - dragOffset.y);

         const currentData = getCurrentFloorData();
         const updatedRooms = currentData.rooms.map(room =>
            room.id === selectedRoom.id
               ? {
                  ...room,
                  x: Math.max(0, Math.min(newX, 600 - room.width)),
                  y: Math.max(0, Math.min(newY, 400 - room.height))
               }
               : room
         );

         updateFloorData({ rooms: updatedRooms });

      } else if (dragType === 'element' && selectedElement) {
         const newX = snapToGrid(x - dragOffset.x);
         const newY = snapToGrid(y - dragOffset.y);

         const currentData = getCurrentFloorData();
         const updatedElements = currentData.elements.map(element =>
            element.id === selectedElement.id
               ? {
                  ...element,
                  x: Math.max(20, Math.min(newX, 580)),
                  y: Math.max(20, Math.min(newY, 380))
               }
               : element
         );

         updateFloorData({ elements: updatedElements });
      }
   };

   const handleMouseUp = () => {
      setIsDragging(false);
      setDragOffset({ x: 0, y: 0 });
      setDragType(null);
   };

   const addRoom = () => {
      const currentData = getCurrentFloorData();
      const newRoom = {
         id: Math.max(0, ...currentData.rooms.map(r => r.id)) + 1,
         x: 50,
         y: 50,
         width: 100,
         height: 80,
         name: `Room ${currentData.rooms.length + 1}`,
         color: d3.schemeCategory10[currentData.rooms.length % 10]
      };
      
      updateFloorData({ rooms: [...currentData.rooms, newRoom] });
   };

   const addElement = (elementType) => {
      const currentData = getCurrentFloorData();
      const newElement = {
         id: Math.max(0, ...currentData.elements.map(e => e.id)) + 1,
         type: elementType,
         x: 100,
         y: 100,
         rotation: 0,
         name: buildingElements.find(e => e.type === elementType)?.name || elementType
      };
      
      updateFloorData({ elements: [...currentData.elements, newElement] });
   };

   const deleteSelected = () => {
      const currentData = getCurrentFloorData();
      
      if (selectedRoom) {
         const updatedRooms = currentData.rooms.filter(room => room.id !== selectedRoom.id);
         updateFloorData({ rooms: updatedRooms });
         
         if (startRoom?.id === selectedRoom.id) setStartRoom(null);
         if (endRoom?.id === selectedRoom.id) setEndRoom(null);
         
         setSelectedRoom(null);
      } else if (selectedElement) {
         const updatedElements = currentData.elements.filter(element => element.id !== selectedElement.id);
         updateFloorData({ elements: updatedElements });
         setSelectedElement(null);
      }
   };

   const updateRoomProperty = (property, value) => {
      if (selectedRoom) {
         const currentData = getCurrentFloorData();
         const updatedRooms = currentData.rooms.map(room =>
            room.id === selectedRoom.id
               ? { ...room, [property]: value }
               : room
         );
         updateFloorData({ rooms: updatedRooms });
         setSelectedRoom({ ...selectedRoom, [property]: value });
      }
   };

   const updateElementProperty = (property, value) => {
      if (selectedElement) {
         const currentData = getCurrentFloorData();
         const updatedElements = currentData.elements.map(element =>
            element.id === selectedElement.id
               ? { ...element, [property]: value }
               : element
         );
         updateFloorData({ elements: updatedElements });
         setSelectedElement({ ...selectedElement, [property]: value });
      }
   };

   const addFloor = () => {
      const newFloorNumber = Math.max(...Object.keys(floors).map(Number)) + 1;
      setFloors(prev => ({
         ...prev,
         [newFloorNumber]: { rooms: [], elements: [] }
      }));
      setCurrentFloor(newFloorNumber);
   };

   const deleteFloor = () => {
      if (Object.keys(floors).length <= 1) return;
      
      const floorNumbers = Object.keys(floors).map(Number).sort((a, b) => a - b);
      const newFloors = { ...floors };
      delete newFloors[currentFloor];
      
      const remainingFloors = floorNumbers.filter(f => f !== currentFloor);
      const newCurrentFloor = remainingFloors[0];
      
      setFloors(newFloors);
      setCurrentFloor(newCurrentFloor);
      setSelectedRoom(null);
      setSelectedElement(null);
   };

   const clearNavigation = () => {
      setStartRoom(null);
      setEndRoom(null);
      setNavigationPath([]);
   };

   const currentData = getCurrentFloorData();
   const totalArea = d3.sum(currentData.rooms, d => d.width * d.height);
   const averageRoomSize = currentData.rooms.length > 0 ? totalArea / currentData.rooms.length : 0;
   const pathDistance = navigationPath.length > 1 ?
      navigationPath.reduce((total, point, index) => {
         if (index === 0) return 0;
         const prev = navigationPath[index - 1];
         return total + Math.sqrt(Math.pow(point.x - prev.x, 2) + Math.pow(point.y - prev.y, 2));
      }, 0) : 0;

   return (
      <div className="flex h-screen bg-gray-100">
         <div className="flex-1 p-4">
            <div className="bg-white rounded-lg shadow-lg p-4">
               <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-4">
                     <h2 className="text-xl font-bold">Building Layout Builder</h2>
                     <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Floor:</span>
                        <select
                           value={currentFloor}
                           onChange={(e) => setCurrentFloor(Number(e.target.value))}
                           className="px-3 py-1 border rounded-md text-sm"
                        >
                           {Object.keys(floors).map(floor => (
                              <option key={floor} value={floor}>Floor {floor}</option>
                           ))}
                        </select>
                        <button
                           onClick={addFloor}
                           className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                        >
                           Add Floor
                        </button>
                        {Object.keys(floors).length > 1 && (
                           <button
                              onClick={deleteFloor}
                              className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                           >
                              Delete Floor
                           </button>
                        )}
                     </div>
                  </div>
                  <div className="flex gap-2">
                     <button
                        onClick={() => setNavigationMode(!navigationMode)}
                        className={`px-4 py-2 rounded ${navigationMode
                           ? 'bg-orange-500 text-white'
                           : 'bg-gray-200 text-gray-700'}`}
                     >
                        {navigationMode ? 'Exit Navigation' : 'Navigation Mode'}
                     </button>
                     {navigationMode && (
                        <button
                           onClick={clearNavigation}
                           className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                           Clear Path
                        </button>
                     )}
                  </div>
               </div>

               {navigationMode && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                     <p className="text-sm text-blue-800">
                        <strong>Navigation Mode:</strong> Click rooms to set start (green) and end (red) points.
                        The orange path will show the optimal route avoiding obstacles.
                     </p>
                  </div>
               )}

               <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
                  <canvas
                     ref={canvasRef}
                     width={600}
                     height={400}
                     className={navigationMode ? "cursor-crosshair" : "cursor-pointer"}
                     onMouseDown={handleMouseDown}
                     onMouseMove={handleMouseMove}
                     onMouseUp={handleMouseUp}
                     onMouseLeave={handleMouseUp}
                  />
               </div>
            </div>
         </div>

         <div className="w-80 bg-white shadow-lg p-4 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Floor {currentFloor} Controls</h3>

            {!navigationMode && (
               <div className="mb-6">
                  <button
                     onClick={addRoom}
                     className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mb-2"
                  >
                     Add Room
                  </button>
                  
                  <div className="mb-3">
                     <h4 className="text-sm font-semibold mb-2">Add Building Elements</h4>
                     <div className="grid grid-cols-2 gap-1">
                        {buildingElements.map(element => (
                           <button
                              key={element.type}
                              onClick={() => addElement(element.type)}
                              className="px-2 py-1 bg-gray-100 text-xs rounded hover:bg-gray-200 flex items-center justify-center gap-1"
                              title={element.name}
                           >
                              <element.icon size={12} />
                              <span className="truncate">{element.name}</span>
                           </button>
                        ))}
                     </div>
                  </div>
                  
                  <button
                     onClick={deleteSelected}
                     disabled={!selectedRoom && !selectedElement}
                     className="w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:bg-gray-300"
                  >
                     Delete Selected Item
                  </button>
               </div>
            )}

            {/* Navigation Info */}
            {navigationMode && (
               <div className="mb-6">
                  <h4 className="font-semibold mb-2">Navigation Path</h4>
                  <div className="bg-gray-50 p-3 rounded-md space-y-2">
                     <div className="text-sm">
                        <strong>Start:</strong> {startRoom ? startRoom.name : 'Not set'}
                     </div>
                     <div className="text-sm">
                        <strong>End:</strong> {endRoom ? endRoom.name : 'Not set'}
                     </div>
                     <div className="text-sm">
                        <strong>Path Distance:</strong> {Math.round(pathDistance)} units
                     </div>
                     <div className="text-sm">
                        <strong>Path Points:</strong> {navigationPath.length}
                     </div>
                  </div>
               </div>
            )}

            {/* Room Properties */}
            {selectedRoom && !navigationMode && (
               <div className="mb-6">
                  <h4 className="font-semibold mb-2">Room Properties</h4>
                  <div className="space-y-3">
                     <div>
                        <label className="block text-sm font-medium mb-1">Name</label>
                        <input
                           type="text"
                           value={selectedRoom.name}
                           onChange={(e) => updateRoomProperty('name', e.target.value)}
                           className="w-full px-3 py-2 border rounded-md"
                        />
                     </div>
                     <div className="grid grid-cols-2 gap-2">
                        <div>
                           <label className="block text-sm font-medium mb-1">Width</label>
                           <input
                              type="number"
                              value={selectedRoom.width}
                              onChange={(e) => updateRoomProperty('width', parseInt(e.target.value))}
                              className="w-full px-3 py-2 border rounded-md"
                           />
                        </div>
                        <div>
                           <label className="block text-sm font-medium mb-1">Height</label>
                           <input
                              type="number"
                              value={selectedRoom.height}
                              onChange={(e) => updateRoomProperty('height', parseInt(e.target.value))}
                              className="w-full px-3 py-2 border rounded-md"
                           />
                        </div>
                     </div>
                     <div>
                        <label className="block text-sm font-medium mb-1">Color</label>
                        <input
                           type="color"
                           value={selectedRoom.color}
                           onChange={(e) => updateRoomProperty('color', e.target.value)}
                           className="w-full px-3 py-2 border rounded-md"
                           style={{ height: '40px' }}
                        />
                     </div>
                  </div>
               </div>
            )}

            {/* Element Properties */}
            {selectedElement && !navigationMode && (
               <div className="mb-6">
                  <h4 className="font-semibold mb-2">Element Properties</h4>
                  <div className="space-y-3">
                     <div>
                        <label className="block text-sm font-medium mb-1">Name</label>
                        <input
                           type="text"
                           value={selectedElement.name}
                           onChange={(e) => updateElementProperty('name', e.target.value)}
                           className="w-full px-3 py-2 border rounded-md"
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-medium mb-1">Type</label>
                        <select
                           value={selectedElement.type}
                           onChange={(e) => updateElementProperty('type', e.target.value)}
                           className="w-full px-3 py-2 border rounded-md"
                        >
                           {buildingElements.map(element => (
                              <option key={element.type} value={element.type}>
                                 {element.name}
                              </option>
                           ))}
                        </select>
                     </div>
                     <div>
                        <label className="block text-sm font-medium mb-1">Rotation (degrees)</label>
                        <input
                           type="number"
                           value={selectedElement.rotation}
                           onChange={(e) => updateElementProperty('rotation', parseInt(e.target.value))}
                           className="w-full px-3 py-2 border rounded-md"
                           min="0"
                           max="360"
                           step="90"
                        />
                     </div>
                  </div>
               </div>
            )}

            <div className="mb-6">
               <h4 className="font-semibold mb-2">Floor {currentFloor} Statistics</h4>
               <div className="bg-gray-50 p-3 rounded-md space-y-2">
                  <div className="text-sm">
                     <strong>Total Rooms:</strong> {currentData.rooms.length}
                  </div>
                  <div className="text-sm">
                     <strong>Building Elements:</strong> {currentData.elements.length}
                  </div>
                  <div className="text-sm">
                     <strong>Total Area:</strong> {totalArea.toLocaleString()} sq units
                  </div>
                  <div className="text-sm">
                     <strong>Average Room Size:</strong> {Math.round(averageRoomSize).toLocaleString()} sq units
                  </div>
                  <div className="text-sm">
                     <strong>Stairs Count:</strong> {currentData.elements.filter(e => e.type === 'stairs').length}
                  </div>
                  <div className="text-sm">
                     <strong>Elevators Count:</strong> {currentData.elements.filter(e => e.type === 'elevator').length}
                  </div>
               </div>
            </div>

            <div className="mb-6">
               <h4 className="font-semibold mb-2">Rooms</h4>
               <div className="space-y-2 max-h-32 overflow-y-auto">
                  {currentData.rooms.map(room => (
                     <div
                        key={room.id}
                        onClick={() => !navigationMode && setSelectedRoom(room)}
                        className={`p-3 rounded-md transition-colors ${selectedRoom?.id === room.id
                              ? 'bg-blue-100 border-blue-300 border-2'
                              : startRoom?.id === room.id
                                 ? 'bg-green-100 border-green-300 border-2'
                                 : endRoom?.id === room.id
                                    ? 'bg-red-100 border-red-300 border-2'
                                    : 'bg-gray-50 hover:bg-gray-100'
                           } ${navigationMode ? 'cursor-default' : 'cursor-pointer'}`}
                     >
                        <div className="flex items-center justify-between">
                           <span className="font-medium">{room.name}</span>
                           <div
                              className="w-4 h-4 rounded border"
                              style={{ backgroundColor: room.color }}
                           />
                        </div>
                        <div className="text-sm text-gray-600">
                           {room.width} × {room.height} ({room.width * room.height} sq units)
                        </div>
                        {startRoom?.id === room.id && (
                           <div className="text-xs text-green-600 font-medium">START POINT</div>
                        )}
                        {endRoom?.id === room.id && (
                           <div className="text-xs text-red-600 font-medium">END POINT</div>
                        )}
                     </div>
                  ))}
               </div>
            </div>

            <div>
               <h4 className="font-semibold mb-2">Building Elements</h4>
               <div className="space-y-2 max-h-32 overflow-y-auto">
                  {currentData.elements.map(element => {
                     const elementType = buildingElements.find(e => e.type === element.type);
                     const IconComponent = elementType?.icon;
                     
                     return (
                        <div
                           key={element.id}
                           onClick={() => !navigationMode && setSelectedElement(element)}
                           className={`p-3 rounded-md transition-colors ${selectedElement?.id === element.id
                                 ? 'bg-blue-100 border-blue-300 border-2'
                                 : 'bg-gray-50 hover:bg-gray-100'
                              } ${navigationMode ? 'cursor-default' : 'cursor-pointer'}`}
                        >
                           <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                 {IconComponent && <IconComponent size={16} color={elementType.color} />}
                                 <span className="font-medium">{element.name}</span>
                              </div>
                           </div>
                           <div className="text-sm text-gray-600">
                              Type: {elementType?.name || element.type}
                           </div>
                           <div className="text-sm text-gray-600">
                              Position: ({element.x}, {element.y})
                           </div>
                        </div>
                     );
                  })}
               </div>
            </div>

            <div className="mt-6 p-3 bg-yellow-50 rounded-lg">
               <h4 className="font-semibold text-sm mb-2">Building Overview</h4>
               <div className="text-xs text-gray-700 space-y-1">
                  <div><strong>Total Floors:</strong> {Object.keys(floors).length}</div>
                  <div><strong>Total Rooms:</strong> {Object.values(floors).reduce((sum, floor) => sum + floor.rooms.length, 0)}</div>
                  <div><strong>Total Elements:</strong> {Object.values(floors).reduce((sum, floor) => sum + floor.elements.length, 0)}</div>
                  <div><strong>Total Stairs:</strong> {Object.values(floors).reduce((sum, floor) => sum + floor.elements.filter(e => e.type === 'stairs').length, 0)}</div>
                  <div><strong>Total Elevators:</strong> {Object.values(floors).reduce((sum, floor) => sum + floor.elements.filter(e => e.type === 'elevator').length, 0)}</div>
               </div>
            </div>
         </div>
      </div>
   );
};

export default BuildingViewer;
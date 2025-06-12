import React from 'react'
import * as d3 from 'd3'

export const renderIndoorMap = (svgRef, building, floors, paths, setViewMode, currentFloor, setCurrentFloor, updateFloorData) => {
   const svg = d3.select(svgRef.current);

   // Clear existing content
   svg.selectAll("*").remove();

   // Set up SVG dimensions
   const width = 800;
   const height = 600;
   svg.attr("width", width).attr("height", height);

   // Create main group for the indoor map
   const mainGroup = svg.append("g").attr("class", "indoor-map-group");

   // Add background
   mainGroup.append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "#f8f9fa")
      .attr("stroke", "#dee2e6")
      .attr("stroke-width", 1);

   let processedBuildingPath = building?.path;
   let buildingBounds = null;

   // Process building path if available
   if (building && building.path) {
      // Get building bounds
      buildingBounds = getBuildingBounds(building.path);

      // Check if building needs rotation
      const rotationInfo = getBuildingRotation(building.path, buildingBounds);
      if (rotationInfo.needsRotation) {
         console.log(`Rotating building by ${rotationInfo.angle}° to straighten it`);
         processedBuildingPath = rotatePathToUpright(building.path, buildingBounds, rotationInfo.angle);
         // Recalculate bounds after rotation
         buildingBounds = getBuildingBounds(processedBuildingPath);
      }

      // Scale and center the building to fit in the viewport
      const padding = 100;
      const availableWidth = width - padding * 2;
      const availableHeight = height - padding * 2;
      const scaleX = availableWidth / buildingBounds.width;
      const scaleY = availableHeight / buildingBounds.height;
      const scale = Math.min(scaleX, scaleY, 2); // Cap at 2x to avoid too much scaling

      const translateX = (width - buildingBounds.width * scale) / 2 - buildingBounds.minX * scale;
      const translateY = (height - buildingBounds.height * scale) / 2 - buildingBounds.minY * scale;

      // Apply transformation to main group
      mainGroup.attr("transform", `translate(${translateX}, ${translateY}) scale(${scale})`);

      // Render building structure using the processed SVG path
      const buildingGroup = mainGroup.append("g").attr("class", "building-structure");

      // Add building fill
      buildingGroup.append("path")
         .attr("d", processedBuildingPath)
         .attr("fill", "rgba(108, 117, 125, 0.1)")
         .attr("stroke", "#495057")
         .attr("stroke-width", 3 / scale)
         .attr("opacity", 0.8);

      // Add building outline for better visibility
      buildingGroup.append("path")
         .attr("d", processedBuildingPath)
         .attr("fill", "none")
         .attr("stroke", "#6c757d")
         .attr("stroke-width", 2 / scale)
         .attr("stroke-dasharray", `${5 / scale},${5 / scale}`);

      // Create building-specific grid
      const gridSize = 30;
      createBuildingGrid(mainGroup, processedBuildingPath, buildingBounds, gridSize, scale);
   } else {
      // Fallback: Create regular grid system for layout building if no building path
      const gridSize = 20;
      const gridGroup = mainGroup.append("g").attr("class", "grid-group");

      // Draw grid lines
      for (let x = 0; x <= width; x += gridSize) {
         gridGroup.append("line")
            .attr("x1", x)
            .attr("y1", 0)
            .attr("x2", x)
            .attr("y2", height)
            .attr("stroke", "#e9ecef")
            .attr("stroke-width", 0.5)
            .attr("opacity", 0.7);
      }
      for (let y = 0; y <= height; y += gridSize) {
         gridGroup.append("line")
            .attr("x1", 0)
            .attr("y1", y)
            .attr("x2", width)
            .attr("y2", y)
            .attr("stroke", "#e9ecef")
            .attr("stroke-width", 0.5)
            .attr("opacity", 0.7);
      }
   }

   // Get current floor data
   const getCurrentFloorData = () => {
      return floors[currentFloor] || { rooms: [], elements: [] };
   };

   // Create rooms group for layout building
   const roomsGroup = mainGroup.append("g").attr("class", "rooms-group");

   // Render current floor rooms
   const currentFloorData = getCurrentFloorData();
   if (currentFloorData.rooms && currentFloorData.rooms.length > 0) {
      currentFloorData.rooms.forEach((room, index) => {
         const roomElement = roomsGroup.append("g")
            .attr("class", `room-${room.id || index}`)
            .attr("transform", `translate(${room.x || 0}, ${room.y || 0})`);

         // Room rectangle
         roomElement.append("rect")
            .attr("width", room.width || 60)
            .attr("height", room.height || 40)
            .attr("fill", room.color || "#007bff")
            .attr("stroke", "#0056b3")
            .attr("stroke-width", 2)
            .attr("opacity", 0.7)
            .attr("rx", 4);

         // Room label
         roomElement.append("text")
            .attr("x", (room.width || 60) / 2)
            .attr("y", (room.height || 40) / 2)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .attr("fill", "white")
            .attr("font-size", "12px")
            .attr("font-weight", "bold")
            .text(room.name || `Room ${index + 1}`);
      });
   }

   // Add layout builder tools (fixed position, not affected by main group transform)
   const toolsGroup = svg.append("g").attr("class", "layout-tools");

   // Extended tools background for floor controls
   const toolsBackground = toolsGroup.append("rect")
      .attr("x", 10)
      .attr("y", 10)
      .attr("width", 350)
      .attr("height", 50)
      .attr("fill", "white")
      .attr("stroke", "#dee2e6")
      .attr("stroke-width", 1)
      .attr("rx", 5)
      .attr("opacity", 0.95);

   // Floor Navigation Controls
   const floorControlsGroup = toolsGroup.append("g").attr("class", "floor-controls");

   // Floor Down button
   const floorDownBtn = floorControlsGroup.append("g")
      .attr("class", "floor-down-btn")
      .style("cursor", "pointer");

   floorDownBtn.append("rect")
      .attr("x", 20)
      .attr("y", 20)
      .attr("width", 30)
      .attr("height", 30)
      .attr("fill", "#17a2b8")
      .attr("stroke", "#138496")
      .attr("rx", 4);

   floorDownBtn.append("text")
      .attr("x", 35)
      .attr("y", 38)
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .text("↓");

   // Current floor indicator
   const floorIndicator = floorControlsGroup.append("g").attr("class", "floor-indicator");

   floorIndicator.append("rect")
      .attr("x", 55)
      .attr("y", 20)
      .attr("width", 40)
      .attr("height", 30)
      .attr("fill", "#f8f9fa")
      .attr("stroke", "#dee2e6")
      .attr("rx", 4);

   const floorText = floorIndicator.append("text")
      .attr("x", 75)
      .attr("y", 38)
      .attr("text-anchor", "middle")
      .attr("fill", "#495057")
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .text(`F${currentFloor}`);

   // Floor Up button
   const floorUpBtn = floorControlsGroup.append("g")
      .attr("class", "floor-up-btn")
      .style("cursor", "pointer");

   floorUpBtn.append("rect")
      .attr("x", 100)
      .attr("y", 20)
      .attr("width", 30)
      .attr("height", 30)
      .attr("fill", "#17a2b8")
      .attr("stroke", "#138496")
      .attr("rx", 4);

   floorUpBtn.append("text")
      .attr("x", 115)
      .attr("y", 38)
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .text("↑");

   // Add Room button
   const addRoomBtn = toolsGroup.append("g")
      .attr("class", "add-room-btn")
      .style("cursor", "pointer");

   addRoomBtn.append("rect")
      .attr("x", 140)
      .attr("y", 20)
      .attr("width", 80)
      .attr("height", 30)
      .attr("fill", "#28a745")
      .attr("stroke", "#1e7e34")
      .attr("rx", 4);

   addRoomBtn.append("text")
      .attr("x", 180)
      .attr("y", 38)
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .text("Add Room");

   // Back to Campus button
   const backBtn = toolsGroup.append("g")
      .attr("class", "back-btn")
      .style("cursor", "pointer");

   backBtn.append("rect")
      .attr("x", 230)
      .attr("y", 20)
      .attr("width", 80)
      .attr("height", 30)
      .attr("fill", "#6c757d")
      .attr("stroke", "#545b62")
      .attr("rx", 4);

   backBtn.append("text")
      .attr("x", 270)
      .attr("y", 38)
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .text("Back");

   // Floor management functionality
   let roomCounter = currentFloorData.rooms ? currentFloorData.rooms.length : 0;
   let isAddingRoom = false;

   // Floor navigation handlers
   floorUpBtn.on("click", () => {
      const newFloor = currentFloor + 1;
      // Create new floor if it doesn't exist
      if (!floors[newFloor]) {
         const newFloors = {
            ...floors,
            [newFloor]: { rooms: [], elements: [] }
         };
         updateFloorData(newFloors);
      }
      setCurrentFloor(newFloor);
   });

   floorDownBtn.on("click", () => {
      if (currentFloor > 1) {
         setCurrentFloor(currentFloor - 1);
      }
   });

   // Add room functionality
   addRoomBtn.on("click", () => {
      isAddingRoom = !isAddingRoom;
      addRoomBtn.select("rect")
         .attr("fill", isAddingRoom ? "#dc3545" : "#28a745");
      addRoomBtn.select("text")
         .text(isAddingRoom ? "Cancel" : "Add Room");
   });

   // Back button functionality
   backBtn.on("click", () => {
      setViewMode('campus');
   });

   // Room creation handler
   const handleRoomCreation = (x, y) => {
      if (!isAddingRoom) return;

      const currentData = getCurrentFloorData();
      const newRoom = {
         id: Math.max(0, ...(currentData.rooms || []).map(r => r.id || 0)) + 1,
         x: x - 40,
         y: y - 30,
         width: 80,
         height: 60,
         name: `Room ${roomCounter + 1}`,
         color: "#007bff",
         floor: currentFloor
      };

      const updatedRooms = [...(currentData.rooms || []), newRoom];
      const updatedFloors = {
         ...floors,
         [currentFloor]: {
            ...currentData,
            rooms: updatedRooms
         }
      };

      updateFloorData(updatedFloors);
      roomCounter++;

      // Turn off adding mode
      isAddingRoom = false;
      addRoomBtn.select("rect").attr("fill", "#28a745");
      addRoomBtn.select("text").text("Add Room");
   };

   // Click handlers for room placement
   if (buildingBounds) {
      // Use building grid for room placement
      mainGroup.selectAll(".grid-cell").on("click", function (event) {
         if (isAddingRoom) {
            const cellElement = d3.select(this);
            const x = parseFloat(cellElement.attr("x")) + parseFloat(cellElement.attr("width")) / 2;
            const y = parseFloat(cellElement.attr("y")) + parseFloat(cellElement.attr("height")) / 2;
            handleRoomCreation(x, y);
            event.stopPropagation();
         }
      });
   } else {
      // Fallback: Click handler for adding rooms on regular grid
      const gridSize = 20;
      mainGroup.on("click", function (event) {
         if (isAddingRoom) {
            const [x, y] = d3.pointer(event);
            const snappedX = Math.round(x / gridSize) * gridSize;
            const snappedY = Math.round(y / gridSize) * gridSize;
            handleRoomCreation(snappedX, snappedY);
         }
      });
   }

   // Make existing rooms draggable
   roomsGroup.selectAll("g[class*='room-']")
      .style("cursor", "move")
      .each(function () {
         addRoomDragBehavior(d3.select(this), buildingBounds, currentFloor, floors, updateFloorData);
      });

   // Add building info with floor information (fixed position)
   const infoGroup = svg.append("g").attr("class", "building-info");

   infoGroup.append("text")
      .attr("x", width - 10)
      .attr("y", 30)
      .attr("text-anchor", "end")
      .attr("fill", "#495057")
      .attr("font-size", "16px")
      .attr("font-weight", "bold")
      .text(`${building?.name || 'Unknown'} - Floor ${currentFloor}`);

   infoGroup.append("text")
      .attr("x", width - 10)
      .attr("y", 50)
      .attr("text-anchor", "end")
      .attr("fill", "#6c757d")
      .attr("font-size", "12px")
      .text(`${currentFloorData.rooms?.length || 0} rooms on this floor`);

   infoGroup.append("text")
      .attr("x", width - 10)
      .attr("y", 70)
      .attr("text-anchor", "end")
      .attr("fill", "#6c757d")
      .attr("font-size", "12px")
      .text("Multi-Floor Layout Builder");

   // Add zoom and pan behavior
   setupIndoorZoom(svg, mainGroup, 1);

   // Add updated instructions (fixed position)
   const instructionsGroup = svg.append("g").attr("class", "instructions");

   instructionsGroup.append("rect")
      .attr("x", 10)
      .attr("y", height - 120)
      .attr("width", 400)
      .attr("height", 100)
      .attr("fill", "white")
      .attr("stroke", "#dee2e6")
      .attr("stroke-width", 1)
      .attr("rx", 5)
      .attr("opacity", 0.95);

   instructionsGroup.append("text")
      .attr("x", 20)
      .attr("y", height - 100)
      .attr("fill", "#495057")
      .attr("font-size", "11px")
      .attr("font-weight", "bold")
      .text("Multi-Floor Instructions:");

   instructionsGroup.append("text")
      .attr("x", 20)
      .attr("y", height - 85)
      .attr("fill", "#6c757d")
      .attr("font-size", "10px")
      .text("• Use ↑↓ buttons to navigate floors • 'Add Room' then click to place");

   instructionsGroup.append("text")
      .attr("x", 20)
      .attr("y", height - 70)
      .attr("fill", "#6c757d")
      .attr("font-size", "10px")
      .text("• Drag rooms to reposition • Each floor has independent rooms");

   instructionsGroup.append("text")
      .attr("x", 20)
      .attr("y", height - 55)
      .attr("fill", "#6c757d")
      .attr("font-size", "10px")
      .text("• Floors auto-create when navigating up • Use zoom/scroll to navigate");

   instructionsGroup.append("text")
      .attr("x", 20)
      .attr("y", height - 40)
      .attr("fill", "#6c757d")
      .attr("font-size", "10px")
      .text("• Building structure applies to all floors");
};

// Helper function to add drag behavior to rooms
function addRoomDragBehavior(roomElement, buildingBounds, currentFloor, floors, updateFloorData, gridSize = 30) {
   const drag = d3.drag()
      .on("start", function (event) {
         roomElement.raise();
      })
      .on("drag", function (event) {
         let newX, newY;

         if (buildingBounds) {
            // Constrain movement within building bounds
            newX = Math.max(buildingBounds.minX, Math.min(buildingBounds.maxX - 80, event.x));
            newY = Math.max(buildingBounds.minY, Math.min(buildingBounds.maxY - 60, event.y));
         } else {
            // Snap to grid for regular grid mode
            newX = Math.round(event.x / gridSize) * gridSize;
            newY = Math.round(event.y / gridSize) * gridSize;
         }

         roomElement.attr("transform", `translate(${newX}, ${newY})`);
      })
      .on("end", function (event) {
         // Update room position in floors data
         const roomClass = roomElement.attr("class");
         const roomId = parseInt(roomClass.replace("room-", ""));

         const currentFloorData = floors[currentFloor] || { rooms: [], elements: [] };
         const updatedRooms = currentFloorData.rooms.map(room => {
            if (room.id === roomId) {
               const transform = roomElement.attr("transform");
               const matches = transform.match(/translate\(([^,]+),([^)]+)\)/);
               if (matches) {
                  return {
                     ...room,
                     x: parseFloat(matches[1]),
                     y: parseFloat(matches[2])
                  };
               }
            }
            return room;
         });

         const updatedFloors = {
            ...floors,
            [currentFloor]: {
               ...currentFloorData,
               rooms: updatedRooms
            }
         };

         updateFloorData(updatedFloors);
      });

   roomElement.call(drag);
}

function getBuildingBounds(pathString) {
   const tempSvg = d3.select(document.body)
      .append("svg")
      .style("position", "absolute")
      .style("visibility", "hidden");
      
   const tempPath = tempSvg.append("path").attr("d", pathString);
   const bbox = tempPath.node().getBBox();
   tempSvg.remove();

   return {
      minX: bbox.x,
      minY: bbox.y,
      width: bbox.width,
      height: bbox.height,
      maxX: bbox.x + bbox.width,
      maxY: bbox.y + bbox.height,
      centerX: bbox.x + bbox.width / 2,
      centerY: bbox.y + bbox.height / 2
   };
}

function getBuildingRotation(pathString, bounds) {
   const pathData = parsePathData(pathString);
   const edges = extractEdges(pathData);

   const angles = edges.map(edge => calculateEdgeAngle(edge));
   const dominantAngle = findDominantAngle(angles);

   const threshold = 15; // degrees
   const cardinalAngles = [0, 90, 180, 270]; // 0° = horizontal, 90° = vertical

   let needsRotation = true;
   let correctionAngle = 0;

   for (let cardinal of cardinalAngles) {
      const angleDiff = Math.abs(((dominantAngle - cardinal + 180) % 360) - 180);
      if (angleDiff <= threshold) {
         needsRotation = false;
         break;
      }
   }

   if (needsRotation) {
      let nearestCardinal = cardinalAngles.reduce((prev, curr) => {
         const prevDiff = Math.abs(((dominantAngle - prev + 180) % 360) - 180);
         const currDiff = Math.abs(((dominantAngle - curr + 180) % 360) - 180);
         return currDiff < prevDiff ? curr : prev;
      });

      correctionAngle = nearestCardinal - dominantAngle;
   }

   return {
      needsRotation,
      angle: correctionAngle,
      originalAngle: dominantAngle
   };
}

function parsePathData(pathString) {
   const commands = [];
   const regex = /([MLZ])\s*([^MLZ]*)/gi;
   let match;

   while ((match = regex.exec(pathString)) !== null) {
      const command = match[1].toUpperCase();
      const params = match[2].trim();

      if (params) {
         const coords = params.split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
         commands.push({ command, coords });
      } else {
         commands.push({ command, coords: [] });
      }
   }

   return commands;
}

function extractEdges(pathData) {
   const edges = [];
   let currentPoint = { x: 0, y: 0 };
   let startPoint = { x: 0, y: 0 };

   for (let cmd of pathData) {
      switch (cmd.command) {
         case 'M':
            if (cmd.coords.length >= 2) {
               currentPoint = { x: cmd.coords[0], y: cmd.coords[1] };
               startPoint = { ...currentPoint };
            }
            break;
         case 'L':
            if (cmd.coords.length >= 2) {
               const newPoint = { x: cmd.coords[0], y: cmd.coords[1] };
               edges.push({
                  start: { ...currentPoint },
                  end: { ...newPoint }
               });
               currentPoint = newPoint;
            }
            break;
         case 'Z':
            if (currentPoint.x !== startPoint.x || currentPoint.y !== startPoint.y) {
               edges.push({
                  start: { ...currentPoint },
                  end: { ...startPoint }
               });
            }
            break;
      }
   }

   return edges;
}

function calculateEdgeAngle(edge) {
   const dx = edge.end.x - edge.start.x;
   const dy = edge.end.y - edge.start.y;
   let angle = Math.atan2(dy, dx) * 180 / Math.PI;

   if (angle < 0) angle += 180;
   if (angle >= 180) angle -= 180;

   return angle;
}

function findDominantAngle(angles) {
   const angleGroups = {};
   const tolerance = 10; // degrees

   for (let angle of angles) {
      let found = false;
      for (let groupAngle in angleGroups) {
         if (Math.abs(angle - parseFloat(groupAngle)) <= tolerance) {
            angleGroups[groupAngle].push(angle);
            found = true;
            break;
         }
      }
      if (!found) {
         angleGroups[angle] = [angle];
      }
   }
   let dominantGroup = null;
   let maxCount = 0;

   for (let groupAngle in angleGroups) {
      if (angleGroups[groupAngle].length > maxCount) {
         maxCount = angleGroups[groupAngle].length;
         dominantGroup = angleGroups[groupAngle];
      }
   }
   return dominantGroup ? dominantGroup.reduce((sum, a) => sum + a, 0) / dominantGroup.length : 0;
}

function rotatePathToUpright(pathString, bounds, rotationAngle) {
   const pathData = parsePathData(pathString);
   const centerX = bounds.centerX;
   const centerY = bounds.centerY;
   const radians = rotationAngle * Math.PI / 180;

   let newPath = "";

   for (let cmd of pathData) {
      newPath += cmd.command;

      if (cmd.coords.length >= 2) {
         for (let i = 0; i < cmd.coords.length; i += 2) {
            const x = cmd.coords[i];
            const y = cmd.coords[i + 1];

            const rotatedX = centerX + (x - centerX) * Math.cos(radians) - (y - centerY) * Math.sin(radians);
            const rotatedY = centerY + (x - centerX) * Math.sin(radians) + (y - centerY) * Math.cos(radians);

            newPath += ` ${rotatedX.toFixed(2)} ${rotatedY.toFixed(2)}`;
         }
      }

      newPath += " ";
   }

   return newPath.trim();
}

function createBuildingGrid(mapGroup, buildingPath, bounds, gridSize, scale) {
   const gridGroup = mapGroup.append("g").attr("class", "building-grid");

   for (let x = bounds.minX; x <= bounds.maxX; x += gridSize) {
      for (let y = bounds.minY; y <= bounds.maxY; y += gridSize) {
         if (isPointInBuilding(x, y, buildingPath)) {
            const gridCell = gridGroup.append("rect")
               .attr("x", x - gridSize / 2)
               .attr("y", y - gridSize / 2)
               .attr("width", gridSize)
               .attr("height", gridSize)
               .attr("fill", "#e9ecef")
               .attr("stroke", "#ced4da")
               .attr("stroke-width", 0.5 / scale)
               .attr("opacity", 0.7)
               .attr("class", "grid-cell")
               .style("cursor", "pointer");

            gridCell
               .on("mouseenter", function () {
                  d3.select(this)
                     .attr("fill", "#007bff")
                     .attr("opacity", 0.8);
               })
               .on("mouseleave", function () {
                  d3.select(this)
                     .attr("fill", "#e9ecef")
                     .attr("opacity", 0.7);
               });

            gridCell.attr("data-grid-x", Math.floor((x - bounds.minX) / gridSize))
               .attr("data-grid-y", Math.floor((y - bounds.minY) / gridSize));
         }
      }
   }
}

function isPointInBuilding(x, y, buildingPath) {
   const tempSvg = d3.select(document.body)
      .append("svg")
      .style("position", "absolute")
      .style("visibility", "hidden");

   const tempPath = tempSvg.append("path").attr("d", buildingPath);
   const pathNode = tempPath.node();
   const svgPoint = tempSvg.node().createSVGPoint();
   svgPoint.x = x;
   svgPoint.y = y;

   const isInside = pathNode.isPointInFill(svgPoint);
   tempSvg.remove();

   return isInside;
}

function addBackButton(svg, containerWidth, containerHeight, setViewMode) {
   const backButton = svg.append("g")
      .attr("class", "back-button")
      .style("cursor", "pointer");

   backButton.append("rect")
      .attr("x", 20)
      .attr("y", 20)
      .attr("width", 100)
      .attr("height", 40)
      .attr("rx", 5)
      .attr("fill", "#6c757d")
      .attr("stroke", "#495057")
      .attr("stroke-width", 1);

   backButton.append("text")
      .attr("x", 70)
      .attr("y", 45)
      .attr("text-anchor", "middle")
      .attr("font-size", 14)
      .attr("fill", "white")
      .attr("font-weight", "bold")
      .text("← Back");

   backButton
      .on("mouseenter", function () {
         d3.select(this).select("rect").attr("fill", "#5a6268");
      })
      .on("mouseleave", function () {
         d3.select(this).select("rect").attr("fill", "#6c757d");
      })
      .on("click", function () {
         console.log("Back button clicked - switch to campus view");
         setViewMode('campus');
      });
}

function setupIndoorZoom(svg, mapGroup, initialScale) {
   const zoom = d3.zoom()
      .scaleExtent([0.5, 5])
      .on("zoom", function (event) {
         mapGroup.attr("transform", event.transform);
      });

   svg.call(zoom);

   const zoomControls = svg.append("g")
      .attr("class", "zoom-controls")
      .attr("transform", "translate(20, 80)");

   const zoomInButton = zoomControls.append("g")
      .attr("class", "zoom-in-btn")
      .style("cursor", "pointer");

   zoomInButton.append("rect")
      .attr("width", 40)
      .attr("height", 40)
      .attr("fill", "#007bff")
      .attr("stroke", "#0056b3")
      .attr("rx", 5);

   zoomInButton.append("text")
      .attr("x", 20)
      .attr("y", 28)
      .attr("text-anchor", "middle")
      .attr("font-size", 20)
      .attr("fill", "white")
      .attr("font-weight", "bold")
      .text("+");

   const zoomOutButton = zoomControls.append("g")
      .attr("class", "zoom-out-btn")
      .attr("transform", "translate(0, 50)")
      .style("cursor", "pointer");

   zoomOutButton.append("rect")
      .attr("width", 40)
      .attr("height", 40)
      .attr("fill", "#007bff")
      .attr("stroke", "#0056b3")
      .attr("rx", 5);

   zoomOutButton.append("text")
      .attr("x", 20)
      .attr("y", 28)
      .attr("text-anchor", "middle")
      .attr("font-size", 20)
      .attr("fill", "white")
      .attr("font-weight", "bold")
      .text("−");

   zoomInButton.on("click", function () {
      svg.transition().duration(300).call(zoom.scaleBy, 1.5);
   });

   zoomOutButton.on("click", function () {
      svg.transition().duration(300).call(zoom.scaleBy, 1 / 1.5);
   });
}
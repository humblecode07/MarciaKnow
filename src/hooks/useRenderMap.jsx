import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3';
import { useLocation } from 'react-router-dom';

const useRenderMap = (svgRef, buildings, selectedBuilding, onSelectBuilding, mode, coordinates, onPositionSelect, selectedKiosk, currentPath, setCurrentPath, isLoadingBuildings) => {
   const location = useLocation();
   const path = location.pathname;

   const zoomTransformRef = useRef(d3.zoomIdentity);
   const zoomBehaviorRef = useRef(null);

   const [x, setX] = useState(0);
   const [y, setY] = useState(0);

   const isValidCoordinate = (coord) => {
      return typeof coord === 'number' && !isNaN(coord) && isFinite(coord);
   };

   const isValidPoint = (point) => {
      return point && isValidCoordinate(point.x) && isValidCoordinate(point.y);
   };

   // coords of kiosk for edit kiosk mode
   useEffect(() => {

      if (isLoadingBuildings || !svgRef.current || buildings.length === 0) return;

      if (path.includes("edit-kiosk") && coordinates) {
         setX(coordinates.x);
         setY(coordinates.y);
      }
   }, [path, coordinates]);

   // Helper function to calculate bounding box of path points
   const getPathBounds = (pathPoints) => {
      if (!pathPoints || pathPoints.length === 0) return null;

      const xCoords = pathPoints.map(p => p.x);
      const yCoords = pathPoints.map(p => p.y);

      return {
         minX: Math.min(...xCoords),
         maxX: Math.max(...xCoords),
         minY: Math.min(...yCoords),
         maxY: Math.max(...yCoords)
      };
   };

   // Function to zoom to fit the navigation path
   const zoomToPath = (pathPoints, svg, zoomBehavior, padding = 50) => {
      if (!pathPoints || pathPoints.length === 0 || !svg || !zoomBehavior) return;

      const bounds = getPathBounds(pathPoints);
      if (!bounds) return;

      // Get SVG dimensions
      const svgNode = svg.node();
      const svgRect = svgNode.getBoundingClientRect();
      const svgWidth = svgRect.width;
      const svgHeight = svgRect.height;

      // Calculate path dimensions
      const pathWidth = bounds.maxX - bounds.minX;
      const pathHeight = bounds.maxY - bounds.minY;

      // Add padding to the bounds
      const paddedWidth = pathWidth + (padding * 2);
      const paddedHeight = pathHeight + (padding * 2);

      // Calculate scale to fit the path within the SVG
      const scaleX = svgWidth / paddedWidth;
      const scaleY = svgHeight / paddedHeight;
      const scale = Math.min(scaleX, scaleY, 3); // Don't exceed max zoom level

      // Calculate center point of the path
      const centerX = bounds.minX + (pathWidth / 2);
      const centerY = bounds.minY + (pathHeight / 2);

      // Calculate translation to center the path
      const translateX = (svgWidth / 2) - (centerX * scale);
      const translateY = (svgHeight / 2) - (centerY * scale);

      // Create the transform
      const transform = d3.zoomIdentity
         .translate(translateX, translateY)
         .scale(scale);

      // Apply the transform with smooth transition
      svg.transition()
         .duration(1000)
         .call(zoomBehavior.transform, transform);
   };

   useEffect(() => {
      if (!svgRef.current || buildings.length === 0) return;

      // Clear any existing content
      d3.select(svgRef.current).selectAll("*").remove();

      // Get dimensions
      const svg = d3.select(svgRef.current);

      // Create a group for all map elements
      const g = svg.append("g");

      // Apply any existing transform that was stored in the ref
      g.attr("transform", zoomTransformRef.current);

      // Track the current transform state
      let currentTransform = d3.zoomIdentity;

      // Add background
      const backgroundRect = g.append("rect")
         .attr("width", 5000)
         .attr("height", 5000)
         .attr("fill", "#FBFCF8")
         .attr("pointer-events", "all"); // Ensure we can catch events on the background

      // Define pathways/lines
      const pathways = [
         {
            id: "pathway-1",
            name: "Main Pathway",
            description: "Central campus pathway",
            path: "M101.504 780.06L90.0001 780.06L90.5 688L150 634.5L157.5 627L159.243 625.19C166.589 617.562 171.555 607.961 173.537 597.558V597.558C174.177 594.194 174.5 590.776 174.5 587.351L174.5 321.707C174.5 317.846 176.489 314.257 179.763 312.211V312.211C181.551 311.093 183.619 310.503 185.727 310.508L377 311L535.5 391.5L533 396",
         },
         {
            id: "pathway-2",
            name: "East Path",
            description: "Path connecting east campus buildings",
            path: "M81.0102 196.5L130 196.5L130 588.5V588.5C130 592.991 128.26 597.307 125.145 600.542L117 609L103 623L70 653.5L49.5 644L49.5001 642.5",
         }
      ];

      // Add pathways/lines first (so they appear under buildings)
      pathways.forEach(pathway => {
         g.append("path")
            .attr("d", pathway.path)
            .attr("fill", "none")
            .attr("stroke", "#1a237e")
            .attr("stroke-width", 1)
            .attr("id", pathway.id)
            .attr("data-name", pathway.name)
            .attr("data-description", pathway.description)
            .attr("cursor", "pointer")
            .on("click", function (event) {
               event.stopPropagation();

               // Reset all buildings to default color
               g.selectAll("path[id^='building-']")
                  .attr("fill", "#FFFFFF")
                  .attr("stroke", "#1a237e");

               // Reset all pathways to default
               g.selectAll("path[id^='pathway-']")
                  .attr("stroke", "#555555")
                  .attr("stroke-width", 1);

               // Highlight selected pathway
               d3.select(this)
                  .attr("stroke", "#FF0000")
                  .attr("stroke-width", 1);

               onSelectBuilding({
                  name: d3.select(this).attr("data-name"),
                  description: d3.select(this).attr("data-description"),
               });
            })
            .on("mouseover", function () {
               if (!selectedBuilding || d3.select(this).attr("data-name") !== selectedBuilding.name) {
                  d3.select(this).attr("stroke", "#777777").attr("stroke-width", 1);
               }
            })
            .on("mouseout", function () {
               if (!selectedBuilding || d3.select(this).attr("data-name") !== selectedBuilding.name) {
                  d3.select(this).attr("stroke", "#555555").attr("stroke-width", 1);
               }
            });
      });

      // Add buildings as paths
      buildings.forEach(building => {
         const buildingPath = g.append("path")
            .attr("d", building.path)
            .attr("fill", 'transparent')
            .attr("stroke", "#1a237e")
            .attr("id", building.id)
            .attr("data-name", building.name)
            .attr("data-description", building.description);

         // Check if we're in kiosk-mode before adding interactive features
         if (mode === import.meta.env.VITE_TEST_KIOSK || mode === import.meta.env.VITE_CLIENT_KIOSK) {
            buildingPath
               .attr("cursor", "pointer")
               .on("click", function (event) {
                  event.stopPropagation();

                  // Reset all pathways to default
                  g.selectAll("path[id^='pathway-']")
                     .attr("stroke", "#555555")
                     .attr("stroke-width", 1);

                  // Highlight selected building
                  g.selectAll("path[id^='building-']")
                     .attr("fill", "#FFFFFF")
                     .attr("stroke", "#1a237e");

                  d3.select(this).attr("fill", "#A05A2C");

                  onSelectBuilding({
                     name: d3.select(this).attr("data-name"),
                     description: d3.select(this).attr("data-description"),
                     existingRoom: building.existingRoom,
                     image: building.image,
                     numOfFloors: building.numberOfFloor,
                     _id: building._id,
                     navigationGuide: building.navigationGuide,
                     navigationPath: building.navigationPath
                  });


                  // Don't reset zoom when selecting a building
               })
               .on("mouseover", function () {
                  if (!selectedBuilding || d3.select(this).attr("id") !== selectedBuilding.id) {
                     d3.select(this).attr("fill", "#fff8e1");
                     d3.select(this).attr("stroke", "#ffc107");
                  }
               })
               .on("mouseout", function () {
                  if (!selectedBuilding || d3.select(this).attr("id") !== selectedBuilding.id) {
                     d3.select(this).attr("fill", "#FFFFFF");
                     d3.select(this).attr("stroke", "#1a237e");
                  }
               });
         }
         else {
            // In other modes (like add-kiosk), just set default cursor
            buildingPath.attr("cursor", "default");
         }

         // Add building labels
         const bbox = buildingPath.node()?.getBBox();

         if (bbox) {
            g.append("text")
               .attr("x", bbox.x + bbox.width / 2)
               .attr("y", bbox.y + bbox.height / 2)
               .attr("text-anchor", "middle")
               .attr("fill", "black")
               .attr("pointer-events", "none")
               .text(building.id);
         }
      });

      // Create a marker container for position indicators
      const markerGroup = g.append("g")
         .attr("class", "marker-container");

      // Set marker visibility based on mode
      if (mode === import.meta.env.VITE_ADD_KIOSK) {
         markerGroup.style("visibility", "hidden");
      }
      else if (mode === import.meta.env.VITE_EDIT_KIOSK) {
         markerGroup.attr("transform", `translate(${x}, ${y})`);
         markerGroup.style("visibility", "visible");
      }
      else {
         markerGroup.style("visibility", "hidden");
      }

      // Create the pulsing circle with animations
      markerGroup.append("circle")
         .attr("r", 25)
         .attr("fill", "none")
         .attr("stroke", "#ff0000")
         .attr("stroke-width", 3);

      // Add animations
      markerGroup.select("circle")
         .append("animate")
         .attr("attributeName", "r")
         .attr("values", "20;30;20")
         .attr("dur", "2s")
         .attr("repeatCount", "indefinite");

      markerGroup.select("circle")
         .append("animate")
         .attr("attributeName", "opacity")
         .attr("values", "1;0.5;1")
         .attr("dur", "2s")
         .attr("repeatCount", "indefinite");

      markerGroup.append("circle")
         .attr("r", 8)
         .attr("fill", "#ff0000")
         .attr("stroke", "none");

      // Handle path drawing functionality in ADD_ROOM mode
      if (mode === import.meta.env.VITE_ADD_ROOM || mode === import.meta.env.VITE_TEST_KIOSK || mode === import.meta.env.VITE_QR_CODE_KIOSK || mode === import.meta.env.VITE_CLIENT_KIOSK) {
         // Remove any existing temporary paths and markers
         g.selectAll(".temp-path").remove();
         g.selectAll(".path-point-marker").remove();

         // Create enhanced navigation path with gradient and glow effects
         const createEnhancedPath = () => {
            // Create gradient definitions
            const defs = g.append("defs");

            // Create gradient for the main path
            const gradient = defs.append("linearGradient")
               .attr("id", "pathGradient")
               .attr("gradientUnits", "userSpaceOnUse");

            gradient.append("stop")
               .attr("offset", "0%")
               .attr("stop-color", "#667eea")
               .attr("stop-opacity", 0.9);

            gradient.append("stop")
               .attr("offset", "100%")
               .attr("stop-color", "#764ba2")
               .attr("stop-opacity", 0.9);

            // Create a filter for glow effect
            const filter = defs.append("filter")
               .attr("id", "glow")
               .attr("x", "-50%")
               .attr("y", "-50%")
               .attr("width", "200%")
               .attr("height", "200%");

            filter.append("feGaussianBlur")
               .attr("stdDeviation", "3")
               .attr("result", "coloredBlur");

            const feMerge = filter.append("feMerge");
            feMerge.append("feMergeNode").attr("in", "coloredBlur");
            feMerge.append("feMergeNode").attr("in", "SourceGraphic");

            // Create shadow path (background glow)
            const shadowPath = g.append("path")
               .attr("class", "temp-path shadow-path")
               .attr("fill", "none")
               .attr("stroke", "#667eea")
               .attr("stroke-width", 8)
               .attr("stroke-opacity", 0.3)
               .attr("filter", "url(#glow)");

            // Create main navigation path with gradient
            const mainPath = g.append("path")
               .attr("class", "temp-path main-path")
               .attr("fill", "none")
               .attr("stroke", "url(#pathGradient)")
               .attr("stroke-width", 5)
               .attr("stroke-linecap", "round")
               .attr("stroke-linejoin", "round");

            // Create animated dashed overlay for movement effect
            const animatedPath = g.append("path")
               .attr("class", "temp-path animated-path")
               .attr("fill", "none")
               .attr("stroke", "#ffffff")
               .attr("stroke-width", 2)
               .attr("stroke-dasharray", "8,12")
               .attr("stroke-linecap", "round")
               .attr("opacity", 0.8);

            // Animate the dashed line
            animatedPath
               .append("animateTransform")
               .attr("attributeName", "stroke-dashoffset")
               .attr("values", "0;20")
               .attr("dur", "2s")
               .attr("repeatCount", "indefinite");

            return { shadowPath, mainPath, animatedPath };
         };

         const pathElements = createEnhancedPath();

         // Update path display with current path points
         const updatePath = () => {

            const validPath = currentPath?.filter(isValidPoint) || [];

            if (validPath.length < 2) {
               pathElements.shadowPath.attr("d", "");
               pathElements.mainPath.attr("d", "");
               pathElements.animatedPath.attr("d", "");
               return;
            }

            try {
               // Create a smooth curved line generator
               const lineGenerator = d3.line()
                  .x(d => d.x)
                  .y(d => d.y)
                  .curve(d3.curveCardinal.tension(0.3))
                  .defined(d => isValidPoint(d)); // Only include defined points

               const pathData = lineGenerator(validPath);

               // Additional check to ensure pathData is valid
               if (pathData && !pathData.includes('NaN')) {
                  pathElements.shadowPath.attr("d", pathData);
                  pathElements.mainPath.attr("d", pathData);
                  pathElements.animatedPath.attr("d", pathData);
               } else {
                  console.warn('Generated path contains NaN values, skipping update');
               }

               updatePointMarkers();
            } catch (error) {
               console.error('Error updating path:', error);
            }
         };

         if (selectedKiosk) {
            renderDestinationMarker(g, selectedKiosk.coordinates.x, selectedKiosk.coordinates.y, "#6366f1", "You Are Here");
         }

         // Add enhanced markers for path points
         const updatePointMarkers = () => {
            // Remove existing point markers
            g.selectAll(".path-point-marker").remove();
            g.selectAll(".destination-marker").remove();

            // Add point markers with enhanced styling
            currentPath.forEach((point, index) => {
               // For the first point (start), use purple marker
               if (index === 0) {
                  renderDestinationMarker(g, point.x, point.y, "#6366f1", "You Are Here");
               }
               // For the last point (destination), use complementary purple
               else if (index === currentPath.length - 1) {
                  renderDestinationMarker(g, point.x, point.y, "#8b5cf6", "Destination");
               }
               // For intermediate points, use subtle waypoint markers
               else {
                  const waypointGroup = g.append("g")
                     .attr("class", "path-point-marker waypoint")
                     .attr("transform", `translate(${point.x}, ${point.y})`);

                  // Outer glow circle
                  waypointGroup.append("circle")
                     .attr("r", 8)
                     .attr("fill", "#667eea")
                     .attr("opacity", 0.3);

                  // Inner circle
                  waypointGroup.append("circle")
                     .attr("r", 4)
                     .attr("fill", "#667eea")
                     .attr("stroke", "#ffffff")
                     .attr("stroke-width", 2);

                  // Add subtle pulse animation
                  waypointGroup.select("circle:first-child")
                     .append("animate")
                     .attr("attributeName", "r")
                     .attr("values", "6;12;6")
                     .attr("dur", "3s")
                     .attr("repeatCount", "indefinite");
               }
            });
         };

         if (mode === import.meta.env.VITE_ADD_ROOM) {
            // Click handler for adding path points
            const handlePathClick = (event) => {
               if (event.defaultPrevented) return;

               event.preventDefault();
               event.stopPropagation();

               try {
                  const svgPoint = svg.node().createSVGPoint();
                  svgPoint.x = event.clientX;
                  svgPoint.y = event.clientY;

                  const matrix = g.node().getScreenCTM()?.inverse();
                  if (!matrix) {
                     console.warn('Could not get transformation matrix');
                     return;
                  }

                  const transformedPoint = svgPoint.matrixTransform(matrix);

                  // Validate the transformed coordinates
                  if (isValidPoint(transformedPoint)) {
                     setCurrentPath(prev => [...prev, {
                        x: transformedPoint.x,
                        y: transformedPoint.y
                     }]);
                  } else {
                     console.warn('Invalid coordinates calculated:', transformedPoint);
                  }
               } catch (error) {
                  console.error('Error handling path click:', error);
               }
            };

            // Add click handler to background for path creation
            if (backgroundRect.size() > 0) {
               backgroundRect.on("click", handlePathClick);
            }
         }

         // Initial update of path display
         updatePath();
      }
      else {
         g.selectAll(".temp-path").remove();
         g.selectAll(".path-point-marker").remove();
      }

      // Create a SINGLE zoom behavior - this is crucial
      const zoom = d3.zoom()
         .scaleExtent([0.5, 3])
         .on("zoom", (event) => {
            // Store the current transform in the ref
            zoomTransformRef.current = event.transform;
            g.attr("transform", event.transform);
         });

      // Store zoom behavior in ref for external access
      zoomBehaviorRef.current = zoom;

      // Apply zoom behavior to SVG
      svg.call(zoom);

      // Handle click events on the SVG
      svg.on("click", (event) => {
         // Don't process clicks if in ADD_ROOM mode (handled by handlePathClick)
         if (mode === import.meta.env.VITE_ADD_ROOM) return;

         const [rawX, rawY] = d3.pointer(event, svg.node());

         // Get the current zoom transform
         const currentTransform = d3.zoomTransform(svg.node());

         // Apply the inverse transform to get coordinates in the original coordinate space
         const transformedX = currentTransform.invertX(rawX);
         const transformedY = currentTransform.invertY(rawY);

         // If in add kiosk mode, show the marker
         if (mode === import.meta.env.VITE_ADD_KIOSK) {
            // Update state
            setX(transformedX);
            setY(transformedY);

            onPositionSelect(transformedX, transformedY);

            // Update marker position and make it visible
            markerGroup
               .attr("transform", `translate(${transformedX}, ${transformedY})`)
               .style("visibility", "visible");
         }
         else {
            markerGroup.style("visibility", "hidden");

            g.selectAll("path[id^='building-']")
               .attr("fill", "#FFFFFF");
            g.selectAll("path[id^='pathway-']")
               .attr("stroke", "#555555")
               .attr("stroke-width", 1);
            onSelectBuilding(null);
         }
      });

      // This is important - if x and y change (from external state), update the marker position
      // but don't reset the zoom
      if (x !== 0 && y !== 0 && (mode === import.meta.env.VITE_ADD_KIOSK || mode === import.meta.env.VITE_EDIT_KIOSK)) {
         markerGroup
            .attr("transform", `translate(${x}, ${y})`)
            .style("visibility", "visible");
      }

      // Auto-zoom to navigation path when it's displayed
      if (currentPath && currentPath.length >= 2 &&
         (mode === import.meta.env.VITE_TEST_KIOSK ||
            mode === import.meta.env.VITE_QR_CODE_KIOSK ||
            mode === import.meta.env.VITE_CLIENT_KIOSK)) {
         // Add a small delay to ensure the path is rendered first
         setTimeout(() => {
            zoomToPath(currentPath, svg, zoom, 100); // 100px padding around the path
         }, 100);
      }

      return () => {
         // Remove event handlers on cleanup
         svg.on("click", null);
         if (backgroundRect && backgroundRect.size() > 0) {
            backgroundRect.on("click", null);
         }
      };
   }, [svgRef, selectedBuilding, onSelectBuilding, buildings, mode, onPositionSelect, x, y, currentPath, setCurrentPath, selectedKiosk, isLoadingBuildings])

   useEffect(() => {
      if (selectedKiosk &&
         (mode === import.meta.env.VITE_ADD_ROOM ||
            mode === import.meta.env.VITE_TEST_KIOSK ||
            mode === import.meta.env.VITE_QR_CODE_KIOSK ||
            mode === import.meta.env.VITE_CLIENT_KIOSK)) {

         // Validate coordinates before setting path
         const coords = selectedKiosk.coordinates;
         if (coords && isValidCoordinate(coords.x) && isValidCoordinate(coords.y)) {
            setCurrentPath([{
               x: coords.x,
               y: coords.y
            }]);
         } else {
            console.warn('Invalid selectedKiosk coordinates:', coords);
            setCurrentPath([]);
         }
      }
   }, [selectedKiosk, mode, setCurrentPath]);

   // Enhanced helper function for rendering destination markers
   const renderDestinationMarker = (g, x, y, color, label) => {
      // Create a group for the marker
      const markerGroup = g.append("g")
         .attr("class", "destination-marker saved-path")
         .attr("transform", `translate(${x}, ${y})`);

      // Create gradient for the pin
      const defs = g.select("defs").size() > 0 ? g.select("defs") : g.append("defs");

      const pinGradient = defs.append("radialGradient")
         .attr("id", `pinGradient-${x}-${y}`)
         .attr("cx", "30%")
         .attr("cy", "30%");

      pinGradient.append("stop")
         .attr("offset", "0%")
         .attr("stop-color", d3.color(color).brighter(0.3));

      pinGradient.append("stop")
         .attr("offset", "100%")
         .attr("stop-color", color);

      // Create shadow for depth
      markerGroup.append("ellipse")
         .attr("cx", 2)
         .attr("cy", 18)
         .attr("rx", 12)
         .attr("ry", 4)
         .attr("fill", "rgba(0,0,0,0.2)");

      // Create enhanced teardrop/pin shape
      markerGroup.append("path")
         .attr("d", `
         M0,-28
         C12,-28 20,-20 20,-8
         C20,6 0,20 0,20
         C0,20 -20,6 -20,-8
         C-20,-20 -12,-28 0,-28
         Z
         `)
         .attr("fill", `url(#pinGradient-${x}-${y})`)
         .attr("stroke", "#ffffff")
         .attr("stroke-width", 2)
         .attr("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.3))");

      // Add inner highlight circle
      markerGroup.append("circle")
         .attr("cy", -16)
         .attr("r", 6)
         .attr("fill", "#ffffff")
         .attr("opacity", 0.9);

      // Add a small inner dot for the pin hole effect
      markerGroup.append("circle")
         .attr("cy", -16)
         .attr("r", 2)
         .attr("fill", color);

      // Add subtle pulse animation to the pin
      markerGroup.select("path")
         .append("animateTransform")
         .attr("attributeName", "transform")
         .attr("type", "scale")
         .attr("values", "1;1.1;1")
         .attr("dur", "2s")
         .attr("repeatCount", "indefinite");

      // Enhanced label with better styling
      if (label && label !== "") {
         const labelGroup = markerGroup.append("g")
            .attr("class", "marker-label");

         // Label background for better readability
         const labelText = labelGroup.append("text")
            .attr("y", 32)
            .attr("text-anchor", "middle")
            .attr("font-size", "11px")
            .attr("font-weight", "600")
            .attr("font-family", "system-ui, -apple-system, sans-serif")
            .text(label);

         // Get text dimensions for background
         const textBBox = labelText.node().getBBox();

         // Add background rectangle
         labelGroup.insert("rect", "text")
            .attr("x", textBBox.x - 4)
            .attr("y", textBBox.y - 2)
            .attr("width", textBBox.width + 8)
            .attr("height", textBBox.height + 4)
            .attr("rx", 4)
            .attr("fill", "rgba(255, 255, 255, 0.9)")
            .attr("stroke", color)
            .attr("stroke-width", 1);

         // Style the text
         labelText
            .attr("fill", color)
            .attr("paint-order", "stroke");
      }

      return markerGroup;
   };

   // Expose the zoom function for external use (optional)
   const zoomToNavigationPath = (pathPoints, padding = 100) => {
      const svg = d3.select(svgRef.current);
      if (zoomBehaviorRef.current && svg && pathPoints && pathPoints.length >= 2) {
         zoomToPath(pathPoints, svg, zoomBehaviorRef.current, padding);
      }
   };

   // Return the zoom function in case parent component wants to trigger it manually
   return { zoomToNavigationPath };
}

export default useRenderMap
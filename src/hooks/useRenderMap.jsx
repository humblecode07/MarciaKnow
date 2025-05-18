import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3';
import { useLocation } from 'react-router-dom';

const useRenderMap = (svgRef, buildings, selectedBuilding, onSelectBuilding, mode, coordinates, onPositionSelect, selectedKiosk, currentPath, setCurrentPath) => {
   const location = useLocation();
   const path = location.pathname;

   const zoomTransformRef = useRef(d3.zoomIdentity);

   const [x, setX] = useState(0);
   const [y, setY] = useState(0);

   // coords of kiosk for edit kiosk mode
   useEffect(() => {
      if (path.includes("edit-kiosk") && coordinates) {
         setX(coordinates.x);
         setY(coordinates.y);
      }
   }, [path, coordinates]);


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
         if (mode === undefined) {
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
                     numOfFloors: building.numberOfFloor
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
      if (mode === import.meta.env.VITE_ADD_ROOM) {
         // Remove any existing temporary paths and markers
         g.selectAll(".temp-path").remove();
         g.selectAll(".path-point-marker").remove();

         console.log(currentPath);

         // Create a new temporary path for drawing
         let drawingPath = g.append("path")
            .attr("class", "temp-path")
            .attr("fill", "none")
            .attr("stroke", 'black')
            .attr("stroke-width", 3)
            .attr("stroke-dasharray", "5,5");

         // Update path display with current path points
         const updatePath = () => {
            if (currentPath.length < 2) {
               drawingPath.attr("d", "");
               return;
            }

            // Create a D3 line generator
            const lineGenerator = d3.line()
               .x(d => d.x)
               .y(d => d.y)
               .curve(d3.curveCardinal); // Smooths the line

            drawingPath.attr("d", lineGenerator(currentPath));
            updatePointMarkers();
         };

         if (selectedKiosk) {
            renderDestinationMarker(g, selectedKiosk.coordinates.x, selectedKiosk.coordinates.y, "#FF5722", "You Are Here");
         }

         // Add markers for path points
         const updatePointMarkers = () => {
            // Remove existing point markers
            g.selectAll(".path-point-marker").remove();
            g.selectAll(".destination-marker").remove();

            // Add point markers
            currentPath.forEach((point, index) => {
               // For the first point (start), use orange marker
               if (index === 0) {
                  renderDestinationMarker(g, point.x, point.y, "#FF5722", "You Are Here");
               }
               // For the last point (destination), use teal marker
               else if (index === currentPath.length - 1) {
                  renderDestinationMarker(g, point.x, point.y, "#009688", "Destination");
               }
               // For intermediate points (optional), use smaller pins or circles
               else {
                  g.append("circle")
                     .attr("class", "path-point-marker")
                     .attr("cx", point.x)
                     .attr("cy", point.y)
                     .attr("r", 4)
                     .attr("fill", "#607D8B") // Medium gray-blue color for intermediate points
                     .attr("stroke", "#FFFFFF")
                     .attr("stroke-width", 1.5);
               }
            });
         };

         // Click handler for adding path points
         const handlePathClick = (event) => {
            // Don't handle the click if it was already handled
            if (event.defaultPrevented) return;

            // Prevent default to stop other handlers
            event.preventDefault();
            event.stopPropagation();

            // Get coordinates relative to the SVG
            const svgPoint = svg.node().createSVGPoint();
            svgPoint.x = event.clientX;
            svgPoint.y = event.clientY;

            // Transform to account for zoom/pan
            const transformedPoint = svgPoint.matrixTransform(g.node().getScreenCTM().inverse());

            // Add point to the current path
            setCurrentPath(prev => [...prev, { x: transformedPoint.x, y: transformedPoint.y }]);
         };

         // Add click handler to background for path creation
         if (backgroundRect.size() > 0) {
            backgroundRect.on("click", handlePathClick);
         }

         // Initial update of path display
         updatePath();
      } else {
         // If not in ADD_ROOM mode, remove temporary paths and markers
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

      return () => {
         // Remove event handlers on cleanup
         svg.on("click", null);
         if (backgroundRect && backgroundRect.size() > 0) {
            backgroundRect.on("click", null);
         }
      };
   }, [svgRef, selectedBuilding, onSelectBuilding, buildings, mode, onPositionSelect, x, y, currentPath, setCurrentPath, selectedKiosk]);

   useEffect(() => {
      if (selectedKiosk && mode === import.meta.env.VITE_ADD_ROOM) {
         setCurrentPath([{
            x: selectedKiosk.coordinates.x,
            y: selectedKiosk.coordinates.y
         }]);
      }
   }, [selectedKiosk, mode, setCurrentPath]);

   // Helper function for rendering destination markers
   const renderDestinationMarker = (g, x, y, color, label) => {
      // Create a group for the marker
      const markerGroup = g.append("g")
         .attr("class", "destination-marker saved-path")
         .attr("transform", `translate(${x}, ${y})`);

      // Create a teardrop/pin shape similar to the image
      markerGroup.append("path")
         .attr("d", `
         M0,-24
         C10,-24 16,-18 16,-8
         C16,4 0,16 0,16
         C0,16 -16,4 -16,-8
         C-16,-18 -10,-24 0,-24
         Z
         `)
         .attr("fill", color || "#FF5722") // Orange color like in the image
         .attr("stroke", "#FFFFFF")
         .attr("stroke-width", 1.5);

      // Add inner circle for the pin hole effect
      markerGroup.append("circle")
         .attr("cy", -14)
         .attr("r", 5)
         .attr("fill", "#FFFFFF");

      // Optionally add label if provided
      if (label && label !== "") {
         markerGroup.append("text")
            .attr("y", 24)
            .attr("text-anchor", "middle")
            .attr("fill", "#000000")
            .attr("stroke", "#FFFFFF")
            .attr("stroke-width", 0.5)
            .attr("paint-order", "stroke")
            .attr("font-size", "10px")
            .attr("font-weight", "bold")
            .text(label);
      }

      return markerGroup;
   };
}

export default useRenderMap

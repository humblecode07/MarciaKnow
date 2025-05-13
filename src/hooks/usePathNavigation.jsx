import { useEffect } from 'react'
import * as d3 from 'd3';

const usePathNavigation = (svgRef, mode, selectedKiosk, currentPath, setCurrentPath) => {
   useEffect(() => {
      if (selectedKiosk && mode === import.meta.env.VITE_ADD_ROOM) {
         setCurrentPath([{
            x: selectedKiosk.coordinates.x,
            y: selectedKiosk.coordinates.y
         }]);
      }
   }, [selectedKiosk, mode, setCurrentPath]);

   useEffect(() => {
      if (!svgRef.current) {
         console.log('SVG ref is not available');
         return;
      }

      const svg = d3.select(svgRef.current);

      const g = svg.select("g");

      if (mode !== import.meta.env.VITE_ADD_ROOM) {
         g.selectAll(".temp-path").remove();
         g.selectAll(".path-point-marker").remove();

         return;
      }

      g.selectAll(".temp-path").remove();

      let drawingPath = g.append("path")
         .attr("class", "temp-path")
         .attr("fill", "none")
         .attr("stroke", 'black')
         .attr("stroke-width", 3)
         .attr("stroke-dasharray", "5,5");

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
      // Add the click handler
      const backgroundRect = g.select("rect"); // Get the background rectangle
      
      if (backgroundRect.size() > 0) {
         backgroundRect.on("click", handlePathClick);
      }

      updatePath();

      return () => {
         backgroundRect.on("click", null);
         svg.on("click", null);
      };
   }, [currentPath, mode, selectedKiosk, setCurrentPath, svgRef]);

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

export default usePathNavigation

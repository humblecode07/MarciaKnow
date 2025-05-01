import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3';

const useRenderMap = (svgRef, buildings, selectedBuilding, onSelectBuilding, mode, onPositionSelect) => {
   const zoomTransformRef = useRef(d3.zoomIdentity);

   const [x, setX] = useState(0);
   const [y, setY] = useState(0);

   console.log(mode);

   useEffect(() => {

      if (!svgRef.current || buildings.length === 0) return;

      // Clear any existing content
      d3.select(svgRef.current).selectAll("*").remove();

      // Get dimensions
      const svg = d3.select(svgRef.current);
      // const width = +svg.attr("width") || 800;
      // const height = +svg.attr("height") || 600;

      // Create a group for all map elements
      const g = svg.append("g");

      // Apply any existing transform that was stored in the ref
      g.attr("transform", zoomTransformRef.current);

      // Track the current transform state
      let currentTransform = d3.zoomIdentity;

      // Add background
      g.append("rect")
         .attr("width", 5000)
         .attr("height", 5000)
         .attr("fill", "transparent")
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
            console.log('bbobob')
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
         const bbox = document.getElementById(building.id)?.getBBox();

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
         console.log('bob')
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

      console.log('alcie')

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
         console.log('Click detected on SVG');

         if (event.defaultPrevented) {
            console.log('Event was prevented');
            return;
         }

         if (mode === import.meta.env.VITE_ADD_ROOM) return;

         const [rawX, rawY] = d3.pointer(event, svg.node());

         console.log('where do you wanna go?')

         // Use the stored transform for accurate conversion

         const transformedX = zoomTransformRef.current.invertX(rawX);
         const transformedY = zoomTransformRef.current.invertY(rawY);

         // If in add/edit mode, show the marker

         if (mode === import.meta.env.VITE_ADD_KIOSK || mode === import.meta.env.VITE_EDIT_KIOSK) {
            // Update state with transformed coordinates
            setX(transformedX);
            setY(transformedY);
            onPositionSelect(transformedX, transformedY);

            // Update marker position without affecting zoom
            markerGroup
               .attr("transform", `translate(${transformedX}, ${transformedY})`)
               .style("visibility", "visible");
         }
         else {
            markerGroup.style("visibility", "hidden");

            // Reset building and pathway styling
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

      // if (mode === import.meta.env.VITE_ADD_ROOM) {

      //g.append("circle")
      // .attr("class", "saved-path")
      // .attr("cx", data.selectedKiosk.coordinates.x)
      // .attr("cy", data.selectedKiosk.coordinates.y)
      // .attr("r", 6)
      // .attr("fill", "#00FF00")
      // .attr("stroke", "#FFFFFF");
      // }

      return () => {
         // Only remove the click handler on cleanup
         svg.on("click", null);
      };

   }, [svgRef, selectedBuilding, onSelectBuilding, buildings, mode, onPositionSelect, x, y]);
}

export default useRenderMap

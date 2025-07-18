import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3';
import { useLocation } from 'react-router-dom';
import { renderIndoorMap } from './renderIndoorMap';
import BuildingLayoutBuilder from '../components/BuildingLayoutBuilder';

const useRenderMap = (svgRef, buildings, selectedBuilding, setBuilding, mode, coordinates, onPositionSelect, selectedKiosk, currentPath, setCurrentPath, isLoadingBuildings, viewMode, setViewMode) => {
   const location = useLocation();
   const path = location.pathname;

   const hasAutoZoomedRef = useRef(false);
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

   useEffect(() => {
      hasAutoZoomedRef.current = false;
   }, [currentPath?.length]);

   useEffect(() => {
      if (isLoadingBuildings || !svgRef.current || buildings.length === 0) return;

      if (path.includes("edit-kiosk") && coordinates) {
         setX(coordinates.x);
         setY(coordinates.y);
      }
   }, [path, coordinates, buildings.length, isLoadingBuildings, svgRef]);

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

   const zoomToPath = (pathPoints, svg, zoomBehavior, padding = 50) => {
      if (!pathPoints || pathPoints.length === 0 || !svg || !zoomBehavior) return;

      const bounds = getPathBounds(pathPoints);
      if (!bounds) return;

      const svgNode = svg.node();
      const svgRect = svgNode.getBoundingClientRect();
      const svgWidth = svgRect.width;
      const svgHeight = svgRect.height;

      const pathWidth = bounds.maxX - bounds.minX;
      const pathHeight = bounds.maxY - bounds.minY;

      const paddedWidth = pathWidth + (padding * 2);
      const paddedHeight = pathHeight + (padding * 2);

      const scaleX = svgWidth / paddedWidth;
      const scaleY = svgHeight / paddedHeight;
      const scale = Math.min(scaleX, scaleY, 3);

      const centerX = bounds.minX + (pathWidth / 2);
      const centerY = bounds.minY + (pathHeight / 2);

      const translateX = (svgWidth / 2) - (centerX * scale);
      const translateY = (svgHeight / 2) - (centerY * scale);

      const transform = d3.zoomIdentity
         .translate(translateX, translateY)
         .scale(scale);

      svg.transition()
         .duration(1000)
         .call(zoomBehavior.transform, transform);
   };

   useEffect(() => {
      if (viewMode === 'campus') {
         console.log('render it u');

         renderMaps(svgRef, buildings, zoomTransformRef, mode, setBuilding, selectedBuilding, x, y, currentPath, isValidPoint, renderDestinationMarker, selectedKiosk, setCurrentPath, setX, setY, onPositionSelect, zoomBehaviorRef, zoomToPath, hasAutoZoomedRef, setViewMode);
      }
   }, [svgRef, selectedBuilding, setBuilding, buildings, mode, onPositionSelect, x, y, currentPath, setCurrentPath, selectedKiosk, isLoadingBuildings, viewMode]);

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

   const renderDestinationMarker = (g, x, y, color, label) => {
      const markerGroup = g.append("g")
         .attr("class", "destination-marker saved-path")
         .attr("transform", `translate(${x}, ${y})`);

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

      markerGroup.append("ellipse")
         .attr("cx", 2)
         .attr("cy", 18)
         .attr("rx", 12)
         .attr("ry", 4)
         .attr("fill", "rgba(0,0,0,0.2)");

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

      markerGroup.append("circle")
         .attr("cy", -16)
         .attr("r", 6)
         .attr("fill", "#ffffff")
         .attr("opacity", 0.9);

      markerGroup.append("circle")
         .attr("cy", -16)
         .attr("r", 2)
         .attr("fill", color);

      markerGroup.select("path")
         .append("animateTransform")
         .attr("attributeName", "transform")
         .attr("type", "scale")
         .attr("values", "1;1.1;1")
         .attr("dur", "2s")
         .attr("repeatCount", "indefinite");

      if (label && label !== "") {
         const labelGroup = markerGroup.append("g")
            .attr("class", "marker-label");

         const labelText = labelGroup.append("text")
            .attr("y", 32)
            .attr("text-anchor", "middle")
            .attr("font-size", "11px")
            .attr("font-weight", "600")
            .attr("font-family", "system-ui, -apple-system, sans-serif")
            .text(label);

         const textBBox = labelText.node().getBBox();

         labelGroup.insert("rect", "text")
            .attr("x", textBBox.x - 4)
            .attr("y", textBBox.y - 2)
            .attr("width", textBBox.width + 8)
            .attr("height", textBBox.height + 4)
            .attr("rx", 4)
            .attr("fill", "rgba(255, 255, 255, 0.9)")
            .attr("stroke", color)
            .attr("stroke-width", 1);

         labelText
            .attr("fill", color)
            .attr("paint-order", "stroke");
      }

      return markerGroup;
   };

   const zoomToNavigationPath = (pathPoints, padding = 100) => {
      const svg = d3.select(svgRef.current);
      if (zoomBehaviorRef.current && svg && pathPoints && pathPoints.length >= 2) {
         zoomToPath(pathPoints, svg, zoomBehaviorRef.current, padding);
      }
   };

   return { zoomToNavigationPath };
}

const renderMaps = (svgRef, buildings, zoomTransformRef, mode, setBuilding, selectedBuilding, x, y, currentPath, isValidPoint, renderDestinationMarker, selectedKiosk, setCurrentPath, setX, setY, onPositionSelect, zoomBehaviorRef, zoomToPath, hasAutoZoomedRef, setViewMode) => {
   if (!svgRef.current || buildings.length === 0) return;

   d3.select(svgRef.current).selectAll("*").remove();

   const svg = d3.select(svgRef.current);
   const g = svg.append("g");

   g.attr("transform", zoomTransformRef.current);

   const backgroundRect = g.append("rect")
      .attr("width", 950)
      .attr("height", 800)
      .attr("fill", "#FBFCF8")
      .attr("pointer-events", "all");

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
      },
      {
         id: "pathway-3",
         name: "Bridge",
         description: "Path connecting east campus buildings",
         path: "M496.33 278.71L486.055 298.772L485.829 299.212L486.268 299.442L561.827 339.21L549.289 363.321L471.758 322.071C468.692 320.114 467.03 316.578 467.462 312.986L467.511 312.639L467.981 309.653L477.447 290.724L477.664 290.289L477.236 290.06L172.688 126.303L176.435 119.748L176.446 119.727L176.457 119.703L180.239 111.192L496.33 278.71Z",
      },
      {
         id: "pathway-4",
         name: "Bridge",
         description: "Path connecting east campus buildings",
         path: "M180.364 111.229C166.348 145.328 132.683 167.174 95.8604 166.109L94.9863 166.08L80.5 165.519V100.376L131.944 85.5361L180.364 111.229Z",
      },
      {
         id: "pathway-5",
         name: "Bridge",
         description: "Path connecting east campus buildings",
         path: "M49 682C50.933 682 52.5 683.567 52.5 685.5V788.5H4V682H49Z",
      },
      {
         id: "pathway-5",
         name: "Bridge",
         description: "Path connecting east campus buildings",
         path: "M394.5 771.499V788.5H101.5V771L394.5 771.499Z",
      },
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

   buildings.forEach(building => {
      const buildingPath = g.append("path")
         .attr("d", building.path)
         .attr("fill", 'transparent')
         .attr("stroke", "#1a237e")
         .attr("id", building.id)
         .attr("data-name", building.name)
         .attr("data-description", building.description);

      if (mode === import.meta.env.VITE_TEST_KIOSK || mode === import.meta.env.VITE_CLIENT_KIOSK) {
         buildingPath
            .attr("cursor", "pointer")
            .on("click", function (event) {
               event.stopPropagation();

               g.selectAll("path[id^='pathway-']")
                  .attr("stroke", "#555555")
                  .attr("stroke-width", 1);

               g.selectAll("path[id^='building-']")
                  .attr("fill", "#FFFFFF")
                  .attr("stroke", "#1a237e");

               d3.select(this).attr("fill", "#A05A2C");
               setBuilding({
                  name: d3.select(this).attr("data-name"),
                  description: d3.select(this).attr("data-description"),
                  existingRoom: building.existingRoom,
                  image: building.image,
                  numOfFloors: building.numberOfFloor,
                  _id: building._id,
                  navigationGuide: building.navigationGuide,
                  navigationPath: building.navigationPath,
                  path: building.path,
                  rooms: building.rooms,
                  builderPath: building.builderPath,
                  stairs: building.stairs
               });

               setCurrentPath(building.navigationPath[selectedKiosk.kioskID]);
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
            })
      }
      else {
         buildingPath.attr("cursor", "default");
      }
   });

   buildings.forEach(building => {
      const buildingPath = g.select(`[id="${building.id}"]`);
      const bbox = buildingPath.node()?.getBBox();

      if (bbox) {
         const label = g.append("text")
            .attr("x", bbox.x + bbox.width / 2)
            .attr("y", bbox.y + bbox.height / 2 - 8)
            .attr("text-anchor", "middle")
            .attr("fill", "black")
            .attr("pointer-events", "none")
            .attr("class", "building-label")
            .attr("data-building-id", building.id)
            .attr("font-size", 14);

         const nameLines = building.name.split(" ");

         nameLines.forEach((line, index) => {
            label.append("tspan")
               .attr("x", bbox.x + bbox.width / 2)
               .attr("dy", index === 0 ? "0" : "1.2em")
               .text(line);
         });

         const baseFontSize = 14; // Default font size
         label.attr("font-size", baseFontSize)
            .attr("data-base-font-size", baseFontSize);

      }
   });


   function updateAdvancedTextScaling(currentZoom) {
      const transform = currentZoom || d3.zoomTransform(svg.node());
      const scale = transform.k;

      g.selectAll(".building-label").each(function () {
         const label = d3.select(this);
         const baseFontSize = +label.attr("data-base-font-size") || 14;

         let scaledFontSize = baseFontSize / scale;

         const minSize = 8;
         const maxSize = 24;
         scaledFontSize = Math.max(minSize, Math.min(maxSize, scaledFontSize));

         label.attr("font-size", scaledFontSize);

         const opacity = scale < 0.5 ? Math.max(0.3, scale * 2) : 1;
         label.attr("opacity", opacity);

         label.attr("style", "paint-order: stroke; stroke: white; stroke-width: 2px;");
      });
   }

   const markerGroup = g.append("g")
      .attr("class", "marker-container");

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

   markerGroup.append("circle")
      .attr("r", 25)
      .attr("fill", "none")
      .attr("stroke", "#ff0000")
      .attr("stroke-width", 3);

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

   if (mode === import.meta.env.VITE_ADD_ROOM || mode === import.meta.env.VITE_TEST_KIOSK || mode === import.meta.env.VITE_QR_CODE_KIOSK || mode === import.meta.env.VITE_CLIENT_KIOSK) {
      g.selectAll(".temp-path").remove();
      g.selectAll(".path-point-marker").remove();

      const createEnhancedPath = () => {
         const defs = g.append("defs");

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

         const shadowPath = g.append("path")
            .attr("class", "temp-path shadow-path")
            .attr("fill", "none")
            .attr("stroke", "#667eea")
            .attr("stroke-width", 8)
            .attr("stroke-opacity", 0.3)
            .attr("filter", "url(#glow)");

         const mainPath = g.append("path")
            .attr("class", "temp-path main-path")
            .attr("fill", "none")
            .attr("stroke", "url(#pathGradient)")
            .attr("stroke-width", 5)
            .attr("stroke-linecap", "round")
            .attr("stroke-linejoin", "round");

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

      const updatePath = () => {
         const validPath = currentPath?.filter(isValidPoint) || [];

         if (validPath.length < 2) {
            pathElements.shadowPath.attr("d", "");
            pathElements.mainPath.attr("d", "");
            pathElements.animatedPath.attr("d", "");
            return;
         }

         try {
            const lineGenerator = d3.line()
               .x(d => d.x)
               .y(d => d.y)
               .curve(d3.curveCardinal.tension(0.3))
               .defined(d => isValidPoint(d));

            const pathData = lineGenerator(validPath);

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

      const updatePointMarkers = () => {
         g.selectAll(".path-point-marker").remove();
         g.selectAll(".destination-marker").remove();

         currentPath.forEach((point, index) => {
            if (index === 0) {
               renderDestinationMarker(g, point.x, point.y, "#6366f1", "You Are Here");
            }
            else if (index === currentPath.length - 1) {
               renderDestinationMarker(g, point.x, point.y, "#8b5cf6", "Destination");
            }
            else {
               const waypointGroup = g.append("g")
                  .attr("class", "path-point-marker waypoint")
                  .attr("transform", `translate(${point.x}, ${point.y})`);

               waypointGroup.append("circle")
                  .attr("r", 8)
                  .attr("fill", "#667eea")
                  .attr("opacity", 0.3);

               waypointGroup.append("circle")
                  .attr("r", 4)
                  .attr("fill", "#667eea")
                  .attr("stroke", "#ffffff")
                  .attr("stroke-width", 2);

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

         if (backgroundRect.size() > 0) {
            backgroundRect.on("click", handlePathClick);
         }
      }

      updatePath();
   }
   else {
      g.selectAll(".temp-path").remove();
      g.selectAll(".path-point-marker").remove();
   }

   const zoom = d3.zoom()
      .scaleExtent([0.5, 3])
      .on("zoom", (event) => {
         zoomTransformRef.current = event.transform;
         g.attr("transform", event.transform);
         updateAdvancedTextScaling(event.transform);
      });

   zoomBehaviorRef.current = zoom;

   svg.call(zoom);

   updateAdvancedTextScaling();

   svg.on("click", (event) => {
      if (mode === import.meta.env.VITE_ADD_ROOM) return;

      const [rawX, rawY] = d3.pointer(event, svg.node());

      const currentTransform = d3.zoomTransform(svg.node());

      const transformedX = currentTransform.invertX(rawX);
      const transformedY = currentTransform.invertY(rawY);

      if (mode === import.meta.env.VITE_ADD_KIOSK || mode === import.meta.env.VITE_EDIT_KIOSK) {
         // Update state
         setX(transformedX);
         setY(transformedY);

         onPositionSelect(transformedX, transformedY);

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
      }
   });

   if (x !== 0 && y !== 0 && (mode === import.meta.env.VITE_ADD_KIOSK || mode === import.meta.env.VITE_EDIT_KIOSK)) {
      markerGroup
         .attr("transform", `translate(${x}, ${y})`)
         .style("visibility", "visible");
   }

   if (currentPath && currentPath.length >= 2 && !hasAutoZoomedRef.current &&
      (mode === import.meta.env.VITE_TEST_KIOSK ||
         mode === import.meta.env.VITE_QR_CODE_KIOSK ||
         mode === import.meta.env.VITE_CLIENT_KIOSK)) {
      hasAutoZoomedRef.current = true;

      setTimeout(() => {
         zoomToPath(currentPath, svg, zoom, 100);
      }, 100);
   }

   return () => {
      svg.on("click", null);
      if (backgroundRect && backgroundRect.size() > 0) {
         backgroundRect.on("click", null);
      }
   };
}

export default useRenderMap

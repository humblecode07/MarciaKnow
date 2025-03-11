import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3';
import XIcon from '../../assets/Icons/XIcon';
import InfoIcon from '../../assets/Icons/InfoIcon';
import QRCodeIcon from '../../assets/Icons/QRCodeIcon';
import SentIconSMIcon from '../../assets/Icons/SentIconSMIcon';
import FullscreenIcon from '../../assets/Icons/FullscreenIcon';
import { fetchBuildings } from '../../api/api';

const CampusMap = () => {
   const svgRef = useRef(null);

   const [buildings, setBuildings] = useState([]);

   const [selectedBuilding, setSelectedBuilding] = useState(null);
   const [isBuildingInfoPanelOpen, setIsBuildingInfoPanelOpen] = useState(false);
   const [isBuildingQRCodePanelOpen, setIsBuildingQRCodePanelOpen] = useState(false);

   const [selectedRoom, setSelectedRoom] = useState(null);

   useEffect(() => {
      if (selectedBuilding === null) {
         setIsBuildingInfoPanelOpen(false);
         setIsBuildingQRCodePanelOpen(false);
      }
   }, [selectedBuilding]);

   useEffect(() => {
      const getBuildings = async () => {
         try {
            const data = await fetchBuildings();
            setBuildings(data);
         } catch (error) {
            console.error("Failed to load buildings:", error);
         }
      };

      getBuildings();
   }, []);

   console.log(buildings);

   const closeAllPanels = () => {
      setSelectedBuilding(null);
      setIsBuildingInfoPanelOpen(false);
      setIsBuildingQRCodePanelOpen(false);
      setSelectedRoom(null);
   }
   
   const handleShowQRCode = () => {
      setIsBuildingInfoPanelOpen(false);
      setIsBuildingQRCodePanelOpen(true);
   }

   // Handler for showing building info panel
   const handleShowBuildingInfo = () => {
      setIsBuildingInfoPanelOpen(true);
      setIsBuildingQRCodePanelOpen(false);
   }

   useEffect(() => {
      if (!svgRef.current || buildings.length === 0) return;

      // Clear any existing content
      d3.select(svgRef.current).selectAll("*").remove();

      const svg = d3.select(svgRef.current)

         .call(d3.zoom()
            .scaleExtent([0.5, 3]) // Min and max zoom
            .on("zoom", (event) => {
               g.attr("transform", event.transform);
            })
         );
      const width = +svg.attr("width") || 800;  // Get SVG width with fallback
      const height = +svg.attr("height") || 600;

      // Create a group for all map elements
      const g = svg.append("g");

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

      // Add background
      g.append("rect")
         .attr("width", width)
         .attr("height", height)
         .attr("fill", "#FBFCF8");

      // Add pathways/lines first (so they appear under buildings)
      pathways.forEach(pathway => {
         g.append("path")
            .attr("d", pathway.path)
            .attr("fill", "none")  // No fill for lines
            .attr("stroke", "#1a237e")  // Dark gray stroke
            .attr("stroke-width", 1)  // Thicker lines
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
                  .attr("stroke", "#FF0000")  // Red highlight
                  .attr("stroke-width", 1);  // Thicker for emphasis

               setSelectedBuilding({
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
         g.append("path")
            .attr("d", building.path)
            .attr("fill", 'transparent')
            .attr("stroke", "#1a237e")
            .attr("id", building.id)
            .attr("data-name", building.name)
            .attr("data-description", building.description)
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

               setSelectedBuilding({
                  name: d3.select(this).attr("data-name"),
                  description: d3.select(this).attr("data-description"),
                  existingRoom: building.existingRoom,
                  image: building.image,
                  numOfFloors: building.numberOfFloor
               });

               svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity);
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

      // Create zoom behavior
      const zoom = d3.zoom()
         .scaleExtent([1, 5]) // Limit zoom (1x to 5x)
         .translateExtent([[0, 0], [width, height]]) // Restrict panning to bounds
         .on("zoom", (event) => {
            g.attr("transform", event.transform);
         });

      svg.call(zoom);

      // Background click deselects buildings and pathways
      svg.on("click", () => {
         g.selectAll("path[id^='building-']")
            .attr("fill", "#FFFFFF");
         g.selectAll("path[id^='pathway-']")
            .attr("stroke", "#555555")
            .attr("stroke-width", 1);
         setSelectedBuilding(null);
      });

      return () => {
         svg.on("click", null);
      };
   }, [selectedBuilding, buildings]);



   return (
      <section className='h-[49.4375rem] overflow-auto relative'>
         <svg
            ref={svgRef}
            width="956"
            height="791"
            style={{ border: '1px solid #ccc' }}
            preserveAspectRatio='xMidYMid meet'
         />

         {/* Buildings Overview Panel - Shown when a building is selected but no other panels are open */}
         {selectedBuilding && !isBuildingInfoPanelOpen && !isBuildingQRCodePanelOpen && (
            <div className="w-full h-[18.125rem] px-[.875rem] py-[1.5625rem] absolute bottom-0 left-0 flex flex-col gap-[.875rem] text-white z-20">
               {/* Overlay with a lower z-index */}
               <div className='absolute inset-0 bg-black opacity-40 z-0'></div>

               {/* Content with a higher z-index */}
               <div className='flex justify-between items-center relative z-10'>
                  <h3 className='text-[1.5rem] font-roboto font-bold'>{selectedBuilding.name}</h3>
                  <div className='flex gap-[.875rem] text-white'>
                     <div
                        onClick={handleShowBuildingInfo}
                        className="w-[1.75rem] h-[1.75rem] flex justify-center items-center bg-[#505050] rounded-md cursor-pointer transition-all duration-300 ease-in-out hover:bg-[#6b6b6b] hover:scale-110"
                     >
                        <InfoIcon />
                     </div>

                     <div
                        onClick={closeAllPanels}
                        className='w-[1.75rem] h-[1.75rem] flex justify-center items-center bg-[#505050] rounded-md cursor-pointer transition-all duration-300 ease-in-out hover:bg-[#6b6b6b] hover:scale-110'
                     >
                        <XIcon />
                     </div>
                  </div>
               </div>
               <div className='flex gap-[.875rem] relative z-10 overflow-x-auto'>
                  {Object.keys(selectedBuilding.existingRoom || {}).length > 0 ? (
                     Object.keys(selectedBuilding.existingRoom).map((roomKey) => {
                        const room = selectedBuilding.existingRoom[roomKey];
                        return (
                           <div
                              key={room.id || roomKey}
                              className='flex flex-col gap-[0.875rem] items-center cursor-pointer transition-all duration-300 ease-in-out hover:opacity-80'
                              onClick={() => setSelectedRoom({ ...room, building: selectedBuilding.name })}
                           >
                              <img className='w-[13.9375rem] h-[10.5625rem] object-cover overflow-hidden' src={room.image} alt={room.name} />
                              <span>{room.name}</span>
                           </div>
                        );
                     })
                  ) : (
                     <div>No rooms available</div>
                  )}
               </div>
            </div>
         )}

         {/* Building Info Panel */}
         {selectedBuilding && isBuildingInfoPanelOpen && (
            <>
               <div className='absolute inset-0 bg-black opacity-40 z-10'></div>
               <div
                  className="w-[28.8125rem] h-[25.5rem] flex flex-col gap-[1.3125rem] absolute z-20 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white shadow-lg"
               >
                  <div className='w-[28.8125rem] h-[11.375rem] flex relative'>
                     <img
                        src={selectedBuilding.image}
                        alt={selectedBuilding.name}
                        className='w-full h-full object-cover absolute'
                     />
                     <div className='w-full p-[15px] flex justify-end gap-[0.9375rem] z-10'>
                        <div className='w-[1.75rem] h-[1.75rem] flex justify-center items-center bg-[#505050] rounded-md cursor-pointer transition-all duration-300 ease-in-out hover:bg-[#6b6b6b] hover:scale-110'>
                           <FullscreenIcon />
                        </div>
                        <div
                           onClick={() => setIsBuildingInfoPanelOpen(false)}
                           className='w-[1.75rem] h-[1.75rem] flex justify-center items-center bg-[#505050] rounded-md cursor-pointer transition-all duration-300 ease-in-out hover:bg-[#6b6b6b] hover:scale-110'
                        >
                           <XIcon />
                        </div>
                     </div>
                  </div>
                  <div className='flex flex-col justify-end gap-[1.3125rem] px-[1.125rem]'>
                     <div className='flex flex-col gap-[1rem]'>
                        <div className='flex justify-between'>
                           <span className='font-semibold text-[1rem]'>{selectedBuilding.name}</span>
                           <span className='text-[#505050]'>No. of Floors: <span className='text-black font-semibold'>{selectedBuilding.numOfFloors}</span></span>
                        </div>
                        <p className='max-h-[5.25rem] overflow-auto text-[.875rem]'>
                           {selectedBuilding.description}
                        </p>
                     </div>
                     <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
                        <button className="w-[12.25rem] h-[2.375rem] flex items-center justify-center gap-[0.6875rem] border-[#110D79] border-[1px] border-solid bg-[#D1D6FA] cursor-pointer transition-all duration-300 ease-in-out hover:bg-[#bfc4f5] hover:scale-105">
                           <SentIconSMIcon />
                           <span className='text-[#110D79] font-semibold text-[.875rem]'>Show Navigation</span>
                        </button>

                        <button
                           onClick={handleShowQRCode}
                           className="w-[12.25rem] h-[2.375rem] flex items-center justify-center gap-[0.6875rem] border-[#F97316] border-[1px] border-solid bg-[#F9731626] cursor-pointer transition-all duration-300 ease-in-out hover:bg-[#f973161a] hover:border-[#d35e12] hover:scale-105"
                        >
                           <QRCodeIcon />
                           <span className='text-[#F97316] font-semibold text-[.875rem]'>Generate QR Code</span>
                        </button>
                     </div>
                  </div>
               </div>
            </>
         )}

         {/* QR Code Panel */}
         {selectedBuilding && isBuildingQRCodePanelOpen && (
            <>
               <div className='absolute inset-0 bg-black opacity-40 z-10'></div>
               <div className="w-[28.8125rem] h-[25.5rem] flex flex-col gap-[1.3125rem] absolute z-20 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white shadow-lg p-6 overflow-auto">
                  <div className='flex justify-between items-center'>
                     <h3 className='text-[1.25rem] font-semibold'>QR Code for {selectedBuilding.name}</h3>
                     <div
                        onClick={() => setIsBuildingQRCodePanelOpen(false)}
                        className='w-[1.75rem] h-[1.75rem] flex justify-center items-center bg-[#f0f0f0] rounded-md cursor-pointer transition-all duration-300 ease-in-out hover:bg-[#e0e0e0]'
                     >
                        <XIcon />
                     </div>
                  </div>

                  <div className='flex-1 flex flex-col items-center justify-center'>
                     {/* Placeholder for QR Code - in a real implementation you'd generate an actual QR code */}
                     <div className='w-[200px] h-[200px] bg-[#f0f0f0] flex items-center justify-center border border-gray-300'>
                        <span className='text-gray-500'>QR Code</span>
                     </div>
                     <p className='mt-4 text-center text-[.875rem] text-gray-600'>
                        Scan this QR code for information about {selectedBuilding.name}
                     </p>
                  </div>

                  <div className='flex justify-center gap-4'>
                     <button
                        onClick={() => setIsBuildingInfoPanelOpen(true) || setIsBuildingQRCodePanelOpen(false)}
                        className="w-[12.25rem] h-[2.375rem] flex items-center justify-center border-[#110D79] border-[1px] border-solid bg-[#D1D6FA] cursor-pointer transition-all duration-300 ease-in-out hover:bg-[#bfc4f5]"
                     >
                        <span className='text-[#110D79] font-semibold text-[.875rem]'>Back to Info</span>
                     </button>
                  </div>
               </div>
            </>
         )}

         {/* Room Detail Panel - Add this if you want to show details when a room is selected */}
         {selectedRoom && (
            <>
               <div className='absolute inset-0 bg-black opacity-40 z-10'></div>
               <div className="w-[28.8125rem] h-auto max-h-[25.5rem] flex flex-col gap-[1rem] absolute z-20 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 overflow-auto bg-white shadow-lg p-6">
                  <div className='flex justify-between items-center'>
                     <h3 className='text-[1.25rem] font-semibold'>{selectedRoom.name}</h3>
                     <div
                        onClick={() => setSelectedRoom(null)}
                        className='w-[1.75rem] h-[1.75rem] flex justify-center items-center bg-[#f0f0f0] rounded-md cursor-pointer hover:bg-[#e0e0e0]'
                     >
                        <XIcon />
                     </div>
                  </div>

                  <img
                     src={selectedRoom.image}
                     alt={selectedRoom.name}
                     className="w-full h-[200px] object-cover"
                  />

                  <div>
                     <p className='text-[#505050] text-sm mb-2'>Located in: <span className='text-black'>{selectedRoom.building}</span></p>
                     <p className='text-[.875rem]'>{selectedRoom.description}</p>
                  </div>

                  <div className='flex justify-center mt-4 gap-4'>
                     <button className="w-[12.25rem] h-[2.375rem] flex items-center justify-center gap-[0.6875rem] border-[#110D79] border-[1px] border-solid bg-[#D1D6FA] cursor-pointer hover:bg-[#bfc4f5]">
                        <SentIconSMIcon />
                        <span className='text-[#110D79] font-semibold text-[.875rem]'>Navigate to Room</span>
                     </button>
                     <button
                        className="w-[12.25rem] h-[2.375rem] flex items-center justify-center gap-[0.6875rem] border-[#F97316] border-[1px] border-solid bg-[#F9731626] cursor-pointer transition-all duration-300 ease-in-out hover:bg-[#f973161a] hover:border-[#d35e12] hover:scale-105"
                     >
                        <QRCodeIcon />
                        <span className='text-[#F97316] font-semibold text-[.875rem]'>Generate QR Code</span>
                     </button>
                  </div>
               </div>
            </>
         )}
      </section>
   )
}

export default CampusMap

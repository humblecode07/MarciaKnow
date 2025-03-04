import React, { useEffect, useRef, useState } from 'react'
import CampusMap from '../../assets/CampusMap'
import * as d3 from 'd3';
import CFRB from '../../assets/CFRB.png'
import InfoIcon from '../../assets/Icons/InfoIcon';
import XIcon from '../../assets/Icons/XIcon';

const MapEditor = () => {
  const svgRef = useRef(null);
  const [selectedBuilding, setSelectedBuilding] = useState(null);

  useEffect(() => {
    if (!svgRef.current) return;

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

    // Define building data with path instructions
    const buildings = [
      {
        id: "1",
        name: "Front Desk Office",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ac nunc nec urna tincidunt luctus. Donec nec nunc nec urna tincidunt luctus.",
        image: [CFRB],
        path: "M77 587.5V642.5H4V587.5H77Z",
        color: "transparent",
      },
      {
        id: "2",
        name: "Marcela Building 1",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ac nunc nec urna tincidunt luctus. Donec nec nunc nec urna tincidunt luctus.",
        path: "M115.5 497V587.5H4V497H115.5Z",
        color: "transparent"
      },
      {
        id: "3",
        name: "Dr. Marciano D. Yanga Building",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ac nunc nec urna tincidunt luctus. Donec nec nunc nec urna tincidunt luctus.",
        path: "M80.5 100.5V496.5H4.00063L4.49937 100.5H80.5Z",
        color: "transparent"
      },
      {
        id: "4",
        name: "Lying in",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ac nunc nec urna tincidunt luctus. Donec nec nunc nec urna tincidunt luctus.",
        path: "M39 62.5V100.5H4.5V62.5H39Z",
        color: "transparent"
      },
      {
        id: "5",
        name: "Marcela Building 2",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ac nunc nec urna tincidunt luctus. Donec nec nunc nec urna tincidunt luctus.",
        path: "M93.5 5H127V73.5072L93.5 73.9927V5Z",
        color: "transparent"
      },
      {
        id: "6",
        name: "Marcela Building 3",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ac nunc nec urna tincidunt luctus. Donec nec nunc nec urna tincidunt luctus.",
        path: "M4.5 5H93.5V40.9972L4.5 40.5028V5Z",
        color: "transparent"
      },
      {
        id: "7",
        name: "Dr. Marciano D. Yanga Building",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ac nunc nec urna tincidunt luctus. Donec nec nunc nec urna tincidunt luctus.",
        path: "M132.171 85.7898L172.213 8.17853L536.428 201.21L496.288 278.822L132.171 85.7898Z",
        color: "transparent"
      },
      {
        id: "8",
        name: "Sofia Bldg. 3",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ac nunc nec urna tincidunt luctus. Donec nec nunc nec urna tincidunt luctus.",
        path: "M485.673 299.288L537.212 199.677L698.331 284.713L647.783 384.322L485.673 299.288Z",
        color: "transparent"
      },
      {
        id: "9",
        name: "Bibliotheca",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ac nunc nec urna tincidunt luctus. Donec nec nunc nec urna tincidunt luctus.",
        path: "M647.668 384.288L698.216 284.68L748.327 311.21L696.789 410.322L647.668 384.288Z",
        color: "transparent"
      },
      {
        id: "10",
        name: "Ismael Yanga Building",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ac nunc nec urna tincidunt luctus. Donec nec nunc nec urna tincidunt luctus.",
        path: "M698.173 411.289L749.711 312.177L828.329 353.711L777.286 452.823L698.173 411.289Z",
        color: "transparent"
      },
      {
        id: "11",
        name: "Sapientia Ideation Center",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ac nunc nec urna tincidunt luctus. Donec nec nunc nec urna tincidunt luctus.",
        path: "M917.337 468.244L825.757 666.833L741.662 627.259L833.029 429.164L917.337 468.244Z",
        color: "transparent"
      },
      {
        id: "12",
        name: "Maria Bldg. 2",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ac nunc nec urna tincidunt luctus. Donec nec nunc nec urna tincidunt luctus.",
        path: "M711.453 621.211L802.24 426.667L820.34 435.241L731.045 630.292L730.841 630.739L731.285 630.951L774.844 651.741L764.256 675.322L679.176 633.276L690.224 611.66L710.785 621.451L711.24 621.668L711.453 621.211Z",
        color: "transparent"
      },
      {
        id: "13",
        name: "Maria Bldg. 1",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ac nunc nec urna tincidunt luctus. Donec nec nunc nec urna tincidunt luctus.",
        path: "M671.789 635.827L508.708 551.304L520.426 532.262L520.697 531.821L520.247 531.565L491.673 515.308L510.708 480.167L702.322 577.716L671.789 635.827Z",
        color: "transparent"
      },
      {
        id: "14",
        name: "Our Lady of Guadalupe Chapel",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ac nunc nec urna tincidunt luctus. Donec nec nunc nec urna tincidunt luctus.",
        path: "M533.099 395.858L541.362 418.215L486.468 439.975L458.367 432.58L429.151 361.766L448.982 353.306L533.099 395.858Z",
        color: "transparent"
      },
      {
        id: "15",
        name: "Sofia Bldg. 1",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ac nunc nec urna tincidunt luctus. Donec nec nunc nec urna tincidunt luctus.",
        path: "M409.19 771.5H334.5V748H337.874H338.374V747.5V589V588.5H337.874H306V499.5H377.5H378V499V441.5H472V556V556.5H472.5H515.694L409.19 771.5Z",
        color: "transparent"
      },
      {
        id: "16",
        name: "Sofia Bldg. 2",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ac nunc nec urna tincidunt luctus. Donec nec nunc nec urna tincidunt luctus.",
        path: "M100.5 678H330V771H100.5V678Z",
        color: "transparent"
      },
      {
        id: "17",
        name: "SME CME",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ac nunc nec urna tincidunt luctus. Donec nec nunc nec urna tincidunt luctus.",
        path: "M289.5 595H328V670H289.5V595Z",
        color: "transparent"
      },
      {
        id: "18",
        name: "Elida Hotel",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ac nunc nec urna tincidunt luctus. Donec nec nunc nec urna tincidunt luctus.",
        path: "M193.615 442H301.615V589H193.615V442Z",
        color: "transparent"
      },
      {
        id: "19",
        name: "Health & Wellness Clinic",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ac nunc nec urna tincidunt luctus. Donec nec nunc nec urna tincidunt luctus.",
        path: "M306 440.5H372V496H306V440.5Z",
        color: "transparent"
      },
      {
        id: "20",
        name: "Dr. Marciano D. Yanga Complex",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ac nunc nec urna tincidunt luctus. Donec nec nunc nec urna tincidunt luctus.",
        path: "M370 416V434H193.5V322.999L370 322.501V341.5V342H370.5H421.5V415.5H370.5H370V416Z",
        color: "transparent"
      },
      {
        id: "21",
        name: "Selah",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ac nunc nec urna tincidunt luctus. Donec nec nunc nec urna tincidunt luctus.",
        path: "M86.5 330.5H116V434.5H86.5V330.5Z",
        color: "transparent"
      },
      {
        id: "22",
        name: "Student Lounge",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ac nunc nec urna tincidunt luctus. Donec nec nunc nec urna tincidunt luctus.",
        path: "M86.5 200.5H116V305.5H86.5V200.5Z",
        color: "transparent"
      },
    ];

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
        .attr("fill", building.color)
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

      // Calculate center point for text (simplified approach)
      // For complex shapes, you might need custom positioning logic
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
  }, [selectedBuilding]);

  console.log(selectedBuilding);

  return (
    <div className="complex-map-container flex ml-[16rem]" style={{ position: 'relative' }}>
      <div className='w-[640px] overflow-auto'>
        <svg
          ref={svgRef}
          width="956"
          height="791"
          style={{ border: '1px solid #ccc' }}
        />

        {selectedBuilding && (
          <div className='w-full h-[18.125rem] px-[.875rem] py-[1.5625rem] absolute bottom-0 right-0 flex flex-col gap-[.875rem] text-white'>
            {/* Overlay with a lower z-index */}
            <div className='absolute inset-0 bg-black opacity-40 z-0'></div>

            {/* Content with a higher z-index */}
            <div className='flex justify-between items-center'>
              <h3 className='text-[1.5rem] font-roboto font-bold relative z-10'>{selectedBuilding.name}</h3>
              <div className='flex gap-[.875rem] text-white'>
                <div className='w-[1.75rem] h-[1.75rem] flex justify-center items-center bg-[#505050] rounded-md'>
                  <InfoIcon />
                </div>
                <div className='w-[1.75rem] h-[1.75rem] flex justify-center items-center bg-[#505050] rounded-md'>
                  <XIcon />
                </div>
              </div>
            </div>
            <div className='flex gap-[.875rem] relative z-10'>
              <div className='flex flex-col gap-[0.875rem] items-center'>
                <img className='w-[13.9375rem] h-[10.5625rem] object-cover' src={CFRB} alt="" />
                <span>Room 1 | Floor 1</span>
              </div>
              <div className='flex flex-col gap-[0.875rem] items-center'>
                <img className='w-[13.9375rem] h-[10.5625rem] object-cover' src={CFRB} alt="" />
                <span>Room 1 | Floor 1</span>
              </div>
              <div className='flex flex-col gap-[0.875rem] items-center'>
                <img className='w-[13.9375rem] h-[10.5625rem] object-cover' src={CFRB} alt="" />
                <span>Room 1 | Floor 1</span>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MapEditor
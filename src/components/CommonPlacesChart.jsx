import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const CommonPlacesChart = ({ data, timeframe }) => {
   const svgRef = useRef();

   // Color palette matching your design
   const colors = [
      '#1f77b4', // Blue
      '#2ca02c', // Green  
      '#d62728', // Red
      '#ff7f0e', // Orange
      '#9467bd', // Purple
      '#8c564b', // Brown
      '#e377c2', // Pink
      '#7f7f7f', // Gray
      '#bcbd22', // Olive
      '#17becf'  // Cyan
   ];

   useEffect(() => {
      if (!data || data.length === 0) return;

      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove(); // Clear previous render

      const width = 300;
      const height = 300;
      const margin = 10;
      const radius = Math.min(width, height) / 2 - margin;

      // Create main SVG group
      const svgGroup = svg
         .attr("width", width)
         .attr("height", height)
         .append("g")
         .attr("transform", `translate(${width / 2}, ${height / 2})`);

      // Prepare data - limit to top 10 and group others
      let chartData = [...data].sort((a, b) => b.count - a.count);

      if (chartData.length > 7) {
         const topItems = chartData.slice(0, 6);
         const othersCount = chartData.slice(6).reduce((sum, item) => sum + item.count, 0);

         if (othersCount > 0) {
            topItems.push({
               buildingName: 'Others',
               roomName: null,
               count: othersCount,
               destinationType: 'group'
            });
         }

         chartData = topItems;
      }

      // Create pie generator
      const pie = d3.pie()
         .value(d => d.count)
         .sort(null);

      // Create arc generator
      const arc = d3.arc()
         .innerRadius(radius * 0.4) // Creates donut chart
         .outerRadius(radius);

      // Create color scale
      const color = d3.scaleOrdinal()
         .domain(chartData.map((d, i) => i))
         .range(colors);

      // Create pie slices
      const pieData = pie(chartData);

      // Add pie slices
      svgGroup.selectAll(".arc")
         .data(pieData)
         .enter()
         .append("g")
         .attr("class", "arc")
         .append("path")
         .attr("d", arc)
         .attr("fill", (d, i) => color(i))
         .attr("stroke", "white")
         .attr("stroke-width", 2)
         .style("cursor", "pointer")
         .on("mouseover", function (event, d) {
            d3.select(this)
               .transition()
               .duration(200)
               .attr("transform", "scale(1.05)");
         })
         .on("mouseout", function () {
            d3.select(this)
               .transition()
               .duration(200)
               .attr("transform", "scale(1)");
         });

   }, [data]);

   // Prepare legend data
   const getLegendData = () => {
      if (!data || data.length === 0) return [];

      let legendData = [...data].sort((a, b) => b.count - a.count);

      if (legendData.length > 7) {
         const topItems = legendData.slice(0, 6);
         const othersCount = legendData.slice(6).reduce((sum, item) => sum + item.count, 0);

         if (othersCount > 0) {
            topItems.push({
               buildingName: 'Others',
               roomName: null,
               count: othersCount,
               destinationType: 'group'
            });
         }

         legendData = topItems;
      }

      return legendData;
   };

   const legendData = getLegendData();
   const totalVisits = legendData.reduce((sum, item) => sum + item.count, 0);

   if (!data || data.length === 0) {
      return (
         <div className="bg-[#FBFCF8] shadow-md p-6 rounded">
            <div className="flex justify-between items-center mb-4">
               <h3 className="font-roboto font-bold text-[#4B5563] text-[.875rem]">
                  Common Places Users Search
               </h3>
               <select className="px-2 py-1 border border-gray-300 rounded text-xs">
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
               </select>
            </div>
            <div className="flex justify-center items-center h-40">
               <p className="text-gray-500">No search data available for this period</p>
            </div>
         </div>
      );
   }

   return (
      <div className="bg-[#FBFCF8] shadow-md p-6 rounded">
         <div className="flex justify-between items-center mb-4">
            <div>
               <h3 className="font-roboto font-bold text-[#4B5563] text-[.875rem]">
                  Common Places Users Search
               </h3>
               <p className="text-xs text-gray-500 mt-1">
                  {totalVisits.toLocaleString()} visits
               </p>
            </div>
            <select
               className="px-2 py-1 border border-gray-300 rounded text-xs"
               value={timeframe}
               disabled
            >
               <option value="week">This Week</option>
               <option value="month">This Month</option>
               <option value="year">This Year</option>
            </select>
         </div>

         <div className="flex items-center gap-8">
            {/* Pie Chart */}
            <div className="flex-shrink-0">
               <svg ref={svgRef}></svg>
            </div>

            {/* Legend */}
            <div className="flex-1 space-y-3">
               {legendData.map((item, index) => {
                  const percentage = ((item.count / totalVisits) * 100).toFixed(1);
                  const displayName = item.roomName
                     ? `${item.buildingName} - ${item.roomName}`
                     : item.buildingName;

                  return (
                     <div key={index} className="flex items-center gap-3">
                        <div
                           className="w-4 h-4 rounded-sm flex-shrink-0"
                           style={{ backgroundColor: colors[index] }}
                        ></div>
                        <div className="flex-1 min-w-0">
                           <div className="flex justify-between items-center">
                              <span className="font-medium text-sm text-gray-700 truncate pr-2">
                                 {displayName}
                              </span>
                              <span className="text-xs text-gray-500 flex-shrink-0">
                                 {percentage}%
                              </span>
                           </div>
                           <div className="text-xs text-gray-500">
                              {item.count.toLocaleString()} searches
                           </div>
                        </div>
                     </div>
                  );
               })}
            </div>
         </div>
      </div>
   );
};

export default CommonPlacesChart;
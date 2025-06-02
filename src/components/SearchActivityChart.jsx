import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const SearchActivityChart = ({ data, timeframe, onTimeframeChange }) => {
   const svgRef = useRef();

   useEffect(() => {
      if (!data || data.length === 0) return;

      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();

      const containerWidth = 800;
      const containerHeight = 300;
      const margin = { top: 20, right: 30, bottom: 40, left: 50 };
      const width = containerWidth - margin.left - margin.right;
      const height = containerHeight - margin.top - margin.bottom;

      // Create main SVG group
      const svgGroup = svg
         .attr("width", containerWidth)
         .attr("height", containerHeight)
         .append("g")
         .attr("transform", `translate(${margin.left}, ${margin.top})`);

      // Parse dates and prepare data
      const parseDate = d3.timeParse("%Y-%m-%d");
      const processedData = data.map(d => ({
         date: parseDate(d.date),
         searches: d.searches
      })).sort((a, b) => a.date - b.date);

      // Fill in missing dates with 0 searches
      const startDate = d3.min(processedData, d => d.date);
      const endDate = d3.max(processedData, d => d.date);

      let filledData = [];
      let currentDate = new Date(startDate);

      while (currentDate <= endDate) {
         const existing = processedData.find(d =>
            d.date.toDateString() === currentDate.toDateString()
         );

         filledData.push({
            date: new Date(currentDate),
            searches: existing ? existing.searches : 0
         });

         currentDate.setDate(currentDate.getDate() + 1);
      }

      // Create scales
      const xScale = d3.scaleTime()
         .domain(d3.extent(filledData, d => d.date))
         .range([0, width]);

      const yScale = d3.scaleLinear()
         .domain([0, d3.max(filledData, d => d.searches) || 20])
         .nice()
         .range([height, 0]);

      // Create area generator
      const area = d3.area()
         .x(d => xScale(d.date))
         .y0(height)
         .y1(d => yScale(d.searches))
         .curve(d3.curveCardinal.tension(0.2));

      // Create line generator
      const line = d3.line()
         .x(d => xScale(d.date))
         .y(d => yScale(d.searches))
         .curve(d3.curveCardinal.tension(0.2));

      // Add gradient definition
      const gradient = svgGroup.append("defs")
         .append("linearGradient")
         .attr("id", "area-gradient")
         .attr("gradientUnits", "userSpaceOnUse")
         .attr("x1", 0).attr("y1", 0)
         .attr("x2", 0).attr("y2", height);

      gradient.append("stop")
         .attr("offset", "0%")
         .attr("stop-color", "#3b82f6")
         .attr("stop-opacity", 0.8);

      gradient.append("stop")
         .attr("offset", "100%")
         .attr("stop-color", "#3b82f6")
         .attr("stop-opacity", 0.1);

      // Add area
      svgGroup.append("path")
         .datum(filledData)
         .attr("fill", "url(#area-gradient)")
         .attr("d", area);

      // Add line
      svgGroup.append("path")
         .datum(filledData)
         .attr("fill", "none")
         .attr("stroke", "#3b82f6")
         .attr("stroke-width", 2)
         .attr("d", line);

      // Add dots for data points
      svgGroup.selectAll(".dot")
         .data(filledData.filter(d => d.searches > 0))
         .enter().append("circle")
         .attr("class", "dot")
         .attr("cx", d => xScale(d.date))
         .attr("cy", d => yScale(d.searches))
         .attr("r", 4)
         .attr("fill", "#3b82f6")
         .attr("stroke", "white")
         .attr("stroke-width", 2);

      // Add X axis
      const xAxis = d3.axisBottom(xScale)
         .tickFormat(d3.timeFormat(getTickFormat()));

      svgGroup.append("g")
         .attr("transform", `translate(0, ${height})`)
         .call(xAxis)
         .selectAll("text")
         .style("font-size", "12px")
         .style("fill", "#9CA3AF");

      // Add Y axis
      const yAxis = d3.axisLeft(yScale)
         .ticks(5)
         .tickFormat(d => d);

      svgGroup.append("g")
         .call(yAxis)
         .selectAll("text")
         .style("font-size", "12px")
         .style("fill", "#9CA3AF");

      // Style axis lines and ticks
      svgGroup.selectAll(".domain")
         .style("stroke", "#E5E7EB");

      svgGroup.selectAll(".tick line")
         .style("stroke", "#E5E7EB");

      // Add grid lines
      svgGroup.selectAll(".grid-line")
         .data(yScale.ticks(5))
         .enter()
         .append("line")
         .attr("class", "grid-line")
         .attr("x1", 0)
         .attr("x2", width)
         .attr("y1", d => yScale(d))
         .attr("y2", d => yScale(d))
         .style("stroke", "#F3F4F6")
         .style("stroke-width", 1);

      function getTickFormat() {
         switch (timeframe) {
            case 'week':
               return '%a'; // Sun, Mon, Tue, etc.
            case 'month':
               return '%m/%d';
            case 'year':
               return '%b';
            default:
               return '%a';
         }
      }

   }, [data, timeframe]);

   if (!data || data.length === 0) {
      return (
         <div className="bg-[#FBFCF8] shadow-md p-6 rounded">
            <div className="flex justify-between items-center mb-4">
               <h3 className="font-roboto font-bold text-[#4B5563] text-[1rem]">
                  Search Activity
               </h3>
               <select
                  className="px-3 py-1 border border-gray-300 rounded text-sm"
                  value={timeframe}
                  onChange={(e) => onTimeframeChange?.(e.target.value)}
               >
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
               </select>
            </div>
            <div className="flex justify-center items-center h-64">
               <p className="text-gray-500">No search activity data available</p>
            </div>
         </div>
      );
   }

   return (
      <div className="bg-[#FBFCF8] shadow-md p-6 rounded">
         <div className="flex justify-between items-center mb-6">
            <h3 className="font-roboto font-bold text-[#4B5563] text-[1rem]">
               Search Activity
            </h3>
            <select
               className="px-3 py-1 border border-gray-300 rounded text-sm"
               value={timeframe}
               onChange={(e) => onTimeframeChange?.(e.target.value)}
            >
               <option value="week">This Week</option>
               <option value="month">This Month</option>
               <option value="year">This Year</option>
            </select>
         </div>

         <div className="w-full">
            <svg ref={svgRef}></svg>
         </div>
      </div>
   );
};

export default SearchActivityChart;
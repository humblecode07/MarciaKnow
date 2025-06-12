// const BuildingViewer = () => {
//   const [selected, setSelected] = useState(false);

//   // Original path data for the building shape
//   const originalPath = 'M115.5 497V587.5H4V497H115.5Z';

//   // INCREASE THIS VALUE to make the building bigger when selected
//   const scale = selected ? 5 : 1; // Changed from 3 to 5 (or try 7 for even bigger)

//   // Calculate the bounding box of the original path to determine its dimensions
//   const originalWidth = 115.5 - 4; // Max X - Min X (111.5)
//   const originalHeight = 587.5 - 497; // Max Y - Min Y (90.5)
//   const originalX = 4;
//   const originalY = 497;

//   // Desired position of the zoomed building and grid on the larger stage
//   // Adjusted for the increased scale, to keep the building centered or visible
//   const zoomedBuildingX = 100; // Adjusted more to the left to fit the larger building
//   const zoomedBuildingY = 80;  // Adjusted more to the top to fit the larger building

//   // Grid parameters for the zoomed view
//   // You might want to increase these further if you want more (smaller) grid cells
//   // within the larger building area.
//   const numGridRows = 10; // Increased rows
//   const numGridCols = 10; // Increased columns

//   // Calculate grid cell dimensions based on the zoomed building's dimensions
//   const zoomedBuildingEffectiveWidth = originalWidth * scale;
//   const zoomedBuildingEffectiveHeight = originalHeight * scale;

//   const gridCellWidth = zoomedBuildingEffectiveWidth / numGridCols;
//   const gridCellHeight = zoomedBuildingEffectiveHeight / numGridRows;

//   return (
//     // Stage dimensions remain 1280x1024
//     <Stage width={1280} height={1024}>
//       <Layer>
//         {/* Building Shape */}
//         <Path
//           data={originalPath}
//           fill="lightblue"
//           stroke="black"
//           // Apply the new, larger scale
//           scale={{ x: scale, y: scale }}
//           // Position the path. When zoomed, move it to the desired zoomed position.
//           x={selected ? zoomedBuildingX : 0}
//           y={selected ? zoomedBuildingY : 0}
//           // The offset helps in positioning the scaled object correctly
//           offset={{ x: selected ? originalX : 0, y: selected ? originalY : 0 }}
//           onClick={() => setSelected(!selected)}
//         />

//         {/* Grid overlay */}
//         {selected &&
//           [...Array(numGridRows)].flatMap((_, row) =>
//             [...Array(numGridCols)].map((_, col) => (
//               <Rect
//                 key={`${row}-${col}`}
//                 // Calculate grid cell positions relative to the zoomed building's position
//                 x={zoomedBuildingX + col * gridCellWidth}
//                 y={zoomedBuildingY + row * gridCellHeight}
//                 width={gridCellWidth}
//                 height={gridCellHeight}
//                 stroke="gray"
//                 strokeWidth={1}
//               />
//             ))
//           )}
//       </Layer>
//     </Stage>
//   );
// };

// export default BuildingViewer;
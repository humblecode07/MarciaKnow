import React, { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'

const Reports = () => {
  const svgRef = useRef(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [currentPath, setCurrentPath] = useState([]);
  const [savedPaths, setSavedPaths] = useState([
    {
      id: "path-1",
      name: "Example Path",
      description: "A pre-existing path",
      points: [{ x: 100, y: 100 }, { x: 200, y: 150 }, { x: 300, y: 100 }],
      color: "#1a237e",
      destinationLabel: "Library" // Added destination label
    }
  ]);
  const [pathName, setPathName] = useState("");
  const [pathDescription, setPathDescription] = useState("");
  const [pathColor, setPathColor] = useState("#FF0000");
  const [destinationLabel, setDestinationLabel] = useState(""); // New state for destination label
  const [selectedPathId, setSelectedPathId] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Initialize the SVG and add background elements
  useEffect(() => {
    if (!svgRef.current) return;

    // Clear any existing content
    d3.select(svgRef.current).selectAll("*").remove();

    // Set up the svg with zoom capability
    const svg = d3.select(svgRef.current)
      .call(d3.zoom()
        .scaleExtent([0.5, 3])
        .on("zoom", (event) => {
          g.attr("transform", event.transform);
        })
      );

    // Create a group for all map elements
    const g = svg.append("g");

    // Add background
    g.append("rect")
      .attr("width", 800)
      .attr("height", 600)
      .attr("fill", "#f5f5f5");

    // Add simple building outlines for demo
    const buildings = [
      { x: 100, y: 100, width: 150, height: 100, name: "Building A" },
      { x: 400, y: 150, width: 180, height: 120, name: "Building B" },
      { x: 200, y: 300, width: 140, height: 90, name: "Building C" },
      { x: 500, y: 350, width: 160, height: 110, name: "Building D" },
    ];

    // Add buildings
    buildings.forEach(building => {
      g.append("rect")
        .attr("x", building.x)
        .attr("y", building.y)
        .attr("width", building.width)
        .attr("height", building.height)
        .attr("fill", "#FFFFFF")
        .attr("stroke", "#1a237e")
        .attr("stroke-width", 2);

      g.append("text")
        .attr("x", building.x + building.width / 2)
        .attr("y", building.y + building.height / 2)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("fill", "#000")
        .text(building.name);
    });

    // Render existing paths
    renderSavedPaths(g);

    // SVG background click handler - deselect when clicking empty area
    svg.on("click", (event) => {
      if (event.target === svgRef.current) {
        setSelectedPathId(null);
      }
    });

  }, [savedPaths]);

  // Handle drawing mode
  useEffect(() => {
    if (!svgRef.current || !isDrawingMode) return;

    const svg = d3.select(svgRef.current);
    const g = svg.select("g");

    // Create a temporary path element that updates as user draws
    let drawingPath = g.append("path")
      .attr("class", "temp-path")
      .attr("fill", "none")
      .attr("stroke", pathColor)
      .attr("stroke-width", 3)
      .attr("stroke-dasharray", "5,5");

    // Create dots for each point
    const updatePointMarkers = () => {
      // Remove existing point markers
      g.selectAll(".path-point-marker").remove();

      // Add point markers
      currentPath.forEach((point, index) => {
        g.append("circle")
          .attr("class", "path-point-marker")
          .attr("cx", point.x)
          .attr("cy", point.y)
          .attr("r", 5)
          .attr("fill", index === 0 ? "#00FF00" : "#0000FF") // Green for start, blue for others
          .attr("stroke", "#FFFFFF");
      });

      // Add endpoint marker if we have at least one point
      if (currentPath.length > 0) {
        const lastPoint = currentPath[currentPath.length - 1];

        // Add destination pin marker
        renderDestinationMarker(g, lastPoint.x, lastPoint.y, pathColor, "Destination");
      }
    };

    // Function to update path as points are added
    const updatePath = () => {
      if (currentPath.length < 2) {
        drawingPath.attr("d", "");
        return;
      }

      // Create a D3 line generator
      const lineGenerator = d3.line()
        .x(d => d.x)
        .y(d => d.y)
        .curve(d3.curveCatmullRom); // Smooths the line

      drawingPath.attr("d", lineGenerator(currentPath));
      updatePointMarkers();
    };

    // Handle clicks on the SVG to add points
    const handleClick = (event) => {
      if (!isDrawingMode) return;

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
    g.on("click", handleClick);

    // Update the path whenever currentPath changes
    updatePath();

    return () => {
      // Clean up
      g.on("click", null);
      drawingPath.remove();
      g.selectAll(".path-point-marker").remove();
    };
  }, [isDrawingMode, currentPath, pathColor]);

  // Function to render a destination marker
  const renderDestinationMarker = (g, x, y, color, label) => {
    // Create a group for the marker
    const markerGroup = g.append("g")
      .attr("class", "destination-marker saved-path")
      .attr("transform", `translate(${x}, ${y})`);

    // Add pin shape
    markerGroup.append("path")
      .attr("d", "M0,-20 C6,-14 6,-2 0,4 C-6,-2 -6,-14 0,-20")
      .attr("fill", color || "#FF0000")
      .attr("stroke", "#FFFFFF")
      .attr("stroke-width", 1);

    // Add circle at pin top
    markerGroup.append("circle")
      .attr("cy", -16)
      .attr("r", 4)
      .attr("fill", "#FFFFFF");

    // Add label if provided
    if (label && label !== "") {
      markerGroup.append("text")
        .attr("y", 16)
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

  // Render saved paths
  const renderSavedPaths = (g) => {
    // Remove existing paths
    g.selectAll(".saved-path").remove();

    // Add each saved path
    savedPaths.forEach(path => {
      if (path.points.length < 2) return;

      // Create a D3 line generator
      const lineGenerator = d3.line()
        .x(d => d.x)
        .y(d => d.y)
        .curve(d3.curveCatmullRom);

      // Draw the path
      g.append("path")
        .attr("class", "saved-path")
        .attr("id", path.id)
        .attr("d", lineGenerator(path.points))
        .attr("fill", "none")
        .attr("stroke", path.color || "#1a237e")
        .attr("stroke-width", selectedPathId === path.id ? 5 : 3)
        .attr("cursor", "pointer")
        .on("click", (event) => {
          event.stopPropagation();
          setSelectedPathId(path.id);
        });

      // Add start point marker (always visible)
      g.append("circle")
        .attr("class", "saved-path")
        .attr("cx", path.points[0].x)
        .attr("cy", path.points[0].y)
        .attr("r", 6)
        .attr("fill", "#00FF00")
        .attr("stroke", "#FFFFFF");

      // Get the last point in the path for the destination
      const lastPoint = path.points[path.points.length - 1];

      // Add endpoint marker
      renderDestinationMarker(
        g,
        lastPoint.x,
        lastPoint.y,
        path.color || "#1a237e",
        path.destinationLabel || "Destination"
      );

      // If the path is selected, add additional points to show the route
      if (selectedPathId === path.id) {
        // Add intermediate points
        path.points.slice(1, -1).forEach(point => {
          g.append("circle")
            .attr("class", "saved-path")
            .attr("cx", point.x)
            .attr("cy", point.y)
            .attr("r", 4)
            .attr("fill", "#0000FF")
            .attr("stroke", "#FFFFFF");
        });
      }
    });
  };

  // Save the current path
  const savePath = () => {
    if (currentPath.length < 2 || !pathName) return;

    const newPath = {
      id: `path-${Date.now()}`,
      name: pathName,
      description: pathDescription,
      points: [...currentPath],
      color: pathColor,
      destinationLabel: destinationLabel || "Destination" // Save destination label
    };

    setSavedPaths(prev => [...prev, newPath]);
    resetDrawingState();
  };

  // Edit existing path
  const startEditPath = () => {
    if (!selectedPathId) return;

    const pathToEdit = savedPaths.find(p => p.id === selectedPathId);
    if (!pathToEdit) return;

    setCurrentPath(pathToEdit.points);
    setPathName(pathToEdit.name);
    setPathDescription(pathToEdit.description);
    setPathColor(pathToEdit.color || "#1a237e");
    setDestinationLabel(pathToEdit.destinationLabel || ""); // Set destination label
    setIsDrawingMode(true);
    setIsEditMode(true);
    setSelectedPathId(null);
  };

  // Update edited path
  const updatePath = () => {
    if (currentPath.length < 2 || !pathName || !isEditMode) return;

    setSavedPaths(prev => prev.map(path =>
      path.id === selectedPathId
        ? {
          ...path,
          name: pathName,
          description: pathDescription,
          points: currentPath,
          color: pathColor,
          destinationLabel: destinationLabel || "Destination" // Update destination label
        }
        : path
    ));

    resetDrawingState();
  };

  // Delete selected path
  const deletePath = () => {
    if (!selectedPathId) return;
    setSavedPaths(prev => prev.filter(path => path.id !== selectedPathId));
    setSelectedPathId(null);
  };

  // Reset drawing state
  const resetDrawingState = () => {
    setIsDrawingMode(false);
    setCurrentPath([]);
    setPathName("");
    setPathDescription("");
    setDestinationLabel(""); // Reset destination label
    setIsEditMode(false);
    setSelectedPathId(null);
  };

  // Remove last point in current path
  const removeLastPoint = () => {
    if (currentPath.length > 0) {
      setCurrentPath(prev => prev.slice(0, -1));
    }
  };

  console.log(savedPaths)

  return (
    <div className="relative w-full h-screen bg-gray-100 flex flex-col">
      <div className="p-4 bg-white shadow-md">
        <h1 className="text-2xl font-bold text-indigo-900">Campus Navigation Path Creator</h1>
        <p className="text-gray-600">Create and manage navigation paths on your campus map</p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* SVG Canvas */}
        <div className="flex-1 relative overflow-hidden border border-gray-300">
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            className="bg-blue-50"
          />
        </div>

        {/* Control Panel */}
        <div className="w-80 bg-white p-4 overflow-y-auto border-l border-gray-300">
          <h2 className="text-lg font-semibold mb-4">Path Controls</h2>

          {/* Drawing Mode Controls */}
          {!isDrawingMode ? (
            <div className="space-y-4">
              <button
                onClick={() => setIsDrawingMode(true)}
                className="w-full py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
              >
                Start Drawing New Path
              </button>

              {/* Path Selection and Management */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="font-medium mb-2">Saved Paths</h3>

                {savedPaths.length === 0 ? (
                  <p className="text-gray-500 text-sm">No paths created yet</p>
                ) : (
                  <div className="space-y-2">
                    {savedPaths.map(path => (
                      <div
                        key={path.id}
                        className={`p-2 border rounded cursor-pointer transition ${selectedPathId === path.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        onClick={() => setSelectedPathId(path.id)}
                      >
                        <div className="font-medium">{path.name}</div>
                        <div className="text-xs text-gray-500">
                          {path.description}
                          {path.destinationLabel && (
                            <span className="ml-1 font-medium text-indigo-700">
                              → {path.destinationLabel}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions for selected path */}
                {selectedPathId && (
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={startEditPath}
                      className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    >
                      Edit Path
                    </button>
                    <button
                      onClick={deletePath}
                      className="flex-1 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">
                  Click on the map to add points to your path.
                  {currentPath.length > 0 && " Right-click to remove the last point."}
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Path Name</label>
                  <input
                    type="text"
                    value={pathName}
                    onChange={(e) => setPathName(e.target.value)}
                    placeholder="e.g., Main Campus Walkway"
                    className="w-full p-2 border rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={pathDescription}
                    onChange={(e) => setPathDescription(e.target.value)}
                    placeholder="e.g., Path from Library to Student Center"
                    className="w-full p-2 border rounded"
                    rows="2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Destination Label</label>
                  <input
                    type="text"
                    value={destinationLabel}
                    onChange={(e) => setDestinationLabel(e.target.value)}
                    placeholder="e.g., Library, Cafeteria, Dorm"
                    className="w-full p-2 border rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Path Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={pathColor}
                      onChange={(e) => setPathColor(e.target.value)}
                      className="h-8 w-12 cursor-pointer"
                    />
                    <span className="text-sm text-gray-600">{pathColor}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Points Added</label>
                  <div className="p-2 bg-gray-50 rounded border text-sm">
                    {currentPath.length === 0 ? (
                      <span className="text-gray-500">No points added yet</span>
                    ) : (
                      <span>{currentPath.length} points added</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={removeLastPoint}
                    disabled={currentPath.length === 0}
                    className="px-3 py-2 bg-orange-100 text-orange-800 rounded hover:bg-orange-200 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
                  >
                    Remove Last Point
                  </button>
                  <button
                    onClick={() => setCurrentPath([])}
                    disabled={currentPath.length === 0}
                    className="px-3 py-2 bg-orange-100 text-orange-800 rounded hover:bg-orange-200 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
                  >
                    Clear All
                  </button>
                </div>

                <div className="flex gap-2 pt-2">
                  {isEditMode ? (
                    <button
                      onClick={updatePath}
                      disabled={currentPath.length < 2 || !pathName}
                      className="flex-1 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                    >
                      Update Path
                    </button>
                  ) : (
                    <button
                      onClick={savePath}
                      disabled={currentPath.length < 2 || !pathName}
                      className="flex-1 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                    >
                      Save Path
                    </button>
                  )}

                  <button
                    onClick={resetDrawingState}
                    className="flex-1 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Reports

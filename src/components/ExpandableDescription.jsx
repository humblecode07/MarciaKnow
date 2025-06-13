import { useState } from 'react';

const ExpandableDescription = ({ building, selectedFloor, hasRooms = true }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Get building description - you can customize this based on your data structure
  const getDescription = () => {
    // First priority: use building.description if it exists
    if (building?.description) {
      return building.description;
    }

    // Second priority: use building.desc if it exists (alternative field name)
    if (building?.desc) {
      return building.desc;
    }

    // Third priority: use building.details if it exists
    if (building?.details) {
      return building.details;
    }

    // Fourth priority: use building.about if it exists
    if (building?.about) {
      return building.about;
    }

    // Fifth priority: use building.info if it exists
    if (building?.info) {
      return building.info;
    }

    // Last resort: Different default descriptions based on whether building has rooms
    if (hasRooms && selectedFloor) {
      return `${building?.name || 'This building'} contains multiple rooms and facilities. Floor ${selectedFloor} offers various spaces for different activities and purposes. Click on any room above to explore the indoor layout and get detailed information about that specific area.`;
    } else if (hasRooms) {
      return `${building?.name || 'This building'} contains multiple rooms and facilities across different floors. Click on any room to explore the indoor layout and get detailed information about that specific area.`;
    } else {
      return `${building?.name || 'This building'} is an important facility on campus. This building serves various purposes and is part of the campus infrastructure. More detailed information about this building may be available through campus resources.`;
    }
  };

  const description = getDescription();

  return (
    <div className="border-t border-gray-200 bg-gray-50 relative">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
        aria-expanded={isExpanded}
        aria-controls="building-description"
      >
        <span className="text-sm font-medium text-gray-700">
          Building Information
        </span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''
            }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Expandable Content with absolute positioning to prevent layout shift */}
      <div
        id="building-description"
        className={`absolute bottom-full left-0 right-0 bg-white rounded-t-lg shadow-lg border border-gray-200 transition-all duration-300 ease-in-out ${isExpanded
            ? 'translate-y-0 opacity-100 visible'
            : 'translate-y-2 opacity-0 invisible'
          }`}
        style={{
          transformOrigin: 'bottom',
          zIndex: 35, // Increased from 25 to ensure it appears above everything
        }}
      >
        <div className="px-4 py-4">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <p className="text-sm text-gray-600 leading-relaxed">
              {description}
            </p>

            {/* Optional: Add building stats or additional info */}
            {hasRooms && building?.rooms && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                  <div>
                    <span className="font-medium">Total Floors:</span> {Object.keys(building.rooms || {}).length}
                  </div>
                  <div>
                    <span className="font-medium">Current Floor:</span> {selectedFloor}
                  </div>
                </div>
              </div>
            )}

            {/* Show different info for buildings without rooms */}
            {!hasRooms && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-xs text-gray-500">
                  <span className="font-medium">Building Type:</span> Campus Facility
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpandableDescription;
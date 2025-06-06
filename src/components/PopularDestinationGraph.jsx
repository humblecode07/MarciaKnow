import React from 'react';

const PopularDestinationsGraph = ({ data, loading }) => {
  // Transform the frequentDestinations data for the chart
  const chartData = React.useMemo(() => {
    if (!data?.frequentDestinations || loading) return [];

    // Take top 4 destinations and format for chart
    return data.frequentDestinations.slice(0, 4).map((item, index) => ({
      name: item.buildingName || `Location ${index + 1}`,
      count: item.count || 0,
      // Keeping 'searches' for consistency, but consider just using item.count directly
      searches: `${item.count || 0} searches`
    }));
  }, [data?.frequentDestinations, loading]);

  const maxCount = Math.max(...chartData.map(item => item.count), 0);

  if (loading) {
    return (
      <div className="w-full bg-white rounded-lg shadow-md p-6 overflow-hidden">
        <h3 className="font-poppins font-bold text-[1.125rem] mb-4 text-center">
          POPULAR DESTINATION SEARCHES FROM LAST WEEK
        </h3>
        <div className="flex items-center justify-center h-48"> {/* Reduced height */}
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div className="w-full bg-white rounded-lg shadow-md p-6 overflow-hidden">
        <h3 className="font-poppins font-bold text-[1.125rem] mb-4 text-center">
          POPULAR DESTINATION SEARCHES FROM LAST WEEK
        </h3>
        <div className="flex items-center justify-center h-48"> {/* Reduced height */}
          <div className="text-gray-500">No destination data available</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-6 overflow-hidden">
      <h3 className="font-poppins font-bold text-[1.125rem] mb-4 text-center">
        POPULAR DESTINATION SEARCHES FROM LAST WEEK
      </h3>
      <div className="space-y-3"> {/* Reduced vertical space */}
        {chartData.map((item, index) => (
          <div key={index} className="space-y-1"> {/* Reduced inner space */}
            {/* Destination name and count */}
            <div className="flex justify-between items-center min-w-0">
              <span className="font-medium text-gray-800 truncate flex-1 pr-2">
                {item.name}
              </span>
              <span className="text-gray-500 text-sm flex-shrink-0">
                {item.searches}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full">
              <div className="w-full h-2 bg-yellow-50 rounded-full overflow-hidden"> {/* Reduced height, rounded-full for softer look */}
                <div
                  className="h-full bg-orange-300 rounded-full transition-all duration-500 ease-out" // rounded-full for softer look
                  style={{
                    width: `${maxCount > 0 ? (item.count / maxCount) * 100 : 0}%`
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PopularDestinationsGraph;
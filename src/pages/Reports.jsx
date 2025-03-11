import React, { useState } from 'react'

const initialData = [
  {
    id: 1,
    name: 'Dr. Marciano D. Yanga Building',
    expanded: true,
    rooms: [
      { id: 101, name: 'Room 1', floor: 'Floor 1', addedBy: 'john.doe@dyci.edu.ph', editedBy: 'john.doe@dyci.edu.ph' },
      { id: 102, name: 'Room 2', floor: 'Floor 2', addedBy: 'john.doe@dyci.edu.ph', editedBy: 'john.doe@dyci.edu.ph' },
    ]
  },
  { id: 2, name: 'Front Desk Office', expanded: false, rooms: [] },
  { id: 3, name: 'Sofia Building', expanded: false, rooms: [] },
  { id: 4, name: 'Elida Hotel', expanded: false, rooms: [] },
  { id: 5, name: 'Marciano Building 1', expanded: false, rooms: [] },
  { id: 6, name: 'Sapientia Ideation Center', expanded: false, rooms: [] },
  { id: 7, name: 'Ismael Yanga Building', expanded: false, rooms: [] },
];

const Reports = () => {
  const [buildings, setBuildings] = useState(initialData);
  const [searchTerm, setSearchTerm] = useState('');

  // Toggle building expansion
  const toggleBuilding = (id) => {
    setBuildings(buildings.map(building =>
      building.id === id ? { ...building, expanded: !building.expanded } : building
    ));
  };

  // Delete room
  const deleteRoom = (buildingId, roomId) => {
    setBuildings(buildings.map(building =>
      building.id === buildingId
        ? {
          ...building,
          rooms: building.rooms.filter(room => room.id !== roomId)
        }
        : building
    ));
  };

  // Add room
  const addRoom = (buildingId) => {
    const newRoomId = Math.floor(Math.random() * 1000) + 200;
    setBuildings(buildings.map(building =>
      building.id === buildingId
        ? {
          ...building,
          expanded: true,
          rooms: [...building.rooms, {
            id: newRoomId,
            name: `New Room ${newRoomId}`,
            floor: 'TBD',
            addedBy: 'john.doe@dyci.edu.ph',
            editedBy: 'john.doe@dyci.edu.ph'
          }]
        }
        : building
    ));
  };

  return (
    <div className="max-w-5xl mx-auto p-4 bg-gray-50">
      <div className="flex items-center mb-2">
        <a href="#" className="text-blue-600 hover:underline flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
          </svg>
          Kiosk / Map Editor
        </a>
      </div>

      <h1 className="text-xl font-bold mb-4">MAP EDITOR</h1>

      <div className="mb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">

          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        {buildings.map((building) => (
          <div key={building.id} className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 flex justify-between items-center">
              <div
                className="font-medium cursor-pointer flex items-center"
                onClick={() => toggleBuilding(building.id)}
              >

                {building.name}
              </div>
              <div className="flex space-x-2">
                <button
                  className="px-3 py-1 bg-blue-100 text-blue-600 rounded flex items-center"
                  onClick={() => addRoom(building.id)}
                >
                  Add a Room
                </button>
                <button className="px-3 py-1 bg-green-100 text-green-600 rounded flex items-center">
                  Edit
                </button>
                {!building.expanded && (
                  <button
                    className="px-3 py-1 bg-yellow-100 text-yellow-600 rounded flex items-center"
                    onClick={() => toggleBuilding(building.id)}
                  >
                    Show
                  </button>
                )}
                {building.expanded && (
                  <button
                    className="px-3 py-1 bg-yellow-100 text-yellow-600 rounded flex items-center"
                    onClick={() => toggleBuilding(building.id)}
                  >
                    Hide
                  </button>
                )}
              </div>
            </div>

            {building.expanded && building.rooms.length > 0 && (
              <div className="border-t border-gray-200">
                {building.rooms.map((room) => (
                  <div key={room.id} className="px-4 py-3 border-b border-gray-200 last:border-b-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{room.name}</div>
                        <div className="text-gray-500 text-sm">{room.floor}</div>
                        <div className="text-gray-500 text-sm mt-1">
                          <div>Added By: {room.addedBy}</div>
                          <div>Edited By: {room.editedBy}</div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button className="px-3 py-1 text-blue-600 rounded flex items-center">
                          Show
                        </button>
                        <button className="px-3 py-1 text-green-600 rounded flex items-center">
                          Edit
                        </button>
                        <button
                          className="px-3 py-1 text-red-600 rounded flex items-center"
                          onClick={() => deleteRoom(building.id, room.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Reports

import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom';
import { fetchKiosk, pingKiosk, fetchBuildings, fetchRooms } from '../../api/api';
import LeftSidePanel from '../../components/TestKiosk/LeftSidePanel';
import CampusMap from '../../components/TestKiosk/CampusMap';
import RightSidePanel from '../../components/TestKiosk/RightSidePanel';

const ClientKiosk = () => {
  const { kioskID } = useParams();

  const [kiosk, setKiosk] = useState();
  const [room, setRoom] = useState();
  const [building, setBuilding] = useState();
  const [currentPath, setCurrentPath] = useState();
  const [buildingsData, setBuildingsData] = useState([]);
  const [roomsData, setRoomsData] = useState([]);

  useEffect(() => {
    const fetchKioskData = async () => {
      try {
        const response = await fetchKiosk(kioskID);
        setKiosk(response);
      }
      catch (err) {
        console.error('Fetching kiosk failed:', err.message);
      }
    }

    const fetchLocationData = async () => {
      try {
        const [buildings, rooms] = await Promise.all([
          fetchBuildings(),
          fetchRooms()
        ]);
        setBuildingsData(buildings);
        setRoomsData(rooms);
      } catch (err) {
        console.error('Fetching location data failed:', err.message);
      }
    };

    const ping = async () => {
      try {
        await pingKiosk(kioskID);
      }
      catch (err) {
        console.error('Kiosk ping failed:', err.message);
      }
    };

    fetchKioskData();
    fetchLocationData();
    ping();
    const interval = setInterval(ping, 120000);

    return () => clearInterval(interval); // cleanup
  }, [kioskID]);

  // Check if data is ready for AI processing
  const isDataReady = buildingsData.length > 0 && roomsData.length > 0 && kiosk;

  // Process AI location detection
  const processAILocation = (locationData) => {
    if (!isDataReady) return null;

    const { name, type, action } = locationData;

    // Search in buildings first
    const matchedBuilding = buildingsData.find(building =>
      building.name.toLowerCase().includes(name.toLowerCase()) ||
      name.toLowerCase().includes(building.name.toLowerCase())
    );

    if (matchedBuilding) {
      return {
        type: 'building',
        item: matchedBuilding,
        action: action || 'navigate',
        originalQuery: name
      };
    }

    // Search in rooms
    for (const building of buildingsData) {
      const roomsForKiosk = building.existingRoom?.[kiosk.kioskID];
      if (roomsForKiosk) {
        const matchedRoom = roomsForKiosk.find(room =>
          room.name.toLowerCase().includes(name.toLowerCase()) ||
          name.toLowerCase().includes(room.name.toLowerCase())
        );

        if (matchedRoom) {
          return {
            type: 'room',
            item: { ...matchedRoom, building: building.name },
            action: action || 'navigate',
            originalQuery: name
          };
        }
      }
    }

    return null; // No match found
  };

  // Handle location detection from AI
  const handleLocationDetected = (locationData) => {
    console.log('Processing AI location detection:', locationData);

    if (!isDataReady) {
      console.warn('Location data not ready yet');
      return;
    }

    const matchResult = processAILocation(locationData);

    if (matchResult && matchResult.item) {
      console.log('Location match found:', matchResult);

      // Handle different actions
      switch (matchResult.action) {
        case 'navigate':
          if (matchResult.type === 'building') {
            const buildingItem = matchResult.item;
            setBuilding(buildingItem);
            setRoom(null); // Clear room selection

            // Set navigation path
            if (buildingItem.navigationPath && buildingItem.navigationPath[kiosk.kioskID]) {
              setCurrentPath(buildingItem.navigationPath[kiosk.kioskID]);
            }
          } else if (matchResult.type === 'room') {
            const roomItem = matchResult.item;
            setRoom(roomItem);
            setBuilding(null); // Clear building selection

            // Set navigation path
            if (roomItem.navigationPath) {
              setCurrentPath(roomItem.navigationPath);
            }
          }
          break;

        case 'search':
          // Trigger search in LeftSidePanel
          console.log('Triggering search for:', matchResult.originalQuery);
          break;

        default:
          console.log('No specific action defined for:', matchResult.action);
      }
    } else {
      console.log('No location match found for:', locationData.name);
    }
  };

  console.log(currentPath);

  return (
    <div className="w-screen h-screen flex justify-center items-center bg-gray-100">
      <div className="w-[100rem] flex">
        <LeftSidePanel
          room={room}
          building={building}
          onRoomSelect={setRoom}
          onBuildingSelect={setBuilding}
          kiosk={kiosk}
          setCurrentPath={setCurrentPath}
          width={'20%'}
          height={'100dvh'}
        />
        <CampusMap
          mode={import.meta.env.VITE_CLIENT_KIOSK}
          currentPath={currentPath}
          setCurrentPath={setCurrentPath}
          kiosk={kiosk}
          setKiosk={setKiosk}
          setRoom={setRoom}
          building={building}
          setBuilding={setBuilding}
          room={room}
          width={'50dvw'}
          height={'100dvh'}
          panelWidth={'47'}
        />
        <RightSidePanel
          kiosk={kiosk}
          width={'20%'}
          height={'100dvh'}
          onLocationDetected={handleLocationDetected}
          selectedBuilding={building}
        />
      </div>
    </div>
  )
}

export default ClientKiosk
import React, { useEffect, useRef, useState } from 'react'
import LeftSidePanel from '../../components/TestKiosk/LeftSidePanel';
import RightSidePanel from '../../components/TestKiosk/RightSidePanel';
import CampusMap from '../../components/TestKiosk/CampusMap';
import { useQuery } from '@tanstack/react-query';
import { fetchKiosks, fetchBuildings, fetchRooms, pingAdmin } from '../../api/api';

const TestKiosk = () => {
  const [kiosk, setKiosk] = useState(null);
  const [room, setRoom] = useState(null);
  const [building, setBuilding] = useState(null);
  const [currentPath, setCurrentPath] = useState([]);

  const { data: kiosksData, error: kiosksError, isLoading: kiosksLoading } = useQuery({
    queryKey: ['kiosks'],
    queryFn: fetchKiosks,
  });

  // Fetch buildings and rooms for AI location matching
  const { data: buildingsData } = useQuery({
    queryKey: ['buildings'],
    queryFn: fetchBuildings,
    enabled: !!kiosk
  });

  const { data: roomsData } = useQuery({
    queryKey: ['rooms'],
    queryFn: fetchRooms,
    enabled: !!kiosk
  });

  // Set default kiosk when kiosks data is loaded
  useEffect(() => {
    if (kiosksData?.length > 0 && !kiosk) {
      setKiosk(kiosksData[0]);
    }
  }, [kiosksData, kiosk]);

  // Add this helper function to check if data is ready
  const isDataReady = buildingsData && roomsData && kiosk;

  // Add this function to process AI location detection
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

  // Handle kiosk changes and update navigation paths accordingly
  useEffect(() => {
    if (!kiosk || !buildingsData) return;

    // If we have an active room navigation, update it for the new kiosk
    if (room && building) {
      const targetBuilding = buildingsData.find(b => b._id === building._id);
      if (targetBuilding) {
        const roomsForKiosk = targetBuilding.existingRoom?.[kiosk.kioskID];
        const updatedRoom = roomsForKiosk?.find(r => r._id === room._id);

        if (updatedRoom) {
          // Room exists for this kiosk - update navigation path
          const roomWithBuilding = { ...updatedRoom, building: targetBuilding.name };
          setRoom(roomWithBuilding);

          if (updatedRoom.navigationPath && updatedRoom.navigationPath.length > 0) {
            setCurrentPath([...updatedRoom.navigationPath]);
          } else {
            // No navigation path available, use kiosk position
            const kioskPosition = {
              x: kiosk.x || kiosk.positionX || kiosk.position?.x || kiosk.coordinates?.x || 0,
              y: kiosk.y || kiosk.positionY || kiosk.position?.y || kiosk.coordinates?.y || 0
            };
            setCurrentPath([kioskPosition]);
          }
        } else {
          // Room doesn't exist for this kiosk - clear navigation
          console.log(`Room ${room.name} not available from kiosk ${kiosk.kioskID}`);
          setRoom(null);
          setCurrentPath([]);
        }
      }
    }
    // If we have an active building navigation, update it for the new kiosk
    else if (building && !room) {
      const targetBuilding = buildingsData.find(b => b._id === building._id);
      if (targetBuilding?.navigationPath?.[kiosk.kioskID]) {
        const newPath = targetBuilding.navigationPath[kiosk.kioskID];
        setCurrentPath([...newPath]);
      } else {
        // No navigation path available for this kiosk to the building
        console.log(`No navigation path to building ${building.name} from kiosk ${kiosk.kioskID}`);
        const kioskPosition = {
          x: kiosk.x || kiosk.positionX || kiosk.position?.x || kiosk.coordinates?.x || 0,
          y: kiosk.y || kiosk.positionY || kiosk.position?.y || kiosk.coordinates?.y || 0
        };
        setCurrentPath([kioskPosition]);
      }
    }
  }, [kiosk?.kioskID, buildingsData]); // Only depend on kiosk ID and buildings data

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

      // Show suggestions if available
      if (matchResult && matchResult.suggestions && matchResult.suggestions.length > 0) {
        console.log('Suggested alternatives:', matchResult.suggestions);
        // You could show these suggestions in the UI
      }
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      pingAdmin();
    }, 30000);

    pingAdmin();
    return () => clearInterval(interval);
  }, []);

  if (kiosksLoading) return <div>Loading...</div>;
  if (kiosksError) {
    console.error('Error fetching kiosks:', kiosksError);
    return <div>Error loading kiosks data.</div>;
  }

  console.log(room);

  return (
    <div className="flex ml-[19.5625rem] mt-[1.875rem]">
      <LeftSidePanel
        room={room}
        building={building}
        onRoomSelect={setRoom}
        onBuildingSelect={setBuilding}
        kiosk={kiosk}
        setCurrentPath={setCurrentPath}
        width={'20%'}
        height={'100%'}
      />
      <CampusMap
        mode={import.meta.env.VITE_TEST_KIOSK}
        currentPath={currentPath}
        setCurrentPath={setCurrentPath}
        kiosk={kiosk}
        setKiosk={setKiosk}
        setRoom={setRoom}
        building={building}
        setBuilding={setBuilding}
        kiosksData={kiosksData}
        room={room}
        panelWidth={'36.8125'}
      />
      <RightSidePanel
        kiosk={kiosk}
        width={'20%'}
        height={'100%'}
        onLocationDetected={handleLocationDetected}
        selectedBuilding={building}
      />
    </div>
  );
}

export default TestKiosk;
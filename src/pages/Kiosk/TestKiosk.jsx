import React, { useEffect, useRef, useState } from 'react'
import LeftSidePanel from '../../components/TestKiosk/LeftSidePanel';
import RightSidePanel from '../../components/TestKiosk/RightSidePanel';
import CampusMap from '../../components/TestKiosk/CampusMap';
import { useQuery } from '@tanstack/react-query';
import { fetchKiosks, fetchBuildings, fetchRooms, pingAdmin } from '../../api/api';
import { useLocationMatcher } from '../../hooks/useLocationMatcher';

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

  // Use the location matcher hook
  const { processAILocation, isDataReady } = useLocationMatcher(buildingsData, roomsData);

  // Set default kiosk when kiosks data is loaded
  useEffect(() => {
    if (kiosksData?.length > 0 && !kiosk) {
      setKiosk(kiosksData[0]);
    }
  }, [kiosksData, kiosk]);

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

        case 'info':
          // Show information about the location
          if (matchResult.type === 'building') {
            const buildingItem = matchResult.item;
            setBuilding(buildingItem);
            setRoom(null);
          } else if (matchResult.type === 'room') {
            const roomItem = matchResult.item;
            setRoom(roomItem);
            setBuilding(null);
          }
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
        setBuilding={setBuilding}
        kiosksData={kiosksData}
      />
      <RightSidePanel
        kiosk={kiosk}
        width={'20%'}
        height={'100%'}
        onLocationDetected={handleLocationDetected}
      />
    </div>
  );
}

export default TestKiosk
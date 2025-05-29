import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom';
import { fetchKiosk, pingKiosk } from '../../api/api';
import LeftSidePanel from '../../components/TestKiosk/LeftSidePanel';
import CampusMap from '../../components/TestKiosk/CampusMap';
import RightSidePanel from '../../components/TestKiosk/RightSidePanel';

const ClientKiosk = () => {
  const { kioskID } = useParams();

  const [kiosk, setKiosk] = useState();
  const [room, setRoom] = useState();
  const [building, setBuilding] = useState();
  const [currentPath, setCurrentPath] = useState();

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

    const ping = async () => {
      try {
        await pingKiosk(kioskID);
      }
      catch (err) {
        console.error('Kiosk ping failed:', err.message);
      }
    };

    fetchKioskData();
    ping();
    const interval = setInterval(ping, 120000);

    return () => clearInterval(interval); // cleanup
  }, [kioskID]);

  console.log(currentPath);

  return (
    <div className="w-[90rem] h-[50rem] flex ml-[10.5625rem] mt-[1.875rem]">
      <LeftSidePanel room={room} building={building} onRoomSelect={setRoom} onBuildingSelect={setBuilding} kiosk={kiosk} setCurrentPath={setCurrentPath} />
      <CampusMap mode={import.meta.env.VITE_CLIENT_KIOSK} currentPath={currentPath} setCurrentPath={setCurrentPath} kiosk={kiosk} setRoom={setRoom} setBuilding={setBuilding} />
      <RightSidePanel kiosk={kiosk} />
    </div>
  )
}

export default ClientKiosk

import React, { useEffect, useRef, useState } from 'react'
import LeftSidePanel from '../../components/TestKiosk/LeftSidePanel';
import RightSidePanel from '../../components/TestKiosk/RightSidePanel';
import CampusMap from '../../components/TestKiosk/CampusMap';

const TestKiosk = () => {
  return (
    <div className="flex ml-[16rem]" style={{ position: 'relative' }}>
      <LeftSidePanel />
      <CampusMap />
      <RightSidePanel />
    </div>
  );
}

export default TestKiosk

import React, { useEffect, useRef, useState } from 'react'
import LeftSidePanel from '../../components/TestKiosk/LeftSidePanel';
import RightSidePanel from '../../components/TestKiosk/RightSidePanel';
import CampusMap from '../../components/TestKiosk/CampusMap';

const TestKiosk = () => {
  return (
    <div className="flex ml-[19.5625rem] mt-[1.875rem]">
      <LeftSidePanel />
      <CampusMap />
      <RightSidePanel />
    </div>
  );
}

export default TestKiosk

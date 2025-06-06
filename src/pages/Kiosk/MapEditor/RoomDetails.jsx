import React, { useEffect, useState } from 'react'
import { createRoom, editBuilding, editRoom, fetchBuilding, fetchKiosks, fetchNavigationIcons, fetchRoom } from '../../../api/api'
import UploadIcon from '../../../assets/Icons/UploadIcon';
import AddIcon from '../../../assets/Icons/AddIcon';
import XIcon from '../../../assets/Icons/XIcon';
import BlackXIcon from '../../../assets/Icons/BlackXIcon';
import CampusMap from '../../../components/TestKiosk/CampusMap';
import { useQuery } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid'
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import ResetIcon from '../../../assets/Icons/ResetIcon';
import RevertIcon from '../../../assets/Icons/RevertIcon';
import NavigationIconsModal from '../../../modals/NavigationIconsModal';
import { pingAdmin } from '../../../api/api';

const RoomDetails = () => {
  const { data: kiosksData, error: kiosksError, isLoading: kiosksLoading } = useQuery({
    queryKey: ['kiosks'],
    queryFn: fetchKiosks,
  });

  const { data: navigationIcons, error: navigationIconsError, isLoading: navigationIconsLoading } = useQuery({
    queryKey: ['navigationIcons'],
    queryFn: fetchNavigationIcons,
  });

  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;
  const isEditRoomMode = location.pathname.includes('edit-room');
  const isEditBuildingMode = location.pathname.includes('edit-building');
  const isAddRoomMode = location.pathname.includes('add-room');

  const { buildingID, kioskID, roomID } = useParams();

  const [buildingName, setBuildingName] = useState('');
  const [roomName, setRoomName] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [floor, setFloor] = useState(1);
  const [currentPath, setCurrentPath] = useState([]);
  const [selectedKiosk, setSelectedKiosk] = useState(null);
  const [navigationGuide, setNavigationGuide] = useState([]);
  const [images, setImages] = useState([]);

  // Store original data for kiosk-specific navigation guides and paths
  const [originalBuildingData, setOriginalBuildingData] = useState(null);

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    const formatted = files.map(file => ({
      type: 'file',
      data: file
    }));
    setImages(prev => [...prev, ...formatted]);
  };

  const addNavigationGuideCard = () => {
    const newGuide = {
      id: uuidv4(),
      icon: navigationIcons?.data?.[0]?.icon || '',
      description: ""
    }

    setNavigationGuide([...navigationGuide, newGuide]);
  }

  const updateStepDescription = (rule, index, value) => {
    if (rule === "ICON") {
      const updated = [...navigationGuide];
      updated[index] = { ...updated[index], icon: value };
      setNavigationGuide(updated);
    }
    else if (rule === "DESCRIPTION") {
      const updated = [...navigationGuide];
      updated[index] = { ...updated[index], description: value };
      setNavigationGuide(updated);
    }
  };

  const removeNavigationGuideCard = (id) => {
    setNavigationGuide(navigationGuide.filter(guide => guide.id !== id));
  }

  const removeLastPoint = () => {
    if (currentPath.length > 1) {
      setCurrentPath(prev => prev.slice(0, -1));
    }
  };

  const resetPathPoints = () => {
    setCurrentPath(prev => prev.slice(0, 1));
  };

  const handleCancel = () => {
    navigate(-1);
  };

  // Handle kiosk selection change (only for building edit mode)
  const handleKioskChange = (kioskId) => {
    const selected = kiosksData.find(kiosk => kiosk.kioskID === kioskId);
    setSelectedKiosk(selected);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedKiosk) {
      alert('Please select a kiosk first');
      return;
    }

    const formData = new FormData();

    formData.append('kioskID', selectedKiosk.kioskID);
    formData.append('id', buildingID);
    formData.append('name', name);
    formData.append('description', description);
    formData.append('floor', floor);
    formData.append('path', JSON.stringify(currentPath));
    formData.append('navigationGuide', JSON.stringify(navigationGuide));

    const storedImages = images.filter(img => img.type === 'stored');
    const newFiles = images.filter(img => img.type === 'file');

    const storedIDs = storedImages.map(img => img.data._id);
    formData.append('imageIDs', JSON.stringify(storedIDs));

    newFiles.forEach(imgObj => {
      formData.append('images[]', imgObj.data);
    });

    try {
      let response = null;

      if (path.includes("add-room")) {
        response = await createRoom(formData, buildingID, selectedKiosk.kioskID);
        alert('Room successfully created!');
        navigate('/admin/map-editor');
      }
      else if (path.includes("edit-room")) {
        response = await editRoom(formData, buildingID, selectedKiosk.kioskID, roomID);
        alert('Room successfully edited!');
        navigate('/admin/map-editor');
      }
      else if (path.includes("edit-building")) {
        response = await editBuilding(formData, buildingID, selectedKiosk.kioskID);
        alert('Building successfully edited!');
        navigate('/admin/map-editor');
      }

    }
    catch (error) {
      console.error('Failed to create/edit:', error);
      alert('Operation failed. Please try again.');
    }
  }

  // Initialize kiosk selection
  useEffect(() => {
    if (kiosksData?.length > 0) {
      if (isEditBuildingMode) {
        // For building edit mode, allow kiosk selection with default to first
        setSelectedKiosk(kiosksData[0]);
      }
      else if (kioskID) {
        // For room operations, use the specific kiosk from URL params
        const foundKiosk = kiosksData.find(k => k.kioskID === kioskID);
        setSelectedKiosk(foundKiosk);
      }
      else if (isAddRoomMode) {
        // For add room without specific kiosk, use first available
        setSelectedKiosk(kiosksData[0]);
      }
    }
  }, [kiosksData, kioskID, isEditBuildingMode, isAddRoomMode]);

  // Initialize currentPath with kiosk position for add room mode
  useEffect(() => {
    if (isAddRoomMode && selectedKiosk && currentPath.length === 0) {
      // Initialize with kiosk position as starting point
      const kioskPosition = {
        x: selectedKiosk.x || selectedKiosk.positionX || 0,
        y: selectedKiosk.y || selectedKiosk.positionY || 0
      };
      setCurrentPath([kioskPosition]);
    }
  }, [selectedKiosk, isAddRoomMode, currentPath.length]);

  // Update currentPath when kiosk changes in add room mode
  useEffect(() => {
    if (isAddRoomMode && selectedKiosk) {
      const kioskPosition = {
        x: selectedKiosk.x || selectedKiosk.positionX || 0,
        y: selectedKiosk.y || selectedKiosk.positionY || 0
      };
      setCurrentPath([kioskPosition]);
    }
  }, [selectedKiosk, isAddRoomMode]);

  // Handle building data fetching for edit building mode
  useEffect(() => {
    if (isEditBuildingMode && buildingID) {
      const fetchBuildingData = async () => {
        try {
          const response = await fetchBuilding(buildingID);

          setBuildingName(response.name);
          setName(response.name);
          setDescription(response.description);
          setFloor(response.numberOfFloor);
          setImages(response.image.map(img => ({
            type: 'stored',
            data: img
          })));

          // Store the original data for kiosk-specific updates
          setOriginalBuildingData(response);

        } catch (error) {
          console.error('Failed to fetch building data:', error);
        }
      }

      fetchBuildingData();
    }
  }, [buildingID, isEditBuildingMode]);

  useEffect(() => {
    if (isEditBuildingMode && originalBuildingData && selectedKiosk) {
      const kioskId = selectedKiosk.kioskID;

      const kioskPosition = {
        x: selectedKiosk.x || selectedKiosk.positionX || selectedKiosk.position?.x || selectedKiosk.coordinates?.x || 0,
        y: selectedKiosk.y || selectedKiosk.positionY || selectedKiosk.position?.y || selectedKiosk.coordinates?.y || 0
      };

      // Update navigation path for the selected kiosk
      if (originalBuildingData.navigationPath &&
        originalBuildingData.navigationPath[kioskId] &&
        Array.isArray(originalBuildingData.navigationPath[kioskId]) &&
        originalBuildingData.navigationPath[kioskId].length > 0) {

        // Filter out empty objects and invalid coordinates
        const validPath = originalBuildingData.navigationPath[kioskId].filter(point =>
          point &&
          typeof point === 'object' &&
          (point.x !== undefined || point.y !== undefined) &&
          !Object.keys(point).every(key => point[key] === undefined || point[key] === null || point[key] === '')
        );

        if (validPath.length > 0) {
          console.log('Using existing navigation path:', validPath);
          setCurrentPath([...validPath]);
        } else {
          // No valid path points, initialize with kiosk position
          console.log('No valid path points, using kiosk position:', kioskPosition);
          setCurrentPath([kioskPosition]);
        }
      } else {
        // If no path exists for this kiosk, initialize with kiosk position
        console.log('No navigation path found, using kiosk position:', kioskPosition);
        setCurrentPath([kioskPosition]);
      }

      // Update navigation guide for the selected kiosk
      if (originalBuildingData.navigationGuide &&
        originalBuildingData.navigationGuide[kioskId] &&
        Array.isArray(originalBuildingData.navigationGuide[kioskId])) {

        const validGuide = originalBuildingData.navigationGuide[kioskId].filter(guide =>
          guide &&
          typeof guide === 'object' &&
          Object.keys(guide).length > 0 &&
          !Object.keys(guide).every(key => guide[key] === undefined || guide[key] === null || guide[key] === '')
        );

        // **Crucial Fix:** Map over validGuide to add a unique 'id' if it's missing
        const guideWithIds = validGuide.map(guide => {
          if (!guide.id) { // Check if 'id' property is missing
            return { ...guide, id: uuidv4() }; // Add a new unique ID
          }
          return guide; // If it already has an ID, keep it
        });

        console.log('Setting navigation guide:', guideWithIds);
        setNavigationGuide([...guideWithIds]); // Set the updated array with IDs
      } else {
        console.log('No navigation guide found, setting empty array');
        setNavigationGuide([]);
      }
    }
  }, [selectedKiosk, originalBuildingData, isEditBuildingMode]);

  // Handle room data fetching for edit room mode
  useEffect(() => {
    if (isEditRoomMode && buildingID && roomID && selectedKiosk) {
      const getRoomData = async () => {
        try {
          const response = await fetchRoom(buildingID, roomID);

          setRoomName(response.name);
          setName(response.name);
          setDescription(response.description);
          setFloor(response.floor);
          setImages(response.image.map(img => ({
            type: 'stored',
            data: img
          })));

          const navigationGuideWithIds = response.navigationGuide.map(guide => {
            if (!guide.id) {
              console.log('ferrari')
              return { ...guide, id: uuidv4() };
            }
            return guide;
          });

          console.log(navigationGuideWithIds)
          setNavigationGuide([...navigationGuideWithIds]);

          // Check if navigationPath exists and has valid points
          if (response.navigationPath &&
            Array.isArray(response.navigationPath) &&
            response.navigationPath.length > 0) {

            // Filter out empty/invalid path points
            const validPath = response.navigationPath.filter(point =>
              point &&
              typeof point === 'object' &&
              (point.x !== undefined || point.y !== undefined) &&
              !Object.keys(point).every(key => point[key] === undefined || point[key] === null || point[key] === '')
            );

            if (validPath.length > 0) {
              console.log('Using existing navigation path:', validPath);
              setCurrentPath([...validPath]);
            } else {
              // No valid path points, use kiosk position as starting point
              const kioskPosition = {
                x: selectedKiosk.x || selectedKiosk.positionX || selectedKiosk.position?.x || selectedKiosk.coordinates?.x || 0,
                y: selectedKiosk.y || selectedKiosk.positionY || selectedKiosk.position?.y || selectedKiosk.coordinates?.y || 0
              };
              console.log('No valid path points, using kiosk position:', kioskPosition);
              setCurrentPath([kioskPosition]);
            }
          } else {
            // No navigationPath exists, initialize with kiosk position
            const kioskPosition = {
              x: selectedKiosk.x || selectedKiosk.positionX || selectedKiosk.position?.x || selectedKiosk.coordinates?.x || 0,
              y: selectedKiosk.y || selectedKiosk.positionY || selectedKiosk.position?.y || selectedKiosk.coordinates?.y || 0
            };
            console.log('No navigation path found, using kiosk position:', kioskPosition);
            setCurrentPath([kioskPosition]);
          }

        } catch (error) {
          console.error('Fetch error:', error);
        }
      };

      getRoomData();
    }
  }, [isEditRoomMode, buildingID, roomID, selectedKiosk]); // Added selectedKiosk as dependency

  useEffect(() => {
    const interval = setInterval(() => {
      pingAdmin();
    }, 30000);

    pingAdmin();

    return () => clearInterval(interval);
  }, []);

  console.log(currentPath);

  if (kiosksLoading || navigationIconsLoading) return <div>Loading...</div>;

  if (kiosksError) {
    console.error('Error fetching kiosks:', kiosksError);
    return <div>Error loading kiosks data.</div>;
  }

  if (navigationIconsError) {
    console.error('Error fetching navigation icons:', navigationIconsError);
    return <div>Error loading navigation icons data.</div>;
  }

  return (
    <div className="w-[73.98dvw] flex flex-col gap-[1.1875rem] ml-[19.5625rem] mt-[1.875rem]">
      <div className="flex flex-col gap-[0.1875rem]">
        <h1 className="font-poppins font-bold text-[1.125rem]">
          {isEditRoomMode
            ? `EDIT ${roomName.toUpperCase()} FROM ${buildingName.toUpperCase()}`
            : isEditBuildingMode
              ? `EDIT ${buildingName.toUpperCase()}`
              : `ADD ROOM FOR ${buildingName.toUpperCase()}`}
        </h1>

        <span className="font-roboto text-[.875rem] text-[#4B5563]">
          {isEditRoomMode
            ? `Update the room details and ensure the information for ${roomName.toUpperCase()} stays accurate.`
            : isEditBuildingMode
              ? `Modify the building information such as name, description, or layout to keep records accurate.`
              : `Add a new room to the ${buildingName.toUpperCase()} with essential details and location information.`}
        </span>
      </div>

      <div className="flex gap-[1.4375rem]">
        <div className="flex flex-col gap-[1.25rem]">
          <div className='flex flex-col gap-[.75rem]'>
            <span className='font-bold text-[1rem]'>
              {isEditBuildingMode ? `Building Name` : 'Room Name'}
            </span>
            <div className='w-[36.25dvw] h-[2.25rem] flex items-center border-solid border-[1px] border-black'>
              <input
                type="text"
                placeholder={isEditBuildingMode ? 'Enter the building name here...' : 'Enter the room name here...'}
                className='px-[1rem] text-[.875rem] outline-none w-full'
                onChange={(e) => setName(e.target.value)}
                value={name}
              />
            </div>

            <span className='font-bold text-[1rem]'>Floor Located</span>
            <div className='w-[36.25dvw] h-[2.25rem] flex items-center border-solid border-[1px] border-black'>
              <input
                type="number"
                min={1}
                className='px-[1rem] text-[.875rem] outline-none w-full'
                onChange={(e) => setFloor(parseInt(e.target.value) || 1)}
                value={floor}
              />
            </div>

            <span className='font-bold text-[1rem]'>
              {isEditBuildingMode ? `Building Description` : 'Room Description'}
            </span>
            <textarea
              placeholder={isEditBuildingMode ? 'Enter the building description here...' : 'Enter the room description here...'}
              className='w-[36.25dvw] flex items-center text-[.875rem] border-solid border-[1px] border-black p-[1rem] outline-none'
              onChange={(e) => setDescription(e.target.value)}
              value={description}
            />

            <span className='font-bold text-[1rem]'>Images</span>
            <div className='w-[36.25dvw] h-[7.5625rem] flex items-center justify-center border-dashed border-[1px] border-[#110D79] bg-[#D1D6FA] cursor-pointer relative'>
              <input
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleImageUpload}
                multiple
              />
              <div className="flex flex-col items-center">
                <UploadIcon />
                <p className="text-[#110D79] mt-2">16:9 ratio image required</p>
              </div>
            </div>

            <div className='flex flex-col gap-[0.625rem]'>
              <span className='font-bold font-poppins text-[1.125rem]'>Preview Images</span>
              {images.length > 0 ? (
                <div className="w-[36.25dvw] border-dashed border-black border-[1px] p-4 flex flex-wrap gap-4">
                  {images.map((image, index) => {
                    const isFromBackend = typeof image === 'object' && image.data.file_path;
                    const imageUrl = isFromBackend
                      ? `${import.meta.env.VITE_BASE_URL}/image/${image.data.file_path}`
                      : (image?.data instanceof File || image?.data instanceof Blob)
                        ? URL.createObjectURL(image.data)
                        : image;

                    return (
                      <div key={index} className="relative w-[8rem] h-[8rem]">
                        <img
                          src={imageUrl}
                          alt={`Image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          className="absolute top-1 right-1 bg-white rounded-full p-1 hover:bg-gray-200 cursor-pointer"
                          onClick={() => {
                            const newImages = [...images];
                            const toDelete = newImages[index];
                            if ((toDelete instanceof File || toDelete instanceof Blob) && typeof toDelete === 'object') {
                              URL.revokeObjectURL(imageUrl);
                            }
                            newImages.splice(index, 1);
                            setImages(newImages);
                          }}
                          aria-label="Remove image"
                        >
                          <BlackXIcon />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="w-[36.25dvw] h-[27.3125rem] border-dashed border-black border-[1px] flex items-center justify-center">
                  <span>Images will be shown here...</span>
                </div>
              )}
            </div>

            {/* Kiosk selection - ONLY for building edit mode */}
            {isEditBuildingMode && (
              <>
                <div className='flex flex-col'>
                  <span className='font-bold font-poppins text-[1.125rem]'>Select Kiosk</span>
                  <span className='text-sm text-[#4B5563]'>
                    Choose a kiosk location as the starting point for the navigation guide. This helps define the origin of the <br />navigation path displayed on the map.
                  </span>
                </div>
                <div className='flex flex-col gap-[0.625rem]'>
                  <div className="w-[36.25dvw] h-[2.25rem] bg-[#D1D6FA] flex items-center justify-center border border-[#110D79]">
                    <select
                      id="kioskSelect"
                      aria-label="Select a kiosk"
                      className="w-[33.54dvw] h-full bg-transparent outline-none text-[.875rem] text-[#110D79] font-bold"
                      value={selectedKiosk?.kioskID || ''}
                      onChange={(e) => handleKioskChange(e.target.value)}
                    >
                      {kiosksData?.map((kiosk) => (
                        <option
                          value={kiosk.kioskID}
                          key={kiosk.kioskID}
                          className="bg-[#D1D6FA] text-black text-[.875rem]"
                        >
                          {kiosk.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Navigation Guide and Map - Show for edit modes and add room */}
            {!isAddRoomMode && (
              <div className='flex gap-[1.1875rem]'>
                <div className='flex flex-col gap-[1.1875rem]'>
                  <span className='font-bold text-[1rem]'>Navigation Guide</span>
                  <div className='flex flex-col gap-[.5rem]'>
                    {Array.isArray(navigationGuide) && navigationGuide.length > 0 ? (
                      navigationGuide.map((step, index) => (
                        <div className='flex gap-[0.625rem]' key={step.id}>
                          <NavigationIconsModal
                            icon={step.icon}
                            index={index}
                            updateIcon={updateStepDescription}
                          />
                          <textarea
                            className='w-[30.90dvw] h-[5rem] border-solid border-[1px] border-black flex text-[.875rem] p-[1rem] outline-none'
                            placeholder='Enter your navigation text here...'
                            onChange={(e) => updateStepDescription("DESCRIPTION", index, e.target.value)}
                            value={step.description}
                          />
                          <button
                            className="w-[2.5rem] h-[2.5rem] hover:bg-gray-300 focus:bg-gray-400 flex items-center justify-center rounded-full cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
                            aria-label="Close"
                            onClick={() => removeNavigationGuideCard(step.id)}
                            onMouseUp={(e) => e.currentTarget.blur()}
                          >
                            <BlackXIcon />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p>No navigation has been setup yet for this kiosk</p>
                    )}
                  </div>
                  <button
                    onClick={addNavigationGuideCard}
                    className='w-[36.25dvw] h-[2.25rem] flex items-center gap-[.5rem] px-[1rem] bg-[#D1D6FA] border-solid border-[1px] border-[#110D79] cursor-pointer'
                  >
                    <AddIcon />
                    <span className='text-[.875rem] text-[#110D79] font-bold'>Add more</span>
                  </button>
                </div>

                {/* Map section */}
                <div className='flex flex-col gap-[1rem]'>
                  <div className='w-[36.25dvw] h-[36.25rem] flex flex-col gap-[0.625rem]'>
                    <div className='flex justify-between'>
                      <span className='font-bold font-poppins text-[1.125rem]'>Location</span>
                      <div className='flex gap-[.5rem]'>
                        <button
                          onClick={removeLastPoint}
                          className='flex items-center gap-[.5rem] border-[1px] border-black px-[1rem] cursor-pointer'
                        >
                          <RevertIcon />
                          <span className='text-[.875rem]'>Revert</span>
                        </button>
                        <button
                          onClick={resetPathPoints}
                          className='flex items-center gap-[.5rem] border-[1px] border-black px-[1rem] cursor-pointer'
                        >
                          <ResetIcon />
                          <span className='text-[.875rem]'>Reset</span>
                        </button>
                      </div>
                    </div>
                    <CampusMap
                      mode={import.meta.env.VITE_ADD_ROOM}
                      data={{ selectedKiosk }}
                      currentPath={currentPath}
                      setCurrentPath={setCurrentPath}
                      height={'100%'}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className='flex justify-end gap-[.5rem]'>
            <button
              onClick={handleCancel}
              className='w-[8.359375rem] h-[2.25rem] border-solid border-[1px] border-black text-[.875rem] font-bold cursor-pointer'
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className='w-[8.359375rem] h-[2.25rem] border-solid border-[1px] border-[#1EAF34] bg-[#D1FAE5] text-[#1EAF34] text-[.875rem] font-bold cursor-pointer'
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RoomDetails
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

  const { buildingID, kioskID, roomID } = useParams();

  const [buildingName, setBuildingName] = useState('');
  const [roomName, setRoomName] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [floor, setFloor] = useState(1);
  const [currentPath, setCurrentPath] = useState([]);
  const [selectedKiosk, setSelectedKiosk] = useState(kiosksData?.[kioskID] || null);
  const [navigationGuide, setNavigationGuide] = useState([]);
  const [images, setImages] = useState([]);

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
      icon: navigationIcons.data[0].icon,
      description: ""
    }

    setNavigationGuide([...navigationGuide, newGuide]);
  }

  const updateStepDescription = (rule, index, value) => {
    if (rule === "ICON") {
      const updated = [...navigationGuide];
      console.log('updated', updated);
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

  const handleSubmit = async (e) => {
    e.preventDefault();

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

    console.log(Array.isArray(storedIDs));

    newFiles.forEach(imgObj => {
      formData.append('images[]', imgObj.data); // or 'images[]' if backend expects array
    });

    for (let pair of formData.entries()) {
      console.log(`${pair[0]}:`, pair[1]);
    }

    try {
      let response = null;

      if (path.includes("add-room")) {
        response = await createRoom(formData, buildingID, selectedKiosk.kioskID);
        console.log(response);
        alert('Room successfully created!');
        navigate('/admin/map-editor');
      }
      else if (path.includes("edit-room")) {
        response = await editRoom(formData, buildingID, selectedKiosk.kioskID, roomID);
        console.log(response);
        alert('Room successfully edited!');
        navigate('/admin/map-editor');
      }
      else if (path.includes("edit-building")) {
        response = await editBuilding(formData, buildingID, selectedKiosk.kioskID);
        console.log(response);
        alert('Building successfully edited!');
        navigate('/admin/map-editor');
      }

    }
    catch (error) {
      console.error('Failed to create room:', error);
    }
  }

  console.log('images', images);

  useEffect(() => {
    const fetchBuildingData = async () => {
      try {
        const response = await fetchBuilding(buildingID);
        console.log('Fetched building data:', response);

        setBuildingName(response.name);

        if (isEditBuildingMode) {
          setName(response.name);
          setDescription(response.description);
          setFloor(response.numberOfFloor);
          setImages(response.image.map(img => ({
            type: 'stored',
            data: img
          })));
          setCurrentPath(response.navigationPath[kioskID])
          setNavigationGuide([...response.navigationGuide[kioskID]]);
        }
      }
      catch (error) {
        console.error('Failed to fetch building data:', error);
      }
    }

    fetchBuildingData();

  }, [buildingID, isEditBuildingMode, kioskID])

  console.log('currentPath', currentPath);

  useEffect(() => {
    if (kiosksData?.length > 0) {
      setSelectedKiosk(kiosksData[0]);
    }
  }, [kiosksData]);

  useEffect(() => {
    if (kiosksData && kioskID) {
      const foundKiosk = kiosksData.find(k => k.kioskID === kioskID);
      setSelectedKiosk(foundKiosk || null);
    }
  }, [kiosksData, kioskID]);

  useEffect(() => {
    if (isEditRoomMode) {
      const getRoomData = async () => {
        try {
          if (!roomID) throw new Error('Missing RoomID');

          const response = await fetchRoom(buildingID, roomID);

          console.log('response', response);
          setRoomName(response.name);
          setName(response.name);
          setDescription(response.description);
          setFloor(response.floor);
          setImages(response.image.map(img => ({
            type: 'stored',
            data: img
          })));

          setNavigationGuide([...response.navigationGuide]);
        }
        catch (error) {
          console.error('Fetch error:', error);
        }
      };

      getRoomData();
    }
  }, [isEditRoomMode, buildingID, roomID]);

  console.log(selectedKiosk);

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
          {!isEditRoomMode ?
            <div className="w-[36.25dvw] h-[2.25rem] bg-[#D1D6FA] flex items-center justify-center border border-[#110D79]">

              <select
                id="kioskSelect"
                aria-label="Select a kiosk"
                className="w-[33.54dvw] h-full bg-transparent outline-none text-[.875rem] text-[#110D79] font-bold"
                onChange={(e) => {
                  const selected = kiosksData.find(kiosk => kiosk.kioskID === e.target.value);
                  setSelectedKiosk(selected);
                }}
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
            </div> : null}
          <div className='flex flex-col gap-[.75rem]'>
            <span className='font-bold text-[1rem]'>
              {isEditBuildingMode
                ? `Building Name`
                : 'Room Name'}
            </span>
            <div className='w-[36.25dvw] h-[2.25rem] flex items-center border-solid border-[1px] border-black'>
              <input
                type="text"
                placeholder='Enter the room name here...'
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
                onChange={(e) => setFloor(e.target.value)}
                value={floor}
              />
            </div>
            <span className='font-bold text-[1rem]'>
              {isEditBuildingMode
                ? `Building Description`
                : 'Room Description'}
            </span>
            <textarea
              name=""
              id=""
              placeholder='Enter the room description here...'
              className='w-[36.25dvw]  flex items-center text-[.875rem] border-solid border-[1px] border-black p-[1rem] outline-none'
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
                multiple // Allow multiple file selection
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
                    console.log(image);

                    const isFromBackend = typeof image === 'object' && image.data.file_path;
                    const imageUrl = isFromBackend
                      ? `http://localhost:3000/image/${image.data.file_path}`
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

                            // Revoke only blob URLs or File objects
                            const toDelete = newImages[index];
                            if ((toDelete instanceof File || toDelete instanceof Blob) && typeof toDelete === 'object') {
                              URL.revokeObjectURL(imageUrl); // Revoke object URL based on imageUrl
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
            {isEditBuildingMode || isEditRoomMode ?
              <>
                <span className='font-bold text-[1rem]'>Navigation Guide</span>
                <div className='flex flex-col gap-[.5rem]'>
                  {Array.isArray(navigationGuide) && navigationGuide.length > 0 ? (
                    navigationGuide.map((step, index) => (
                      <div className='flex gap-[0.625rem]' key={step.id}>
                        <NavigationIconsModal icon={step.icon} index={index} updateIcon={updateStepDescription} />
                        <textarea
                          name=""
                          id=""
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
                    <p>No navigation has been setup yet</p>
                  )}
                </div>
                <button
                  onClick={() => addNavigationGuideCard()}
                  className='w-[36.25dvw] h-[2.25rem] flex items-center gap-[.5rem] px-[1rem] bg-[#D1D6FA] border-solid border-[1px] border-[#110D79] cursor-pointer'
                >
                  <AddIcon />
                  <span className='text-[.875rem] text-[#110D79] font-bold'>Add more</span>
                </button>
              </>
              : null}

          </div>
          {isEditBuildingMode || isEditRoomMode ?
            <div className='flex flex-col gap-[1rem]'>
              <div className='w-[36.25dvw] h-[24.755rem] flex flex-col gap-[0.625rem]'>
                <div className='flex justify-between'>
                  <span className='font-bold font-poppins text-[1.125rem]'>Location</span>
                  <div className='flex gap-[.5rem]'>
                    <button
                      onClick={() => removeLastPoint()}
                      className='flex items-center gap-[.5rem] border-[1px] border-black px-[1rem] cursor-pointer'
                    >
                      <RevertIcon />
                      <span className='text-[.875rem]'>Revert</span>
                    </button>
                    <button
                      onClick={() => resetPathPoints()}
                      className='flex items-center gap-[.5rem] border-[1px] border-black px-[1rem] cursor-pointer'
                    >
                      <ResetIcon />
                      <span className='text-[.875rem]'>Reset</span>
                    </button>
                  </div>
                </div>
                <CampusMap mode={import.meta.env.VITE_ADD_ROOM} data={{ selectedKiosk }} currentPath={currentPath} setCurrentPath={setCurrentPath} />
              </div>
            </div>
            : null}
          <div className='flex justify-end gap-[.5rem]'>
            <button onClick={() => handleCancel()} className='w-[8.359375rem] h-[2.25rem] border-solid border-[1px] border-black text-[.875rem] font-bold cursor-pointer'>
              Cancel
            </button>
            <button onClick={(e) => handleSubmit(e)} className='w-[8.359375rem] h-[2.25rem] border-solid border-[1px] border-[#1EAF34] bg-[#D1FAE5] text-[#1EAF34] text-[.875rem] font-bold cursor-pointer'>
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );

}

export default RoomDetails

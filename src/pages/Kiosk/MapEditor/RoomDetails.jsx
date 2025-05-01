import React, { useEffect, useState } from 'react'
import { fetchKiosks, fetchNavigationIcons } from '../../../api/api'
import UploadIcon from '../../../assets/Icons/UploadIcon';
import AddIcon from '../../../assets/Icons/AddIcon';
import XIcon from '../../../assets/Icons/XIcon';
import BlackXIcon from '../../../assets/Icons/BlackXIcon';
import CampusMap from '../../../components/TestKiosk/CampusMap';
import { useQuery } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid'
import { useLocation, useNavigate } from 'react-router-dom';
import ResetIcon from '../../../assets/Icons/ResetIcon';
import RevertIcon from '../../../assets/Icons/RevertIcon';

const RoomDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState('');

  const [roomData, setRoomData] = useState({
    kioskID: "",
    id: "",
    name: "",
    description: "",
    floor: "",
    path: "",
    navigationGuide: [],
  })

  const { data: kiosksData, error: kiosksError, isLoading: kiosksLoading } = useQuery({
    queryKey: ['kiosks'],
    queryFn: fetchKiosks,
  });

  const { data: navigationIcons, error: navigationIconsError, isLoading: navigationIconsLoading } = useQuery({
    queryKey: ['navigationIcons'],
    queryFn: fetchNavigationIcons,
  });

  const [selectedKiosk, setSelectedKiosk] = useState(kiosksData?.[0] || null);
  const [navigationGuide, setNavigationGuide] = useState([]);
  const [images, setImages] = useState([]);

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);

    const newImagePreviews = files.map(file => URL.createObjectURL(file));

    setImages([...images, ...newImagePreviews]);
  };

  const addNavigationGuideCard = () => {
    const newGuide = {
      id: uuidv4(),
      icon: navigationIcons.data[0].icon,
      description: ""
    }

    setNavigationGuide([...navigationGuide, newGuide]);
  }

  const removeNavigationGuideCard = (id) => {
    setNavigationGuide(navigationGuide.filter(guide => guide.id !== id));
  }

  const handleCancel = () => {
    navigate(-1);
  };

  useEffect(() => {
    const path = location.pathname;

    if (path.includes("add-room")) {
      setMode(import.meta.env.VITE_ADD_ROOM);
    }
    else if (path.includes("edit-room")) {
      setMode(import.meta.env.VITE_EDIT_ROOM);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (kiosksData?.length > 0) {
      setSelectedKiosk(kiosksData[0]);
    }
  }, [kiosksData]);

  const [currentPath, setCurrentPath] = useState([]);

  const removeLastPoint = () => {
    if (currentPath.length > 0) {
      setCurrentPath(prev => prev.slice(0, -1));
    }
  };

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
          ADD ROOM FOR DR MARCIANO D. YANGA BUILDING
        </h1>
        <span className="font-roboto text-[.875rem] text-[#4B5563]">
          Add a new room to the Dr. Marciano D. Yanga Building with essential details and location information.
        </span>
      </div>
      <div className="flex gap-[1.4375rem]">
        <div className="flex flex-col gap-[1.25rem]">
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
          </div>
          <div className='flex flex-col gap-[.75rem]'>
            <span className='font-bold text-[1rem]'>Room Name</span>
            <div className='w-[36.25dvw] h-[2.25rem] flex items-center border-solid border-[1px] border-black'>
              <input
                type="text"
                className='px-[1rem] text-[.875rem] outline-none w-full'
              />
            </div>
            <span className='font-bold text-[1rem]'>Floor Located</span>
            <div className='w-[36.25dvw] h-[2.25rem] flex items-center border-solid border-[1px] border-black'>
              <input
                type="number"
                min={1}
                className='px-[1rem] text-[.875rem] outline-none w-full'
              />
            </div>
            <span className='font-bold text-[1rem]'>Room Description</span>
            <textarea
              name=""
              id=""
              className='w-[36.25dvw]  flex items-center text-[.875rem] border-solid border-[1px] border-black p-[1rem] outline-none'
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
            <span className='font-bold text-[1rem]'>Navigation Guide</span>
            <div className='flex flex-col gap-[.5rem]'>
              {Array.isArray(navigationGuide) && navigationGuide.length > 0 ? (
                navigationGuide.map((step, index) => (
                  <div className='flex gap-[0.625rem]' key={step.id}>
                    <div
                      className='w-[2.5rem] h-[2.5rem] border-solid border-[1px] border-black flex items-center justify-center'
                    >
                      <img
                        src={step.icon}
                        alt=""
                      />
                    </div>
                    <textarea
                      name=""
                      id=""
                      className='w-[30.90dvw] h-[5rem] border-solid border-[1px] border-black flex text-[.875rem] p-[1rem] outline-none'
                      placeholder='Enter your navigation text here...'
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
          </div>
          <div className='flex justify-end gap-[.5rem]'>
            <button className='w-[8.359375rem] h-[2.25rem] border-solid border-[1px] border-black text-[.875rem] font-bold'>
              Cancel
            </button>
            <button className='w-[8.359375rem] h-[2.25rem] border-solid border-[1px] border-[#1EAF34] bg-[#D1FAE5] text-[#1EAF34] text-[.875rem] font-bold'>
              Submit
            </button>
          </div>
        </div>
        <div className='flex flex-col gap-[1rem]'>
          <div className='flex flex-col gap-[0.625rem]'>
            <span className='font-bold font-poppins text-[1.125rem]'>Preview Images</span>
            {images.length > 0 ? (
              <div className="w-[28.8375rem] border-dashed border-black border-[1px] p-4 flex flex-wrap gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative w-[8rem] h-[8rem]">
                    <img
                      src={image}
                      alt={`Image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      className="absolute top-1 right-1 bg-white rounded-full p-1 hover:bg-gray-200 cursor-pointer"
                      onClick={() => {
                        const newImages = [...images];
                        URL.revokeObjectURL(newImages[index]);
                        newImages.splice(index, 1);
                        setImages(newImages);
                      }}
                      aria-label="Remove image"
                    >
                      <BlackXIcon />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-[28.8375rem] h-[27.3125rem] border-dashed border-black border-[1px] flex items-center justify-center">
                <span>Images will be shown here...</span>
              </div>
            )}
          </div>
          <div className='w-[28.8375rem] h-[24.755rem] flex flex-col gap-[0.625rem]'>
            <div className='flex justify-between'>
              <span className='font-bold font-poppins text-[1.125rem]'>Locate a Building</span>
              <div className='flex gap-[.5rem]'>
                <div className='flex items-center gap-[.5rem] border-[1px] border-black px-[1rem]'>
                  <RevertIcon />
                  <span className='text-[.875rem]'>Revert</span>
                </div>
                <div className='flex items-center gap-[.5rem] border-[1px] border-black px-[1rem]'>
                  <ResetIcon />
                  <span className='text-[.875rem]'>Reset</span>
                </div>
              </div>
            </div>
            <CampusMap mode={import.meta.env.VITE_ADD_ROOM} data={{ selectedKiosk }} currentPath={currentPath} setCurrentPath={setCurrentPath} />
          </div>
        </div>
      </div>
    </div>
  );

}

export default RoomDetails

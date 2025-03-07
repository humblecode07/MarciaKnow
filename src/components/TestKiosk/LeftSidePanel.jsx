import BuildingIcon from "../../assets/Icons/BuildingIcon"
import LibraryIcon from "../../assets/Icons/LibraryIcon"
import RegisterIcon from "../../assets/Icons/RegisterIcon"
import SearchIcon from "../../assets/Icons/SearchIcon"
import yangaLogo from '../../../public/Photos/yangaLogo.png'

const LeftSidePanel = () => {
   return (
      <section className='w-[18.75rem] h-[49.4375rem] py-[1.125rem] flex flex-col bg-[#FBFCF8] shadow-md relative'>
         <div className="flex gap-[.5rem] px-[1rem]">
            <img
               src={yangaLogo}
               alt=""
               className='w-[6.25rem] h-[6.25rem] object-cover'
            />
            <div className='w-[10rem] flex flex-col font-righteous text-center'>
               <span className=' text-[1.75rem] text-[#110D79]'>Marcia<span className='text-[#DBB341]'>Know</span></span>
               <span className='text-[1.125rem] text-[#00AF26]'>Your way around the campus</span>
            </div>
         </div>
         <div className='h-[2.25rem] w-[16.75rem] border-solid border-[1px] border-black flex items-center gap-[0.6875rem] px-[1rem] ml-[1rem] mt-[2rem]'>
            <SearchIcon />
            <input
               type="text"
               placeholder='Search for a building or room...'
               className='w-[13.25rem] outline-none font-roboto text-[0.875rem]'
            />
         </div>
         <div className='flex flex-col font-righteous mt-[1.5625rem] gap-[1.125rem] px-[1rem]'>
            <span className='text-[1.125rem]'>Quick Suggestions:</span>
            <div className='flex flex-col gap-[.875rem]'>
               <div className='w-[16.75rem] h-[2.5625rem] flex items-center gap-[1.3125rem] bg-[#FBF9F6] shadow-md px-[1rem]'>
                  <LibraryIcon />
                  <span className='text-[.875rem]'>Find the Library</span>
               </div>
               <div className='w-[16.75rem] h-[2.5625rem] flex items-center gap-[1.3125rem] bg-[#FBF9F6] shadow-md px-[1rem]'>
                  <BuildingIcon />
                  <span className='text-[.875rem]'>Navigate to Sofia Bldg. 2</span>
               </div>
               <div className='w-[16.75rem] h-[2.5625rem] flex items-center gap-[1.3125rem] bg-[#FBF9F6] shadow-md px-[1rem]'>
                  <RegisterIcon />
                  <span className='text-[.875rem]'>Find the Cashier</span>
               </div>
            </div>
         </div>
         <div className='absolute bottom-0 flex flex-col font-righteous text-[.875rem]'>
            <div className='w-[18.75rem] flex'>
               <button className='w-[9.375rem] h-[3.5rem] bg-[#4329D8] flex justify-center items-center border-solid border-[1px] border-black text-white'>
                  Need Help?
               </button>
               <button className='w-[9.375rem] h-[3.5rem] bg-[#4329D8] flex justify-center items-center border-solid border-[1px] border-black text-white'>
                  Any reports or feedback?
               </button>
            </div>
            <div className='w-[18.75rem] h-[3.5rem] flex items-center justify-between bg-[#DBB341] px-[1.3125rem] text-white'>
               <div className='flex gap-[1rem]'>
                  <span>Kiosk-1</span>
                  <span className='text-[#1EAF34]'>Online</span>
               </div>
               <div className='flex flex-col text-center'>
                  <span>12:00 PM</span>
                  <span>12/19/2024</span>
               </div>
            </div>
         </div>
      </section>
   )
}

export default LeftSidePanel

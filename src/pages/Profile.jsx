import React from 'react'

const Profile = () => {
  return (
    <div className="flex flex-col gap-[1.1875rem] ml-[19.5625rem] mt-[1.875rem] font-roboto">
      asa<circle cx="0" cy="0" r="25" fill="red" stroke="#ff0000" strokeWidth="3">
        <animate attributeName="r" values="20;30;20" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
      </circle>
    </div>
  )
}

export default Profile

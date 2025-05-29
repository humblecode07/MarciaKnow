import { useState } from 'react'
import DangoMenuIcon from "../../assets/Icons/DangoMenuIcon"
import SentIcon from "../../assets/Icons/SentIcon"
import yangaLogo from '../../../public/Photos/yangaLogo.png'
import { askGroq } from '../../api/api'

const RightSidePanel = ({ kiosk }) => {
   const [messages, setMessages] = useState([
      {
         id: 1,
         text: "Hello! I'm your Virtual AI Assistant. I'm here to help you navigate the campus and find buildings, rooms, or facilities. Feel free to ask me anything about locations or directions!",
         sender: "ai"
      }
   ])

   const [inputMessage, setInputMessage] = useState('')
   const [isLoading, setIsLoading] = useState(false)

   const handleSendMessage = async (e) => {
      e.preventDefault()

      if (!inputMessage.trim()) return

      // Add user message to chat
      const userMessage = {
         id: Date.now(),
         text: inputMessage,
         sender: "user"
      }

      setMessages(prev => [...prev, userMessage])
      const currentMessage = inputMessage
      setInputMessage('')
      setIsLoading(true)

      try {
         const response = await askGroq(currentMessage, kiosk.kioskID)

         console.log(inputMessage);
         console.log(response);

         const aiMessage = {
            id: Date.now() + 1,
            text: response.answer,
            sender: "ai"
         }

         setMessages(prev => [...prev, aiMessage])
      } catch (error) {
         console.error('Error sending message:', error)
         const errorMessage = {
            id: Date.now() + 1,
            text: "Sorry, I'm having trouble responding right now. Please try again.",
            sender: "ai"
         }
         setMessages(prev => [...prev, errorMessage])
      } finally {
         setIsLoading(false)
      }
   }

   const handleKeyPress = (e) => {
      if (e.key === 'Enter') {
         handleSendMessage(e)
      }
   }

   return (
      <section className='w-[18.75rem] h-[49.4375rem] flex flex-col bg-[#FBFCF8] shadow-md relative font-righteous mt-[3.25rem]'>
         <div className='w-full h-[3.5rem] bg-[#FBF9F6] shadow-md flex items-center justify-between px-[.75rem]'>
            <div className='flex gap-[0.625rem] items-center'>
               <img
                  src={yangaLogo}
                  alt=""
                  className='w-[2.3125rem] h-[2.3125rem] object-cover'
               />
               <span className='text-[.875rem]'>Virtual AI Assistant</span>
            </div>
            <div className='pr-[.625rem]'>
               <DangoMenuIcon />
            </div>
         </div>

         <div className='h-full py-[1.3125rem] px-[.75rem] flex flex-col gap-[1.3125rem] font-roboto font-light overflow-y-auto'>
            {messages.map((message) => (
               <div key={message.id} className={`flex gap-[0.8125rem] ${message.sender === 'user' ? 'justify-end' : ''}`}>
                  {message.sender === 'ai' && (
                     <img
                        src={yangaLogo}
                        alt=""
                        className='w-[1.5rem] h-[1.5rem] object-cover'
                     />
                  )}
                  <div className='px-[0.625rem] py-[.5rem] bg-[#F5F5F5] overflow-hidden'>
                     <span className='text-[.75rem]'>
                        {message.text}
                     </span>
                  </div>
                  {message.sender === 'user' && (
                     <img
                        src={yangaLogo}
                        alt=""
                        className='w-[1.5rem] h-[1.5rem] object-cover'
                     />
                  )}
               </div>
            ))}

            {isLoading && (
               <div className='flex gap-[0.8125rem]'>
                  <img
                     src={yangaLogo}
                     alt=""
                     className='w-[1.5rem] h-[1.5rem] object-cover'
                  />
                  <div className='px-[0.625rem] py-[.5rem] bg-[#F5F5F5] overflow-hidden'>
                     <span className='text-[.75rem]'>
                        Typing...
                     </span>
                  </div>
               </div>
            )}
         </div>

         <form onSubmit={handleSendMessage} className='w-[18.75rem] h-[2.9375rem] bg-[#FBF9F6] shadow-md flex items-center justify-center gap-[0.625rem] border-solid border-t-[1px] border-black'>
            <div className='w-[14.8125rem] h-[1.625rem] px-[0.625rem] flex items-center font-roboto font-light text-[.75rem] border-solid border-[1px] border-black'>
               <input
                  type="text"
                  placeholder='Type your message...'
                  className='w-[13.5625rem] outline-none'
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
               />
            </div>
            <button
               type="submit"
               className='w-[1.8125rem] h-[1.625rem] flex justify-center items-center bg-[#D1D6FA] hover:bg-[#B8C1F7] disabled:opacity-50'
               disabled={isLoading || !inputMessage.trim()}
            >
               <SentIcon />
            </button>
         </form>
      </section>
   )
}

export default RightSidePanel
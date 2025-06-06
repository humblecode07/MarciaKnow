import { useState, useRef } from 'react'
import DangoMenuIcon from "../../assets/Icons/DangoMenuIcon"
import SentIcon from "../../assets/Icons/SentIcon"
import yangaLogo from '../../../public/Photos/yangaLogo.png'
import { askGroq, logChatbotInteraction } from '../../api/api'

const RightSidePanel = ({ kiosk, width, height, onLocationDetected }) => {
   const [messages, setMessages] = useState([
      {
         id: 1,
         text: "Hello! I'm your Virtual AI Assistant. I'm here to help you navigate the campus and find buildings, rooms, or facilities. Feel free to ask me anything about locations or directions!",
         sender: "ai"
      }
   ])
   const [inputMessage, setInputMessage] = useState('')
   const [isLoading, setIsLoading] = useState(false)
   const sessionIdRef = useRef(Date.now().toString()) // Generate session ID once

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

      const startTime = Date.now()

      console.log('Kiosk prop:', kiosk);
      console.log('Kiosk ID:', kiosk?.kioskID);

      try {
         const response = await askGroq(currentMessage, kiosk.kioskID)
         console.log('AI Response:', response)

         const responseTime = Date.now() - startTime

         // Add AI message to chat
         const aiMessage = {
            id: Date.now() + 1,
            text: response.answer,
            sender: "ai"
         }
         setMessages(prev => [...prev, aiMessage])

         // Prepare interaction data for logging
         const interactionData = {
            kioskID: kiosk.kioskID,
            userMessage: currentMessage,
            aiResponse: response.answer,
            detectedLocation: response.detected_location || {},
            responseTime: responseTime,
            sessionId: sessionIdRef.current
         }

         // Log the interaction to the backend
         try {
            const response = await logChatbotInteraction(interactionData);
            console.log('success', response);
            console.log('Interaction logged successfully');
         }
         catch (logError) {
            console.error('Failed to log interaction:', logError);
            // Optionally show user a non-intrusive warning
            // but don't break the chat experience
         }

         // Handle location detection
         if (response.detected_location && response.detected_location.name) {
            const locationData = {
               name: response.detected_location.name,
               type: response.detected_location.type,
               confidence: response.detected_location.confidence,
               action: response.detected_location.action,
               userQuery: currentMessage
            }
            console.log('Location detected:', locationData)

            // Call the parent component's handler
            if (onLocationDetected) {
               onLocationDetected(locationData)
            }

            // Add a system message indicating action taken
            if (response.detected_location.action === 'navigate') {
               const systemMessage = {
                  id: Date.now() + 2,
                  text: `🗺 I've started navigation to ${response.detected_location.name}. Check the map for directions!`,
                  sender: "system"
               }
               setMessages(prev => [...prev, systemMessage])
            } else if (response.detected_location.action === 'search') {
               const systemMessage = {
                  id: Date.now() + 2,
                  text: `🔍 I've searched for "${response.detected_location.name}" in the system.`,
                  sender: "system"
               }
               setMessages(prev => [...prev, systemMessage])
            }
         }
      }
      catch (error) {
         console.error('Error sending message:', error)
         const responseTime = Date.now() - startTime

         const errorMessage = {
            id: Date.now() + 1,
            text: "Sorry, I'm having trouble responding right now. Please try again.",
            sender: "ai"
         }
         setMessages(prev => [...prev, errorMessage])

         // Log error interaction
         try {
            const errorInteractionData = {
               kioskID: kiosk.kioskID,
               userMessage: currentMessage,
               aiResponse: "Error: Failed to get response",
               detectedLocation: {},
               responseTime: responseTime,
               sessionId: sessionIdRef.current
            }

            const response = await logChatbotInteraction(errorInteractionData);
            console.log(response);
         } catch (logError) {
            console.error('Failed to log error interaction:', logError)
         }
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
      <section
         className='flex flex-col bg-[#FBFCF8] shadow-md relative font-righteous'
         style={{ width, height }}
      >
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
                  {(message.sender === 'ai' || message.sender === 'system') && (
                     <img
                        src={yangaLogo}
                        alt=""
                        className='w-[1.5rem] h-[1.5rem] object-cover'
                     />
                  )}
                  <div className={`px-[0.625rem] py-[.5rem] overflow-hidden ${message.sender === 'system'
                     ? 'bg-[#E8F5E8] border-l-4 border-[#4CAF50]'
                     : 'bg-[#F5F5F5]'
                     }`}>
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
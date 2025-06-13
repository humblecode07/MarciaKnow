import { useState, useRef, useEffect } from 'react'
import DangoMenuIcon from "../../assets/Icons/DangoMenuIcon"
import SentIcon from "../../assets/Icons/SentIcon"
import yangaLogo from '../../../public/Photos/yangaLogo.png'
import userLogo from '../../../public/Photos/userLogo.png'
import { askGroq, logChatbotInteraction } from '../../api/api'

const RightSidePanel = ({ kiosk, width, height, onLocationDetected, selectedBuilding }) => {
   const [messages, setMessages] = useState([
      {
         id: 1,
         text: "Hello! I'm your Virtual AI Assistant, MarciaBot. I'm here to help you navigate the campus and find buildings, rooms, or facilities. Simply click on any building on the map to learn more about it, or ask me anything about locations and directions!",
         sender: "ai"
      }
   ])
   const [inputMessage, setInputMessage] = useState('')
   const [isLoading, setIsLoading] = useState(false)
   const [lastClickedBuilding, setLastClickedBuilding] = useState(null)
   const sessionIdRef = useRef(Date.now().toString())
   const messagesEndRef = useRef(null)

   // Auto-scroll to bottom when new messages are added
   const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
   }

   useEffect(() => {
      scrollToBottom()
   }, [messages])

   // Handle building selection from map - Enhanced version
   // useEffect(() => {
   //    if (selectedBuilding && selectedBuilding.name) {
   //       // Prevent duplicate requests for the same building
   //       if (lastClickedBuilding && lastClickedBuilding._id === selectedBuilding._id) {
   //          return
   //       }
         
   //       setLastClickedBuilding(selectedBuilding)
   //       handleBuildingClick(selectedBuilding)
   //    }
   // }, [selectedBuilding])

   const handleBuildingClick = async (building) => {
      // Don't show the "you clicked" message - make it seamless
      // Instead, immediately start getting the description
      
      // Add a more natural system message
      const clickMessage = {
         id: Date.now(),
         text: `📍 **${building.name}**`,
         sender: "building_header"
      }
      setMessages(prev => [...prev, clickMessage])

      // Create a more specific query for better AI responses
      const buildingQuery = `Provide a comprehensive description of ${building.name}. Include:
      - What the building is primarily used for
      - Key facilities, departments, or services available
      - Any notable features or information students should know
      - Accessibility information if relevant
      
      Keep the response informative but conversational, as if you're a helpful campus guide.`

      setIsLoading(true)
      const startTime = Date.now()

      try {
         const response = await askGroq(buildingQuery, kiosk.kioskID)
         const responseTime = Date.now() - startTime

         // Add AI response to chat
         const aiMessage = {
            id: Date.now() + 1,
            text: response.answer,
            sender: "ai"
         }
         setMessages(prev => [...prev, aiMessage])

         // Add a helpful follow-up message
         const followUpMessage = {
            id: Date.now() + 2,
            text: "💡 Need directions to this building? Just ask me 'How do I get to " + building.name + "?' or click on another building to learn more!",
            sender: "system"
         }
         setMessages(prev => [...prev, followUpMessage])

         // Log the interaction
         const interactionData = {
            kioskID: kiosk.kioskID,
            userMessage: `Building clicked: ${building.name}`,
            aiResponse: response.answer || "No response generated",
            detectedLocation: response.detected_location || {},
            responseTime: responseTime,
            sessionId: sessionIdRef.current,
            interactionType: 'building_click'
         }

         try {
            await logChatbotInteraction(interactionData)
            console.log('Building click interaction logged successfully')
         } catch (logError) {
            console.error('Failed to log building click interaction:', logError)
         }

      } catch (error) {
         console.error('Error getting building information:', error)
         const responseTime = Date.now() - startTime

         const errorMessage = {
            id: Date.now() + 1,
            text: `I apologize, but I couldn't retrieve information about ${building.name} at the moment. Please try clicking on it again or feel free to ask me directly about this building.`,
            sender: "ai"
         }
         setMessages(prev => [...prev, errorMessage])

         // Log error interaction
         try {
            const errorInteractionData = {
               kioskID: kiosk.kioskID,
               userMessage: `Building clicked: ${building.name}`,
               aiResponse: "Error: Failed to get building information",
               detectedLocation: {},
               responseTime: responseTime,
               sessionId: sessionIdRef.current,
               interactionType: 'building_click_error'
            }
            await logChatbotInteraction(errorInteractionData)
         } catch (logError) {
            console.error('Failed to log error interaction:', logError)
         }
      } finally {
         setIsLoading(false)
      }
   }

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
            aiResponse: response.answer || "No response generated",
            detectedLocation: response.detected_location || {},
            responseTime: responseTime,
            sessionId: sessionIdRef.current,
            interactionType: 'text_query'
         }

         console.log('Full AI Response:', response)
         console.log('Response.answer:', response.answer)
         console.log('Type of response.answer:', typeof response.answer)

         // Log the interaction to the backend
         try {
            const response = await logChatbotInteraction(interactionData);
            console.log('success', response);
            console.log('Interaction logged successfully');
         }
         catch (logError) {
            console.error('Failed to log interaction:', logError);
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
               sessionId: sessionIdRef.current,
               interactionType: 'text_query_error'
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

   console.log(messages);

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
                  {message.sender === 'building_header' && (
                     <div className='w-[1.5rem] h-[1.5rem] flex items-center justify-center bg-[#4CAF50] rounded-full'>
                        <span className='text-white text-[0.625rem]'>🏢</span>
                     </div>
                  )}
                  <div className={`px-[0.625rem] py-[.5rem] overflow-hidden ${
                     message.sender === 'building_header'
                        ? 'bg-[#E8F5E8] border-l-4 border-[#4CAF50] font-medium'
                        : message.sender === 'system'
                           ? 'bg-[#FFF3E0] border-l-4 border-[#FF9800]'
                           : message.sender === 'ai'
                              ? 'bg-[#F5F5F5]'
                              : 'bg-[#E3F2FD]'
                  }`}>
                     <span className={`text-[.75rem] ${message.sender === 'building_header' ? 'font-semibold' : ''}`}>
                        {message.text}
                     </span>
                  </div>
                  {message.sender === 'user' && (
                     <img
                        src={userLogo}
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
                        Getting building information...
                     </span>
                  </div>
               </div>
            )}
            <div ref={messagesEndRef} />
         </div>
         <form onSubmit={handleSendMessage} className='w-[18.75rem] h-[2.9375rem] bg-[#FBF9F6] shadow-md flex items-center justify-center gap-[0.625rem] border-solid border-t-[1px] border-black'>
            <div className='w-[14.8125rem] h-[1.625rem] px-[0.625rem] flex items-center font-roboto font-light text-[.75rem] border-solid border-[1px] border-black'>
               <input
                  type="text"
                  placeholder='Ask me anything or click a building on the map...'
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
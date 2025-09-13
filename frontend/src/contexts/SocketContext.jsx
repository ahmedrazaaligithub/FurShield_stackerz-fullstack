import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'
const SocketContext = createContext()
export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const { user, token } = useAuth()
  useEffect(() => {
    if (user && token) {
      const socketInstance = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
        auth: {
          token: token
        }
      })
      socketInstance.on('connect', () => {
        setConnected(true)
        console.log('Socket connected')
      })
      socketInstance.on('disconnect', () => {
        setConnected(false)
        console.log('Socket disconnected')
      })
      socketInstance.on('new_notification', (notification) => {
        setNotifications(prev => [notification, ...prev])
        setUnreadCount(prev => prev + 1)
        toast.success(notification.title)
      })
      socketInstance.on('new_message', (message) => {
        toast.success(`New message from ${message.sender.name}`)
      })
      socketInstance.on('appointment_confirmed', ({ appointment, notification }) => {
        toast.success('Your appointment has been confirmed!')
      })
      socketInstance.on('appointment_cancelled', ({ appointment, notification }) => {
        toast.error('Your appointment has been cancelled')
      })
      socketInstance.on('payment_confirmed', ({ order, notification }) => {
        toast.success(`Payment of $${order.total} confirmed!`)
      })
      socketInstance.on('admin_broadcast', ({ title, message, priority }) => {
        const toastType = priority === 'high' ? 'error' : priority === 'medium' ? 'success' : 'info'
        toast[toastType](`${title}: ${message}`)
      })
      socketInstance.on('chat_request', ({ notification, appointmentId, requesterId }) => {
        toast.success('New chat request received')
      })
      socketInstance.on('chat_request_accepted', ({ notification, chatRoom, appointmentId }) => {
        toast.success('Chat request accepted!')
      })
      socketInstance.on('vet_accepted_chat', ({ appointmentId, vetName }) => {
        toast.success(`${vetName} has joined the chat`)
      })
      socketInstance.on('adoption_status_update', ({ listing, status, notification }) => {
        const message = status === 'approved' ? 'Your adoption application was approved!' : 'Your adoption application status was updated'
        toast.success(message)
      })
      socketInstance.on('payment_provider_added', ({ provider }) => {
        toast.success(`New payment method available: ${provider.name}`)
      })
      socketInstance.on('error', (error) => {
        toast.error(error.message)
      })
      setSocket(socketInstance)
      return () => {
        socketInstance.disconnect()
        setSocket(null)
        setConnected(false)
      }
    }
  }, [user, token])
  const joinChat = (chatRoom, appointmentId) => {
    if (socket) {
      socket.emit('join_chat', { chatRoom, appointmentId })
    }
  }
  const sendMessage = (messageData) => {
    if (socket) {
      socket.emit('send_message', messageData)
    }
  }
  const markMessagesRead = (chatRoom) => {
    if (socket) {
      socket.emit('mark_messages_read', { chatRoom })
    }
  }
  const requestChat = (vetId, appointmentId, message) => {
    if (socket) {
      socket.emit('request_chat', { vetId, appointmentId, message })
    }
  }
  const acceptChatRequest = (appointmentId, requesterId) => {
    if (socket) {
      socket.emit('accept_chat_request', { appointmentId, requesterId })
    }
  }
  const startTyping = (chatRoom) => {
    if (socket) {
      socket.emit('typing_start', { chatRoom })
    }
  }
  const stopTyping = (chatRoom) => {
    if (socket) {
      socket.emit('typing_stop', { chatRoom })
    }
  }
  const sendAdminBroadcast = (broadcastData) => {
    if (socket) {
      socket.emit('admin_broadcast', broadcastData)
    }
  }
  const notifyPaymentCompleted = (orderId, amount) => {
    if (socket) {
      socket.emit('payment_completed', { orderId, amount, adminNotify: true })
    }
  }
  const markNotificationRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif._id === notificationId 
          ? { ...notif, isRead: true }
          : notif
      )
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }
  const clearAllNotifications = () => {
    setNotifications([])
    setUnreadCount(0)
  }
  const value = {
    socket,
    connected,
    notifications,
    unreadCount,
    joinChat,
    sendMessage,
    markMessagesRead,
    requestChat,
    acceptChatRequest,
    startTyping,
    stopTyping,
    sendAdminBroadcast,
    notifyPaymentCompleted,
    markNotificationRead,
    clearAllNotifications
  }
  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}
export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}
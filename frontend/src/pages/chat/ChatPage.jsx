import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { chatAPI } from '../../services/api'
import { useSocket } from '../../contexts/SocketContext'
import { useAuth } from '../../contexts/AuthContext'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { 
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  UserIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import { cn } from '../../utils/cn'
import toast from 'react-hot-toast'
const ChatMessage = ({ message, isOwn }) => (
  <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
    <div className={cn(
      'max-w-xs lg:max-w-md px-4 py-2 rounded-lg',
      isOwn 
        ? 'bg-primary-600 text-white' 
        : 'bg-gray-200 text-gray-900'
    )}>
      <p className="text-sm">{message.content}</p>
      <p className={cn(
        'text-xs mt-1',
        isOwn ? 'text-primary-100' : 'text-gray-500'
      )}>
        {new Date(message.createdAt).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        })}
      </p>
    </div>
  </div>
)
const ChatList = ({ chats, activeChat, onChatSelect }) => (
  <div className="space-y-2">
    {chats.map((chat) => (
      <button
        key={chat._id}
        onClick={() => onChatSelect(chat)}
        className={cn(
          'w-full p-3 text-left rounded-lg transition-colors',
          activeChat?._id === chat._id
            ? 'bg-primary-50 border-primary-200'
            : 'hover:bg-gray-50'
        )}
      >
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {chat.participants.find(p => p._id !== chat.currentUserId)?.avatar ? (
              <img
                src={chat.participants.find(p => p._id !== chat.currentUserId).avatar}
                alt=""
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                <UserIcon className="h-5 w-5 text-gray-400" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {chat.participants.find(p => p._id !== chat.currentUserId)?.name || 'Unknown User'}
            </p>
            <p className="text-sm text-gray-500 truncate">
              {chat.lastMessage?.content || 'No messages yet'}
            </p>
          </div>
          {chat.unreadCount > 0 && (
            <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-primary-600 rounded-full">
              {chat.unreadCount}
            </span>
          )}
        </div>
      </button>
    ))}
  </div>
)
export default function ChatPage() {
  const { user } = useAuth()
  const { socket } = useSocket()
  const queryClient = useQueryClient()
  const messagesEndRef = useRef(null)
  const [activeChat, setActiveChat] = useState(null)
  const [newMessage, setNewMessage] = useState('')
  const [showNewChatModal, setShowNewChatModal] = useState(false)
  const { data: chats, isLoading: chatsLoading } = useQuery({
    queryKey: ['chats'],
    queryFn: chatAPI.getChats
  })
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', activeChat?._id],
    queryFn: () => activeChat ? chatAPI.getMessages(activeChat._id) : null,
    enabled: !!activeChat
  })
  const sendMessageMutation = useMutation({
    mutationFn: ({ chatId, content }) => chatAPI.sendMessage(chatId, { content }),
    onSuccess: (data) => {
      setNewMessage('')
      queryClient.invalidateQueries(['messages', activeChat._id])
      queryClient.invalidateQueries(['chats'])
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to send message')
    }
  })
  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !activeChat) return
    sendMessageMutation.mutate({
      chatId: activeChat._id,
      content: newMessage.trim()
    })
  }
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  useEffect(() => {
    scrollToBottom()
  }, [messages])
  useEffect(() => {
    if (socket && activeChat) {
      socket.emit('join-chat', activeChat._id)
      const handleNewMessage = (message) => {
        queryClient.invalidateQueries(['messages', activeChat._id])
        queryClient.invalidateQueries(['chats'])
      }
      socket.on('new-message', handleNewMessage)
      return () => {
        socket.off('new-message', handleNewMessage)
        socket.emit('leave-chat', activeChat._id)
      }
    }
  }, [socket, activeChat, queryClient])
  const chatList = chats?.data?.data || []
  const messageList = messages?.data?.data || []
  return (
    <div className="h-[calc(100vh-8rem)] flex">
      {}
      <div className="flex-1 flex flex-col">
        {activeChat ? (
          <>
            {}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {activeChat.participants.find(p => p._id !== user.id)?.avatar ? (
                    <img
                      src={activeChat.participants.find(p => p._id !== user.id).avatar}
                      alt=""
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-gray-400" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {activeChat.participants.find(p => p._id !== user.id)?.name || 'Unknown User'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {activeChat.participants.find(p => p._id !== user.id)?.role || 'User'}
                  </p>
                </div>
              </div>
            </div>
            {}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messagesLoading ? (
                <div className="flex justify-center items-center h-32">
                  <LoadingSpinner />
                </div>
              ) : messageList.length === 0 ? (
                <div className="text-center py-8">
                  <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No messages yet</p>
                  <p className="text-sm text-gray-400">Send a message to start the conversation</p>
                </div>
              ) : (
                messageList.map((message) => (
                  <ChatMessage
                    key={message._id}
                    message={message}
                    isOwn={message.sender._id === user.id}
                  />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            {}
            <div className="p-4 border-t border-gray-200 bg-white">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="input flex-1"
                  disabled={sendMessageMutation.isPending}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  className="btn btn-primary"
                >
                  {sendMessageMutation.isPending ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <PaperAirplaneIcon className="h-4 w-4" />
                  )}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <ChatBubbleLeftRightIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Chat Feature</h3>
              <p className="text-gray-500 mb-4">Connect with veterinarians, shelter staff, and other pet owners</p>
              <button
                onClick={() => setShowNewChatModal(true)}
                className="btn btn-primary"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Start New Conversation
              </button>
            </div>
          </div>
        )}
      </div>
      {}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Start New Conversation</h3>
            <p className="text-gray-600 mb-4">
              Search for veterinarians, shelter staff, or other pet owners to start a conversation.
            </p>
            <input
              type="text"
              placeholder="Search users..."
              className="input w-full mb-4"
            />
            <div className="flex space-x-3">
              <button className="btn btn-primary flex-1">
                Start Chat
              </button>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="btn btn-outline flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
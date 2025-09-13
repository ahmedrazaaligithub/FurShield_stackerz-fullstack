import { useState, useRef, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { aiAPI } from '../../services/api'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { 
  SparklesIcon,
  PaperAirplaneIcon,
  UserIcon,
  HeartIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline'
import { cn } from '../../utils/cn'
import toast from 'react-hot-toast'
const Message = ({ message, isUser }) => (
  <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
    <div className={cn(
      'max-w-3xl flex space-x-3',
      isUser ? 'flex-row-reverse space-x-reverse' : 'flex-row'
    )}>
      <div className="flex-shrink-0">
        {isUser ? (
          <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center">
            <UserIcon className="h-4 w-4 text-white" />
          </div>
        ) : (
          <div className="h-8 w-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <SparklesIcon className="h-4 w-4 text-white" />
          </div>
        )}
      </div>
      <div className={cn(
        'px-4 py-3 rounded-lg',
        isUser 
          ? 'bg-primary-600 text-white' 
          : 'bg-gray-100 text-gray-900'
      )}>
        <div className="prose prose-sm max-w-none">
          {message.content.split('\n').map((line, index) => (
            <p key={index} className={cn(
              'mb-2 last:mb-0',
              isUser ? 'text-white' : 'text-gray-900'
            )}>
              {line}
            </p>
          ))}
        </div>
        <div className={cn(
          'text-xs mt-2',
          isUser ? 'text-primary-100' : 'text-gray-500'
        )}>
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>
    </div>
  </div>
)
const SuggestedQuestions = ({ onQuestionClick }) => {
  const questions = [
    "What should I feed my new puppy?",
    "How often should I take my cat to the vet?",
    "My dog is showing signs of anxiety, what can I do?",
    "What are the signs of a healthy pet?",
    "How do I introduce a new pet to my existing pets?",
    "What vaccinations does my pet need?"
  ]
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-700 flex items-center">
        <LightBulbIcon className="h-4 w-4 mr-2" />
        Suggested Questions
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {questions.map((question, index) => (
          <button
            key={index}
            onClick={() => onQuestionClick(question)}
            className="text-left p-3 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  )
}
export default function AIAssistantPage() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      content: "Hello! I'm your AI pet care assistant. I'm here to help you with any questions about pet health, nutrition, behavior, and general care. How can I assist you today?",
      isUser: false,
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const askAIMutation = useMutation({
    mutationFn: aiAPI.askQuestion,
    onSuccess: (data) => {
      const aiResponse = {
        id: Date.now() + 1,
        content: data.data.data.response,
        isUser: false,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiResponse])
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to get AI response')
      const errorMessage = {
        id: Date.now() + 1,
        content: "I'm sorry, I'm having trouble processing your request right now. Please try again later.",
        isUser: false,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    }
  })
  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!inputMessage.trim()) return
    const userMessage = {
      id: Date.now(),
      content: inputMessage.trim(),
      isUser: true,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    askAIMutation.mutate({ question: inputMessage.trim() })
    setInputMessage('')
  }
  const handleSuggestedQuestion = (question) => {
    setInputMessage(question)
    inputRef.current?.focus()
  }
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  useEffect(() => {
    scrollToBottom()
  }, [messages])
  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      {}
      <div className="flex items-center space-x-3 mb-6">
        <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
          <SparklesIcon className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Pet Care Assistant</h1>
          <p className="text-gray-600">Get expert advice for your pet's health and wellbeing</p>
        </div>
      </div>
      {}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-6 p-4 bg-gray-50 rounded-lg">
          {messages.map((message) => (
            <Message
              key={message.id}
              message={message}
              isUser={message.isUser}
            />
          ))}
          {askAIMutation.isPending && (
            <div className="flex justify-start">
              <div className="max-w-3xl flex space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <SparklesIcon className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="px-4 py-3 rounded-lg bg-gray-100">
                  <div className="flex items-center space-x-2">
                    <LoadingSpinner size="sm" />
                    <span className="text-gray-600">Thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        {}
        {messages.length === 1 && (
          <div className="mt-6">
            <SuggestedQuestions onQuestionClick={handleSuggestedQuestion} />
          </div>
        )}
        {}
        <div className="mt-6">
          <form onSubmit={handleSendMessage} className="flex space-x-3">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask me anything about pet care..."
              className="input flex-1"
              disabled={askAIMutation.isPending}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || askAIMutation.isPending}
              className="btn btn-primary"
            >
              {askAIMutation.isPending ? (
                <LoadingSpinner size="sm" />
              ) : (
                <PaperAirplaneIcon className="h-4 w-4" />
              )}
            </button>
          </form>
          <div className="mt-2 text-xs text-gray-500 text-center">
            AI responses are for informational purposes only. Always consult with a veterinarian for medical concerns.
          </div>
        </div>
      </div>
      {}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <HeartIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <h3 className="font-medium text-blue-900">Health Advice</h3>
          <p className="text-sm text-blue-700">Get guidance on pet health and symptoms</p>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <SparklesIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <h3 className="font-medium text-green-900">Behavior Tips</h3>
          <p className="text-sm text-green-700">Learn about pet behavior and training</p>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <LightBulbIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
          <h3 className="font-medium text-purple-900">Care Guidelines</h3>
          <p className="text-sm text-purple-700">Discover best practices for pet care</p>
        </div>
      </div>
    </div>
  )
}
import { createContext, useContext, useReducer, useEffect } from 'react'
import { authAPI } from '../services/api'
import toast from 'react-hot-toast'
const AuthContext = createContext()
const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_USER':
      return { ...state, user: action.payload, loading: false }
    case 'SET_TOKEN':
      return { ...state, token: action.payload }
    case 'LOGOUT':
      return { ...state, user: null, token: null, loading: false }
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false }
    default:
      return state
  }
}
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  loading: true,
  error: null
}
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          const response = await authAPI.getMe()
          const userData = response.data.data
          console.log('AuthContext - User data from API:', userData)
          console.log('AuthContext - emailVerified:', userData.emailVerified)
          console.log('AuthContext - isEmailVerified:', userData.isEmailVerified)
          dispatch({ type: 'SET_USER', payload: userData })
        } catch (error) {
          console.log('Auth initialization failed:', error.response?.status)
          localStorage.removeItem('token')
          dispatch({ type: 'LOGOUT' })
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    }
    initAuth()
  }, [])
  const login = async (email, password) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      const response = await authAPI.login({ email, password })
      const { user, accessToken } = response.data.data
      localStorage.setItem('token', accessToken)
      dispatch({ type: 'SET_TOKEN', payload: accessToken })
      dispatch({ type: 'SET_USER', payload: user })
      toast.success(`Welcome back, ${user.name}!`)
      return { success: true, user }
    } catch (error) {
      const message = error.response?.data?.error || 'Login failed'
      dispatch({ type: 'SET_ERROR', payload: message })
      toast.error(message)
      return { success: false, error: message }
    }
  }
  const register = async (userData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      const response = await authAPI.register(userData)
      const { user, accessToken } = response.data.data
      localStorage.setItem('token', accessToken)
      dispatch({ type: 'SET_TOKEN', payload: accessToken })
      dispatch({ type: 'SET_USER', payload: user })
      toast.success('Registration successful! Please check your email to verify your account.')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.error || 'Registration failed'
      dispatch({ type: 'SET_ERROR', payload: message })
      toast.error(message)
      return { success: false, error: message }
    }
  }
  const logout = () => {
    localStorage.removeItem('token')
    sessionStorage.clear()
    dispatch({ type: 'LOGOUT' })
    if (window.queryClient) {
      window.queryClient.clear()
    }
    toast.success('Logged out successfully')
  }
  const forgotPassword = async (email) => {
    try {
      await authAPI.forgotPassword({ email })
      toast.success('Password reset link sent to your email')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to send reset email'
      toast.error(message)
      return { success: false, error: message }
    }
  }
  const resetPassword = async (token, password) => {
    try {
      const response = await authAPI.resetPassword(token, { password })
      const { accessToken } = response.data.data
      localStorage.setItem('token', accessToken)
      dispatch({ type: 'SET_TOKEN', payload: accessToken })
      toast.success('Password reset successful')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.error || 'Password reset failed'
      toast.error(message)
      return { success: false, error: message }
    }
  }
  const verifyEmail = async (token) => {
    try {
      await authAPI.verifyEmail(token)
      const userData = await authAPI.getMe()
      const updatedUser = userData.data.data
      dispatch({ type: 'SET_USER', payload: updatedUser })
      const currentToken = localStorage.getItem('token')
      if (currentToken) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('userUpdated'))
          window.dispatchEvent(new CustomEvent('forceUserRefresh'))
        }, 100)
      }
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.error || 'Email verification failed'
      return { success: false, error: message }
    }
  }
  const updateProfile = (userData) => {
    dispatch({ type: 'SET_USER', payload: userData })
  }
  const value = {
    ...state,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    verifyEmail,
    updateProfile
  }
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
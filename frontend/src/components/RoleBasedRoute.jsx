import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LoadingSpinner } from './ui/LoadingSpinner'
import toast from 'react-hot-toast'
const RoleBasedRoute = ({ children, allowedRoles = [], requireAuth = true, fallbackPath = '/' }) => {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }
  if (requireAuth && !user) {
    toast.error('Please login to access this page')
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  if (allowedRoles.length > 0 && user) {
    if (!allowedRoles.includes(user.role)) {
      toast.error('Access denied. You do not have permission to view this page.')
      switch (user.role) {
        case 'admin':
          return <Navigate to="/admin" replace />
        case 'vet':
          return <Navigate to="/dashboard" replace />
        case 'shelter':
          return <Navigate to="/dashboard" replace />
        case 'owner':
        default:
          return <Navigate to="/dashboard" replace />
      }
    }
  }
  if (user && !user.isActive) {
    toast.error('Your account has been deactivated. Please contact support.')
    return <Navigate to="/login" replace />
  }
  if (user && user.role === 'owner' && !user.isEmailVerified) {
    const sensitiveRoutes = ['/pets/add', '/appointments/book', '/checkout']
    if (sensitiveRoutes.some(route => location.pathname.startsWith(route))) {
      toast.error('Please verify your email to access this feature')
      return <Navigate to="/profile" replace />
    }
  }
  if (user && user.role === 'vet' && !user.isVetVerified) {
    const vetRoutes = ['/appointments', '/health-records']
    if (vetRoutes.some(route => location.pathname.startsWith(route))) {
      toast.error('Your veterinarian account must be verified to access this feature')
      return <Navigate to="/dashboard" replace />
    }
  }
  return children
}
export default RoleBasedRoute
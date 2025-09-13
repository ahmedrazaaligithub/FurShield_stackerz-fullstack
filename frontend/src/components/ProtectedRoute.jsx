import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LoadingSpinner } from './ui/LoadingSpinner'
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }
  if (!user) {
    if (requiredRole === 'admin') {
      return <Navigate to="/admin/login" replace />
    }
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  if (requiredRole && user.role !== requiredRole) {
    if (requiredRole === 'admin') {
      return <Navigate to="/admin/login" replace />
    }
    return <Navigate to="/" replace />
  }
  return children
}
export default ProtectedRoute
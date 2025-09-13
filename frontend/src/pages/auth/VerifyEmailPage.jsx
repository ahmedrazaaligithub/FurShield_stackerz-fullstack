import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
export default function VerifyEmailPage() {
  const [status, setStatus] = useState('loading') 
  const [message, setMessage] = useState('')
  const { token } = useParams()
  const { verifyEmail } = useAuth()
  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus('error')
        setMessage('Invalid verification link')
        return
      }
      const result = await verifyEmail(token)
      if (result.success) {
        setStatus('success')
        setMessage('Your email has been verified successfully!')
      } else {
        setStatus('error')
        setMessage(result.error || 'Email verification failed')
      }
    }
    verify()
  }, [token, verifyEmail])
  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center">
            <div className="h-12 w-12 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-2xl">🐾</span>
            </div>
            <span className="ml-3 text-2xl font-bold text-gray-900">PetCare</span>
          </Link>
          {status === 'loading' && (
            <>
              <div className="mt-6">
                <LoadingSpinner size="xl" className="mx-auto" />
              </div>
              <h2 className="mt-6 text-3xl font-bold text-gray-900">
                Verifying your email
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Please wait while we verify your email address...
              </p>
            </>
          )}
          {status === 'success' && (
            <>
              <div className="mx-auto mt-6 h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="mt-6 text-3xl font-bold text-gray-900">
                Email verified!
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {message}
              </p>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="mx-auto mt-6 h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
                <XCircleIcon className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="mt-6 text-3xl font-bold text-gray-900">
                Verification failed
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {message}
              </p>
            </>
          )}
        </div>
        {status !== 'loading' && (
          <div className="text-center space-y-4">
            <Link
              to="/dashboard"
              className="btn btn-primary btn-lg w-full"
            >
              Go to Dashboard
            </Link>
            <Link
              to="/login"
              className="block font-medium text-primary-600 hover:text-primary-500"
            >
              Sign in to your account
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
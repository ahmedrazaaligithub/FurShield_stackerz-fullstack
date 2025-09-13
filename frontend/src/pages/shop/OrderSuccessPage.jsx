import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CheckCircleIcon, EnvelopeIcon, TruckIcon, HomeIcon } from '@heroicons/react/24/outline'
import confetti from 'canvas-confetti'
export default function OrderSuccessPage() {
  const navigate = useNavigate()
  const { orderId } = useParams()
  useEffect(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    })
  }, [])
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-100">
            <CheckCircleIcon className="h-16 w-16 text-green-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Thank You for Your Order!
          </h2>
          <p className="mt-2 text-lg text-gray-600">
            Your order has been successfully placed
          </p>
          {orderId && (
            <p className="mt-2 text-sm text-gray-500">
              Order ID: <span className="font-mono font-semibold">{orderId}</span>
            </p>
          )}
        </div>
        <div className="bg-white shadow rounded-lg p-6 space-y-4">
          <div className="flex items-start space-x-3">
            <EnvelopeIcon className="h-6 w-6 text-blue-500 mt-1" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900">Email Confirmation</h3>
              <p className="text-sm text-gray-600 mt-1">
                We've sent a confirmation email with your order details and tracking information.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <TruckIcon className="h-6 w-6 text-blue-500 mt-1" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900">Delivery Information</h3>
              <p className="text-sm text-gray-600 mt-1">
                Your order will be delivered within 3-5 business days. You can track your order status in your account.
              </p>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <button
            onClick={() => navigate('/orders')}
            className="w-full btn btn-primary btn-lg"
          >
            View Order Details
          </button>
          <button
            onClick={() => navigate('/shop')}
            className="w-full btn btn-outline btn-lg"
          >
            Continue Shopping
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full btn btn-ghost btn-lg flex items-center justify-center"
          >
            <HomeIcon className="h-5 w-5 mr-2" />
            Back to Home
          </button>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Need help? Contact our support team at{' '}
            <a href="mailto:support@furshield.com" className="text-blue-600 hover:text-blue-500">
              support@furshield.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
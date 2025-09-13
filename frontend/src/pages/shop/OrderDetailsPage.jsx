import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { orderAPI } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import OrderStatusUpdate from '../../components/admin/OrderStatusUpdate'
import { 
  ArrowLeftIcon,
  TruckIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  CreditCardIcon,
  MapPinIcon,
  CalendarIcon,
  DocumentTextIcon,
  PrinterIcon,
  EnvelopeIcon,
  CogIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
export default function OrderDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [showStatusUpdate, setShowStatusUpdate] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const queryClient = useQueryClient()
  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderAPI.getOrder(id),
    enabled: !!id
  })
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />
      case 'confirmed':
      case 'processing':
        return <CheckCircleIcon className="h-5 w-5 text-blue-500" />
      case 'shipped':
        return <TruckIcon className="h-5 w-5 text-purple-500" />
      case 'delivered':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'cancelled':
      case 'refunded':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />
    }
  }
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'confirmed':
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'shipped':
        return 'bg-purple-100 text-purple-800'
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
      case 'refunded':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }
  const handlePrint = () => {
    window.print()
  }
  const handleEmailReceipt = () => {
    toast.success('Receipt sent to your email!')
  }
  const cancelOrderMutation = useMutation({
    mutationFn: (data) => orderAPI.cancelOrder(id, data),
    onSuccess: () => {
      toast.success('Order cancelled successfully!')
      queryClient.invalidateQueries(['order', id])
      queryClient.invalidateQueries(['orders'])
      setShowCancelModal(false)
      setCancelReason('')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to cancel order')
    }
  })
  const handleCancelOrder = () => {
    if (!cancelReason.trim()) {
      toast.error('Please provide a reason for cancellation')
      return
    }
    cancelOrderMutation.mutate({ reason: cancelReason })
  }
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }
  if (error || !order?.data?.data) {
    return (
      <div className="text-center py-12">
        <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
        <p className="text-gray-600 mb-6">The order you're looking for doesn't exist or you don't have permission to view it.</p>
        <button onClick={() => navigate('/orders')} className="btn btn-primary">
          View All Orders
        </button>
      </div>
    )
  }
  const orderData = order.data.data
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/orders')}
                className="group flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Order Details</h1>
                <div className="flex items-center space-x-3 mt-2">
                  <p className="text-gray-600 font-medium">#{orderData.orderNumber}</p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(orderData.status)}`}>
                    {getStatusIcon(orderData.status)}
                    <span className="ml-1">{orderData.status.charAt(0).toUpperCase() + orderData.status.slice(1)}</span>
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {user?.role === 'admin' && (
                <button
                  onClick={() => setShowStatusUpdate(true)}
                  className="group flex items-center px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
                >
                  <CogIcon className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform duration-200" />
                  Update Status
                </button>
              )}
              <button
                onClick={handleEmailReceipt}
                className="group flex items-center px-4 py-2.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
              >
                <EnvelopeIcon className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                Email Receipt
              </button>
              <button
                onClick={handlePrint}
                className="group flex items-center px-4 py-2.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
              >
                <PrinterIcon className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                Print
              </button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {}
          <div className="xl:col-span-2 space-y-8">
            {}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <div className="p-2 bg-white/20 rounded-lg mr-3">
                    {getStatusIcon(orderData.status)}
                  </div>
                  Order Status
                </h2>
              </div>
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold shadow-sm ${getStatusColor(orderData.status)}`}>
                        {orderData.status.charAt(0).toUpperCase() + orderData.status.slice(1)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <CalendarIcon className="h-4 w-4" />
                      <span>Placed on {new Date(orderData.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    </div>
                  </div>
                  {orderData.shipping?.trackingNumber && (
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-100">
                      <p className="text-sm font-semibold text-gray-900 mb-1">Tracking Number</p>
                      <p className="text-sm text-blue-700 font-mono bg-white px-3 py-1 rounded-lg">{orderData.shipping.trackingNumber}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <div className="p-2 bg-white/20 rounded-lg mr-3">
                    <DocumentTextIcon className="h-5 w-5 text-white" />
                  </div>
                  Order Items
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {orderData.items.map((item, index) => (
                    <div key={index} className="group flex items-center space-x-4 p-5 bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-100 rounded-2xl hover:shadow-lg transition-all duration-200 hover:border-blue-200">
                      <div className="flex-shrink-0">
                        {item.product?.images?.[0] ? (
                          <img
                            src={item.product.images[0]}
                            alt={item.name}
                            className="w-20 h-20 object-cover rounded-xl shadow-md group-hover:shadow-lg transition-shadow duration-200"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl flex items-center justify-center shadow-md">
                            <DocumentTextIcon className="h-8 w-8 text-gray-500" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <h3 className="font-semibold text-gray-900 text-lg">{item.name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="bg-white px-3 py-1 rounded-lg font-medium">Qty: {item.quantity}</span>
                          <span className="bg-white px-3 py-1 rounded-lg font-medium">${item.price}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <div className="p-2 bg-white/20 rounded-lg mr-3">
                    <MapPinIcon className="h-5 w-5 text-white" />
                  </div>
                  Shipping Address
                </h2>
              </div>
              <div className="p-6">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-5 rounded-xl border border-purple-100">
                  <div className="space-y-2 text-gray-700">
                    <p className="font-bold text-lg text-gray-900">{orderData.shippingAddress?.name}</p>
                    <p className="text-gray-600">{orderData.shippingAddress?.street}</p>
                    <p className="text-gray-600">
                      {orderData.shippingAddress?.city}, {orderData.shippingAddress?.state} {orderData.shippingAddress?.zipCode}
                    </p>
                    <p className="text-gray-600 font-medium">{orderData.shippingAddress?.country}</p>
                    {orderData.shippingAddress?.phone && (
                      <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-purple-200">
                        <span className="text-sm font-medium text-gray-900">Phone:</span>
                        <span className="text-sm text-purple-700 bg-white px-3 py-1 rounded-lg font-medium">{orderData.shippingAddress.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {}
          <div className="space-y-8">
            {}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-blue-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white">Order Summary</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 font-medium">Subtotal</span>
                  <span className="font-semibold text-gray-900">${orderData.subtotal?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 font-medium">Tax</span>
                  <span className="font-semibold text-gray-900">${orderData.tax?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 font-medium">Shipping</span>
                  <span className="font-semibold">
                    {orderData.shipping?.cost === 0 ? (
                      <span className="text-green-600 bg-green-50 px-3 py-1 rounded-lg font-bold">FREE</span>
                    ) : (
                      <span className="text-gray-900">${orderData.shipping?.cost?.toFixed(2) || '0.00'}</span>
                    )}
                  </span>
                </div>
                {orderData.discount?.amount > 0 && (
                  <div className="flex justify-between items-center py-2 text-green-600">
                    <span className="font-medium">Discount ({orderData.discount.code})</span>
                    <span className="font-semibold bg-green-50 px-3 py-1 rounded-lg">-${orderData.discount.amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t-2 border-gray-100 pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-gray-900">Total</span>
                    <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                      ${orderData.total?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <div className="p-2 bg-white/20 rounded-lg mr-3">
                    <CreditCardIcon className="h-5 w-5 text-white" />
                  </div>
                  Payment Information
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 font-medium">Payment Method</span>
                    <span className="font-semibold text-gray-900 capitalize bg-gray-50 px-3 py-1 rounded-lg">
                      {orderData.paymentMethod?.replace('-', ' ') || 'Credit Card'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 font-medium">Payment Status</span>
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-sm font-semibold shadow-sm ${
                      orderData.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                      orderData.paymentStatus === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {orderData.paymentStatus?.charAt(0).toUpperCase() + orderData.paymentStatus?.slice(1)}
                    </span>
                  </div>
                  {orderData.transactionId && (
                    <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-medium">Transaction ID</span>
                        <span className="font-mono text-sm bg-white px-3 py-1 rounded-lg text-green-700 font-semibold">{orderData.transactionId}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          {}
          {orderData.timeline && orderData.timeline.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  Order Timeline
                </h2>
              </div>
              <div className="card-content">
                <div className="space-y-4">
                  {orderData.timeline.map((event, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {getStatusIcon(event.status)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 capitalize">{event.status}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(event.timestamp).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        {event.note && (
                          <p className="text-sm text-gray-600 mt-1">{event.note}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
            {}
            <div className="space-y-4">
              {(orderData.status === 'pending' || orderData.status === 'confirmed') && (
                <button 
                  onClick={() => setShowCancelModal(true)}
                  className="group w-full flex items-center justify-center px-6 py-3 bg-white border-2 border-red-200 text-red-600 rounded-xl hover:bg-red-50 hover:border-red-300 transition-all duration-200 shadow-sm hover:shadow-md font-semibold"
                  disabled={cancelOrderMutation.isLoading}
                >
                  <XCircleIcon className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform duration-200" />
                  {cancelOrderMutation.isLoading ? 'Cancelling...' : 'Cancel Order'}
                </button>
              )}
              <button 
                onClick={() => navigate('/shop')}
                className="group w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold"
              >
                Continue Shopping
                <ArrowLeftIcon className="h-5 w-5 ml-2 rotate-180 group-hover:translate-x-1 transition-transform duration-200" />
              </button>
            </div>
          </div>
        </div>
      </div>
      {}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Cancel Order</h2>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  <strong>Warning:</strong> This action cannot be undone. Your order will be cancelled and you will receive a confirmation email.
                </p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for cancellation *
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Please provide a reason for cancelling this order..."
                  rows="4"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Keep Order
                </button>
                <button
                  onClick={handleCancelOrder}
                  disabled={cancelOrderMutation.isLoading || !cancelReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancelOrderMutation.isLoading ? 'Cancelling...' : 'Cancel Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {}
      {showStatusUpdate && (
        <OrderStatusUpdate
          order={orderData}
          onClose={() => setShowStatusUpdate(false)}
        />
      )}
    </div>
  )
}
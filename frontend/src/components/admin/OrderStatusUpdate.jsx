import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { orderAPI } from '../../services/api'
import { 
  TruckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CogIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
const statusOptions = [
  { value: 'pending', label: 'Pending', icon: ClockIcon, color: 'text-yellow-600' },
  { value: 'confirmed', label: 'Confirmed', icon: CheckCircleIcon, color: 'text-blue-600' },
  { value: 'processing', label: 'Processing', icon: CogIcon, color: 'text-blue-600' },
  { value: 'shipped', label: 'Shipped', icon: TruckIcon, color: 'text-purple-600' },
  { value: 'delivered', label: 'Delivered', icon: CheckCircleIcon, color: 'text-green-600' },
  { value: 'cancelled', label: 'Cancelled', icon: XCircleIcon, color: 'text-red-600' }
]
const paymentStatusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' }
]
export default function OrderStatusUpdate({ order, onClose }) {
  const [formData, setFormData] = useState({
    status: order.status || 'pending',
    paymentStatus: order.paymentStatus || 'pending',
    trackingNumber: order.shipping?.trackingNumber || order.trackingNumber || '',
    estimatedDelivery: order.estimatedDelivery ? new Date(order.estimatedDelivery).toISOString().split('T')[0] : '',
    note: order.notes || ''
  })
  const isCancelled = order.status === 'cancelled'
  const queryClient = useQueryClient()
  const updateOrderMutation = useMutation({
    mutationFn: (data) => orderAPI.updateOrder(order._id, data),
    onSuccess: () => {
      toast.success('Order updated successfully!')
      queryClient.invalidateQueries(['orders'])
      queryClient.invalidateQueries(['order', order._id])
      onClose()
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update order')
    }
  })
  const handleSubmit = (e) => {
    e.preventDefault()
    const updateData = {
      status: formData.status,
      paymentStatus: formData.paymentStatus,
      shipping: {
        ...order.shipping,
        trackingNumber: formData.trackingNumber
      },
      estimatedDelivery: formData.estimatedDelivery ? new Date(formData.estimatedDelivery) : null,
      timeline: [
        ...(order.timeline || []),
        {
          status: formData.status,
          timestamp: new Date(),
          note: formData.note
        }
      ]
    }
    updateOrderMutation.mutate(updateData)
  }
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Update Order Status</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <XCircleIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>
          <div className={`mb-4 p-3 rounded-lg ${isCancelled ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
            <p className="text-sm font-medium text-gray-900">Order #{order.orderNumber}</p>
            <p className="text-xs text-gray-600">Current Status: {order.status}</p>
            {order.shipping?.trackingNumber && (
              <p className="text-xs text-blue-600 mt-1">
                📦 Current Tracking: {order.shipping.trackingNumber}
              </p>
            )}
            {isCancelled && (
              <p className="text-xs text-red-600 mt-1">
                ⚠️ This order has been cancelled and cannot be processed further
              </p>
            )}
          </div>
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Status
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {statusOptions.map((option) => {
                  const IconComponent = option.icon
                  return (
                    <label
                      key={option.value}
                      className={`flex items-center p-2 sm:p-3 border rounded-lg transition-all ${
                        isCancelled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                      } ${
                        formData.status === option.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="status"
                        value={option.value}
                        checked={formData.status === option.value}
                        onChange={handleInputChange}
                        disabled={isCancelled}
                        className="sr-only"
                      />
                      <IconComponent className={`h-4 w-4 mr-2 flex-shrink-0 ${option.color}`} />
                      <span className="text-xs sm:text-sm font-medium truncate">{option.label}</span>
                    </label>
                  )
                })}
              </div>
            </div>
            {}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Status
                </label>
                <select
                  name="paymentStatus"
                  value={formData.paymentStatus}
                  onChange={handleInputChange}
                  disabled={isCancelled}
                  className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {paymentStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tracking Number
                </label>
                <input
                  type="text"
                  name="trackingNumber"
                  value={formData.trackingNumber}
                  onChange={handleInputChange}
                  placeholder={formData.trackingNumber ? "Update tracking number" : "Enter tracking number"}
                  disabled={isCancelled}
                  className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                />
              </div>
            </div>
            {}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Delivery Date
              </label>
              <input
                type="date"
                name="estimatedDelivery"
                value={formData.estimatedDelivery}
                onChange={handleInputChange}
                disabled={isCancelled}
                className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              />
            </div>
            {}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Update Note
              </label>
              <textarea
                name="note"
                value={formData.note}
                onChange={handleInputChange}
                placeholder={isCancelled ? "This order has been cancelled" : formData.note ? "Update note" : "Add a note about this status update..."}
                rows="3"
                disabled={isCancelled}
                className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm resize-none"
              />
            </div>
            {}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:flex-1 px-4 py-2 sm:py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateOrderMutation.isLoading || isCancelled}
                className="w-full sm:flex-1 px-4 py-2 sm:py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {isCancelled ? 'Order Cancelled' : updateOrderMutation.isLoading ? 'Updating...' : 'Update Order'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
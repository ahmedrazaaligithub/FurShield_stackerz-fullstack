import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { orderAPI } from '../../services/api'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import OrderStatusUpdate from '../../components/admin/OrderStatusUpdate'
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  TruckIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  CogIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  CreditCardIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline'
import { cn } from '../../utils/cn'
import toast from 'react-hot-toast'
export default function AdminOrdersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showStatusUpdate, setShowStatusUpdate] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const queryClient = useQueryClient()
  const { data: ordersData, isLoading, error } = useQuery({
    queryKey: ['admin-orders', { 
      page: currentPage, 
      status: statusFilter, 
      payment: paymentFilter,
      search: searchTerm 
    }],
    queryFn: () => orderAPI.getOrders({
      page: currentPage,
      limit: 20,
      status: statusFilter || undefined,
      paymentStatus: paymentFilter || undefined,
      search: searchTerm || undefined
    }),
    refetchOnWindowFocus: false,
    staleTime: 30000
  })
  const orders = ordersData?.data?.data || []
  const pagination = ordersData?.data?.pagination || {}
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-4 w-4 text-yellow-500" />
      case 'confirmed':
      case 'processing':
        return <CogIcon className="h-4 w-4 text-blue-500" />
      case 'shipped':
        return <TruckIcon className="h-4 w-4 text-purple-500" />
      case 'delivered':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />
      case 'cancelled':
        return <XCircleIcon className="h-4 w-4 text-red-500" />
      default:
        return <ClockIcon className="h-4 w-4 text-gray-500" />
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
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }
  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'refunded':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }
  const handleOrderClick = (order) => {
    setSelectedOrder(order)
  }
  const handleStatusUpdate = (order) => {
    setSelectedOrder(order)
    setShowStatusUpdate(true)
  }
  const handleSearch = (e) => {
    e.preventDefault()
  }
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }
  if (error) {
    return (
      <div className="text-center py-12">
        <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Orders</h2>
        <p className="text-gray-600">Failed to load orders. Please try again.</p>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      {}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders Management</h1>
          <p className="text-gray-600 mt-1">Manage all customer orders and track deliveries</p>
        </div>
        <div className="text-sm text-gray-500">
          Total Orders: {pagination.total || 0}
        </div>
      </div>
      {}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {}
          <form onSubmit={handleSearch} className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders, customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </form>
          {}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          {}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Payments</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
          {}
          <button
            onClick={() => {
              setSearchTerm('')
              setStatusFilter('')
              setPaymentFilter('')
            }}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>
      {}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      #{order.orderNumber || order._id.slice(-8)}
                    </div>
                    {order.shipping?.trackingNumber && (
                      <div className="text-xs text-blue-600 font-mono">
                        Track: {order.shipping.trackingNumber}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        {order.user?.avatar ? (
                          <img
                            className="h-8 w-8 rounded-full"
                            src={order.user.avatar}
                            alt={order.user.name}
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <UserIcon className="h-4 w-4 text-gray-500" />
                          </div>
                        )}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {order.user?.name || 'Unknown User'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.user?.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {order.items?.length || 0} items
                    </div>
                    <div className="text-xs text-gray-500">
                      {order.items?.slice(0, 2).map(item => item.name || item.product?.name).join(', ')}
                      {order.items?.length > 2 && '...'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      ${order.total?.toFixed(2) || '0.00'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(order.status)}
                      <span className={cn(
                        'ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                        getStatusColor(order.status)
                      )}>
                        {order.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={cn(
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      getPaymentStatusColor(order.paymentStatus)
                    )}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleOrderClick(order)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded"
                        title="View Details"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(order)}
                        className="text-green-600 hover:text-green-900 p-1 rounded"
                        title="Update Status"
                      >
                        <CogIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {orders.length === 0 && (
          <div className="text-center py-12">
            <ShoppingBagIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-500">No orders match your current filters.</p>
          </div>
        )}
      </div>
      {}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between bg-white px-6 py-3 border border-gray-200 rounded-lg">
          <div className="text-sm text-gray-700">
            Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, pagination.total)} of {pagination.total} results
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm bg-primary-50 text-primary-700 border border-primary-200 rounded">
              {currentPage}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.pages))}
              disabled={currentPage === pagination.pages}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
      {}
      {selectedOrder && !showStatusUpdate && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={() => setShowStatusUpdate(true)}
        />
      )}
      {}
      {showStatusUpdate && selectedOrder && (
        <OrderStatusUpdate
          order={selectedOrder}
          onClose={() => {
            setShowStatusUpdate(false)
            setSelectedOrder(null)
          }}
        />
      )}
    </div>
  )
}
function OrderDetailsModal({ order, onClose, onUpdateStatus }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {}
        <div className="flex-shrink-0 px-4 sm:px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                Order #{order.orderNumber}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div className="flex items-center space-x-2 ml-4">
              {order.status !== 'cancelled' && (
                <button
                  onClick={() => onUpdateStatus(order)}
                  className="px-3 sm:px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                >
                  <CogIcon className="h-4 w-4 mr-1 sm:mr-2 inline" />
                  <span className="hidden sm:inline">Update Status</span>
                  <span className="sm:hidden">Update</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <XCircleIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>
          </div>
        </div>
        {}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
              {}
              <div className="xl:col-span-1 space-y-4 sm:space-y-6">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 sm:p-5 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <UserIcon className="h-5 w-5 mr-2 text-blue-600" />
                    Customer Information
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      {order.user?.avatar ? (
                        <img
                          className="h-12 w-12 rounded-full border-2 border-white shadow-sm"
                          src={order.user.avatar}
                          alt={order.user.name}
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center border-2 border-white shadow-sm">
                          <UserIcon className="h-6 w-6 text-blue-600" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 truncate">{order.user?.name}</p>
                        <p className="text-sm text-gray-600 truncate">{order.user?.email}</p>
                      </div>
                    </div>
                    {order.shippingAddress && (
                      <div className="mt-4 p-3 bg-white rounded-lg border border-gray-100">
                        <h4 className="font-medium text-gray-900 mb-2 flex items-center text-sm">
                          <MapPinIcon className="h-4 w-4 mr-1 text-green-600" />
                          Shipping Address
                        </h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p className="font-medium">{order.shippingAddress.name}</p>
                          <p>{order.shippingAddress.street}</p>
                          <p>
                            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                          </p>
                          <p>{order.shippingAddress.country}</p>
                          {order.shippingAddress.phone && (
                            <p className="flex items-center text-blue-600">
                              <PhoneIcon className="h-3 w-3 mr-1" />
                              {order.shippingAddress.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 sm:p-5 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <ClockIcon className="h-5 w-5 mr-2 text-purple-600" />
                    Order Status
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                      <span className="text-gray-600 font-medium">Status</span>
                      <div className="flex items-center">
                        {order.status === 'pending' && <ClockIcon className="h-4 w-4 text-yellow-500 mr-2" />}
                        {order.status === 'processing' && <CogIcon className="h-4 w-4 text-blue-500 mr-2" />}
                        {order.status === 'shipped' && <TruckIcon className="h-4 w-4 text-purple-500 mr-2" />}
                        {order.status === 'delivered' && <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />}
                        {order.status === 'cancelled' && <XCircleIcon className="h-4 w-4 text-red-500 mr-2" />}
                        <span className="font-semibold capitalize text-gray-900">{order.status}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                      <span className="text-gray-600 font-medium">Payment</span>
                      <span className={cn(
                        'px-3 py-1 rounded-full text-xs font-semibold',
                        order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                        order.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.paymentStatus === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      )}>
                        {order.paymentStatus}
                      </span>
                    </div>
                    {order.shipping?.trackingNumber && (
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                        <span className="text-gray-600 font-medium">Tracking</span>
                        <span className="font-mono text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          {order.shipping.trackingNumber}
                        </span>
                      </div>
                    )}
                    {order.estimatedDelivery && (
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                        <span className="text-gray-600 font-medium">Est. Delivery</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {new Date(order.estimatedDelivery).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {}
              <div className="xl:col-span-2 space-y-4 sm:space-y-6">
                {}
                <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <ShoppingBagIcon className="h-5 w-5 mr-2 text-indigo-600" />
                    Order Items
                  </h3>
                  <div className="space-y-3">
                    {order.items?.map((item, index) => (
                      <div key={index} className="flex items-center space-x-3 sm:space-x-4 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-100">
                        {item.product?.images?.[0] ? (
                          <img
                            src={item.product.images[0]}
                            alt={item.name}
                            className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg border-2 border-white shadow-sm flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center border-2 border-white shadow-sm flex-shrink-0">
                            <ShoppingBagIcon className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 truncate text-sm sm:text-base">
                            {item.name || item.product?.name}
                          </h4>
                          <p className="text-xs sm:text-sm text-gray-600">
                            Quantity: {item.quantity} × ${item.price}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-gray-900 text-sm sm:text-base">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 sm:p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <CreditCardIcon className="h-5 w-5 mr-2 text-green-600" />
                    Order Summary
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                      <span className="text-gray-600 font-medium">Subtotal</span>
                      <span className="font-semibold text-gray-900">${order.subtotal?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                      <span className="text-gray-600 font-medium">Tax</span>
                      <span className="font-semibold text-gray-900">${order.tax?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                      <span className="text-gray-600 font-medium">Shipping</span>
                      <span className="font-semibold text-gray-900">
                        {order.shipping?.cost === 0 ? 'FREE' : `$${order.shipping?.cost?.toFixed(2) || '0.00'}`}
                      </span>
                    </div>
                    <div className="border-t border-blue-200 pt-3">
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg border-2 border-blue-300">
                        <span className="text-lg font-bold text-gray-900">Total</span>
                        <span className="text-xl font-bold text-blue-600">${order.total?.toFixed(2) || '0.00'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
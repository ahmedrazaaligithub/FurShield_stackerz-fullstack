import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { orderAPI } from '../../services/api'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { 
  ShoppingBagIcon,
  CalendarIcon,
  UserIcon,
  CurrencyDollarIcon,
  TruckIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { cn } from '../../utils/cn'
import toast from 'react-hot-toast'
const OrderCard = ({ order, onStatusUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'shipped': return 'bg-purple-100 text-purple-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return CalendarIcon
      case 'processing': return TruckIcon
      case 'shipped': return TruckIcon
      case 'delivered': return CheckCircleIcon
      case 'cancelled': return XCircleIcon
      default: return ShoppingBagIcon
    }
  }
  const StatusIcon = getStatusIcon(order.status)
  return (
    <div className="card">
      <div className="card-content">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <StatusIcon className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Order #{order._id?.slice(-8)}</h3>
              <p className="text-sm text-gray-600">{order.user?.name || 'Anonymous'}</p>
              <p className="text-xs text-gray-500">{order.user?.email}</p>
            </div>
          </div>
          <span className={cn('badge text-xs', getStatusColor(order.status))}>
            {order.status}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Order Date</label>
            <p className="text-sm text-gray-900">
              {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Amount</label>
            <p className="text-sm font-semibold text-gray-900">
              ${order.totalAmount?.toFixed(2) || '0.00'}
            </p>
          </div>
        </div>
        <div className="mb-4">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">
            Items ({order.items?.length || 0})
          </label>
          <div className="space-y-2">
            {(order.items || []).slice(0, isExpanded ? undefined : 2).map((item, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center space-x-2">
                  <img
                    src={item.product?.images?.[0] || '/placeholder-product.jpg'}
                    alt={item.product?.name}
                    className="w-8 h-8 object-cover rounded"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.product?.name}</p>
                    <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
            {order.items?.length > 2 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-primary-600 text-sm hover:text-primary-700"
              >
                {isExpanded ? 'Show less' : `Show ${order.items.length - 2} more items`}
              </button>
            )}
          </div>
        </div>
        {order.shippingAddress && (
          <div className="mb-4">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">
              Shipping Address
            </label>
            <p className="text-sm text-gray-700">
              {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
            </p>
          </div>
        )}
        <div className="flex space-x-2">
          {order.status === 'pending' && (
            <>
              <button
                onClick={() => onStatusUpdate(order._id, 'processing')}
                className="btn btn-primary btn-sm flex-1"
              >
                <TruckIcon className="h-4 w-4 mr-1" />
                Start Processing
              </button>
              <button
                onClick={() => onStatusUpdate(order._id, 'cancelled')}
                className="btn btn-danger btn-sm"
              >
                Cancel
              </button>
            </>
          )}
          {order.status === 'processing' && (
            <button
              onClick={() => onStatusUpdate(order._id, 'shipped')}
              className="btn btn-success btn-sm flex-1"
            >
              <TruckIcon className="h-4 w-4 mr-1" />
              Mark as Shipped
            </button>
          )}
          {order.status === 'shipped' && (
            <button
              onClick={() => onStatusUpdate(order._id, 'delivered')}
              className="btn btn-success btn-sm flex-1"
            >
              <CheckCircleIcon className="h-4 w-4 mr-1" />
              Mark as Delivered
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
export default function ShelterOrdersPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('all')
  const { data: orders, isLoading, error } = useQuery({
    queryKey: ['shelter-orders', user?.id, statusFilter],
    queryFn: () => orderAPI.getOrders({ 
      sellerId: user?.id,
      status: statusFilter !== 'all' ? statusFilter : undefined
    }),
    enabled: !!user?.id && user?.role === 'shelter'
  })
  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }) => 
      orderAPI.updateOrderStatus(orderId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['shelter-orders'])
      toast.success('Order status updated successfully')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update order status')
    }
  })
  const handleStatusUpdate = (orderId, status) => {
    updateStatusMutation.mutate({ orderId, status })
  }
  const ordersData = orders?.data?.data || []
  const stats = {
    total: ordersData.length,
    pending: ordersData.filter(o => o.status === 'pending').length,
    processing: ordersData.filter(o => o.status === 'processing').length,
    shipped: ordersData.filter(o => o.status === 'shipped').length,
    delivered: ordersData.filter(o => o.status === 'delivered').length,
    cancelled: ordersData.filter(o => o.status === 'cancelled').length
  }
  const totalRevenue = ordersData
    .filter(o => o.status === 'delivered')
    .reduce((sum, order) => sum + (order.totalAmount || 0), 0)
  if (user?.role !== 'shelter') {
    return (
      <div className="text-center py-12">
        <ShoppingBagIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Shelter Access Only</h2>
        <p className="text-gray-600">This page is only available for shelter representatives.</p>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      {}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Customer Orders</h1>
        <p className="text-gray-600 mt-1">
          Manage and fulfill customer orders for your products
        </p>
      </div>
      {}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="card p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Orders</div>
          </div>
        </div>
        <div className="card p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
        </div>
        <div className="card p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.processing}</div>
            <div className="text-sm text-gray-600">Processing</div>
          </div>
        </div>
        <div className="card p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.shipped}</div>
            <div className="text-sm text-gray-600">Shipped</div>
          </div>
        </div>
        <div className="card p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
            <div className="text-sm text-gray-600">Delivered</div>
          </div>
        </div>
        <div className="card p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-700">${totalRevenue.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Revenue</div>
          </div>
        </div>
      </div>
      {}
      <div className="card p-4">
        <div className="flex flex-wrap gap-2">
          {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                'btn btn-sm',
                statusFilter === status ? 'btn-primary' : 'btn-outline'
              )}
            >
              {status === 'all' ? 'All Orders' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>
      {}
      {isLoading ? (
        <div className="flex justify-center items-center min-h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <ShoppingBagIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">Failed to load orders</p>
          <p className="text-gray-600">Please try again later</p>
        </div>
      ) : ordersData.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingBagIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {statusFilter === 'all' ? 'No orders yet' : `No ${statusFilter} orders`}
          </h3>
          <p className="text-gray-600 mb-6">
            {statusFilter === 'all' 
              ? 'When customers place orders for your products, they will appear here.'
              : `No orders with ${statusFilter} status found.`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {ordersData.map((order) => (
            <OrderCard
              key={order._id}
              order={order}
              onStatusUpdate={handleStatusUpdate}
            />
          ))}
        </div>
      )}
    </div>
  )
}
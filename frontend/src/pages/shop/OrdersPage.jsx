import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { orderAPI } from '../../services/api'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { 
  ShoppingBagIcon,
  TruckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { cn } from '../../utils/cn'
const OrderCard = ({ order }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />
      case 'processing':
        return <ClockIcon className="h-5 w-5 text-blue-500" />
      case 'shipped':
        return <TruckIcon className="h-5 w-5 text-purple-500" />
      case 'delivered':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'cancelled':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />
    }
  }
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'badge-warning'
      case 'processing':
        return 'badge-primary'
      case 'shipped':
        return 'badge-secondary'
      case 'delivered':
        return 'badge-success'
      case 'cancelled':
        return 'badge-error'
      default:
        return 'badge-secondary'
    }
  }
  return (
    <Link to={`/orders/${order._id}`} className="block">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-primary-300 transition-all duration-300 group overflow-hidden">
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                  #{order.orderNumber || order._id.slice(-8)}
                </h3>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(order.status)}
                  <span className={cn('px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide', getStatusColor(order.status))}>
                    {order.status}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                Placed {new Date(order.createdAt).toLocaleDateString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">${order.total?.toFixed(2) || '0.00'}</p>
              <p className="text-sm text-gray-500">{order.items?.length || 0} items</p>
            </div>
          </div>
          {}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
              <span>Order Progress</span>
              <span>{order.status === 'delivered' ? '100%' : order.status === 'shipped' ? '75%' : order.status === 'processing' ? '50%' : '25%'}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  order.status === 'delivered' ? 'bg-green-500 w-full' :
                  order.status === 'shipped' ? 'bg-purple-500 w-3/4' :
                  order.status === 'processing' ? 'bg-blue-500 w-1/2' :
                  'bg-yellow-500 w-1/4'
                }`}
              ></div>
            </div>
          </div>
          {}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Payment</p>
              <p className="text-sm font-medium text-gray-900 mt-1">
                {order.paymentStatus === 'paid' ? '✅ Paid' : 
                 order.paymentStatus === 'failed' ? '❌ Failed' : 
                 '⏳ Pending'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Shipping</p>
              <p className="text-sm font-medium text-gray-900 mt-1">
                {order.shipping?.method === 'express' ? '🚀 Express' : '📦 Standard'}
              </p>
            </div>
          </div>
          {order.shipping?.trackingNumber && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">Tracking Number</span>
                <span className="text-sm font-mono text-blue-700">{order.shipping.trackingNumber}</span>
              </div>
            </div>
          )}
          {order.estimatedDelivery && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-900">Estimated Delivery</span>
                <span className="text-sm text-green-700">
                  {new Date(order.estimatedDelivery).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>
          )}
          {}
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Order Items</h4>
            <div className="space-y-2">
              {order.items?.slice(0, 2).map((item, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  {item.product?.images?.[0] ? (
                    <img
                      src={item.product.images[0]}
                      alt={item.name || item.product?.name}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 bg-gray-200 rounded-lg flex items-center justify-center">
                      <ShoppingBagIcon className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.name || item.product?.name || 'Product'}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                      <p className="text-sm font-semibold text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
              {order.items?.length > 2 && (
                <div className="text-center py-2">
                  <p className="text-sm text-gray-500">
                    +{order.items.length - 2} more item{order.items.length - 2 !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const { data: orders, isLoading, error } = useQuery({
    queryKey: ['orders', { status: statusFilter }],
    queryFn: () => orderAPI.getOrders({
      status: statusFilter || undefined
    })
  })
  const filteredOrders = orders?.data?.data || []
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-600 mt-1">
            Track and manage your orders
          </p>
        </div>
        <Link to="/shop" className="btn btn-primary">
          <ShoppingBagIcon className="h-4 w-4 mr-2" />
          Continue Shopping
        </Link>
      </div>
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
          >
            <option value="">All Orders</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center min-h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <ShoppingBagIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">Failed to load orders</p>
          <p className="text-gray-600">Please try again later</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingBagIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {statusFilter ? 'No orders found' : 'No orders yet'}
          </h3>
          <p className="text-gray-600 mb-6">
            {statusFilter 
              ? 'Try adjusting your filters'
              : 'Start shopping to see your orders here'
            }
          </p>
          <Link to="/shop" className="btn btn-primary">
            <ShoppingBagIcon className="h-4 w-4 mr-2" />
            Start Shopping
          </Link>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-gray-600">
              {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredOrders.map((order) => (
              <OrderCard key={order._id} order={order} />
            ))}
          </div>
        </>
      )}
      {filteredOrders.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status Guide</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <ClockIcon className="h-4 w-4 text-yellow-500" />
              <span>Pending - Order received</span>
            </div>
            <div className="flex items-center space-x-2">
              <ClockIcon className="h-4 w-4 text-blue-500" />
              <span>Processing - Being prepared</span>
            </div>
            <div className="flex items-center space-x-2">
              <TruckIcon className="h-4 w-4 text-purple-500" />
              <span>Shipped - On the way</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="h-4 w-4 text-green-500" />
              <span>Delivered - Completed</span>
            </div>
            <div className="flex items-center space-x-2">
              <XCircleIcon className="h-4 w-4 text-red-500" />
              <span>Cancelled - Order cancelled</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
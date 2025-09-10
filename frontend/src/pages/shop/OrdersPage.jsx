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
      <div className="card hover:shadow-glow transition-all duration-300 group">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                Order #{order.orderNumber || order._id.slice(-8)}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Placed on {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon(order.status)}
              <span className={cn('badge', getStatusColor(order.status))}>
                {order.status}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Amount</span>
              <span className="text-lg font-bold text-gray-900">${order.totalAmount}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Items</span>
              <span className="text-sm text-gray-900">
                {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
              </span>
            </div>

            {order.trackingNumber && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Tracking</span>
                <span className="text-sm font-mono text-primary-600">{order.trackingNumber}</span>
              </div>
            )}

            {order.estimatedDelivery && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Estimated Delivery</span>
                <span className="text-sm text-gray-900">
                  {new Date(order.estimatedDelivery).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {order.items?.slice(0, 3).map((item, index) => (
            <div key={index} className="flex items-center space-x-3 mt-4 p-2 bg-gray-50 rounded">
              {item.product?.images?.[0] ? (
                <img
                  src={item.product.images[0]}
                  alt={item.product.name}
                  className="h-10 w-10 rounded object-cover"
                />
              ) : (
                <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center">
                  <ShoppingBagIcon className="h-4 w-4 text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {item.product?.name || 'Product'}
                </p>
                <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
              </div>
            </div>
          ))}

          {order.items?.length > 3 && (
            <p className="text-sm text-gray-500 mt-2">
              +{order.items.length - 3} more item{order.items.length - 3 !== 1 ? 's' : ''}
            </p>
          )}
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

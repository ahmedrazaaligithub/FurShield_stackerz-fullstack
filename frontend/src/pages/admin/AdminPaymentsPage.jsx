import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminAPI } from '../../services/api'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { 
  CreditCardIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline'
import { cn } from '../../utils/cn'
import toast from 'react-hot-toast'
const PaymentRow = ({ payment, onUpdateStatus }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />
    }
  }
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return 'badge-success'
      case 'pending':
        return 'badge-warning'
      case 'failed':
        return 'badge-error'
      default:
        return 'badge-secondary'
    }
  }
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">#{payment._id?.slice(-8) || 'N/A'}</div>
        <div className="text-sm text-gray-500">{payment.paymentMethod || 'Card'}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{payment.user?.name}</div>
        <div className="text-sm text-gray-500">{payment.user?.email}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">${payment.total || payment.amount}</div>
        <div className="text-sm text-gray-500">Order</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          {getStatusIcon(payment.paymentStatus || payment.status)}
          <span className={cn('badge ml-2', getStatusColor(payment.paymentStatus || payment.status))}>
            {payment.paymentStatus || payment.status}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {new Date(payment.createdAt).toLocaleDateString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        {(payment.paymentStatus === 'pending' || payment.status === 'pending') && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onUpdateStatus(payment._id, 'paid')}
              className="text-green-600 hover:text-green-900"
            >
              Approve
            </button>
            <button
              onClick={() => onUpdateStatus(payment._id, 'failed')}
              className="text-red-600 hover:text-red-900"
            >
              Decline
            </button>
          </div>
        )}
      </td>
    </tr>
  )
}
export default function AdminPaymentsPage() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const { data: payments, isLoading } = useQuery({
    queryKey: ['admin-payments', { search: searchQuery, status: statusFilter, type: typeFilter }],
    queryFn: () => adminAPI.getPayments({
      search: searchQuery || undefined,
      status: statusFilter || undefined,
      type: typeFilter || undefined
    })
  })
  const { data: paymentStats } = useQuery({
    queryKey: ['admin-payment-stats'],
    queryFn: adminAPI.getPaymentStats
  })
  const updatePaymentMutation = useMutation({
    mutationFn: ({ id, status }) => adminAPI.updatePaymentStatus(id, status),
    onSuccess: () => {
      toast.success('Payment status updated')
      queryClient.invalidateQueries(['admin-payments'])
      queryClient.invalidateQueries(['admin-payment-stats'])
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update payment')
    }
  })
  const handleUpdateStatus = (id, status) => {
    updatePaymentMutation.mutate({ id, status })
  }
  const paymentList = payments?.data?.data || []
  const stats = paymentStats?.data?.data || {}
  return (
    <div className="space-y-6">
      {}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Payment Management</h1>
        <p className="text-gray-600 mt-1">Monitor and manage platform payments</p>
      </div>
      {}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${stats.totalRevenue || 0}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <BanknotesIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Pending Payments</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingCount || 0}</p>
              </div>
              <div className="p-3 rounded-full bg-yellow-100">
                <ClockIcon className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Completed Today</p>
                <p className="text-2xl font-bold text-gray-900">{stats.todayCount || 0}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <CheckCircleIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Failed Payments</p>
                <p className="text-2xl font-bold text-gray-900">{stats.failedCount || 0}</p>
              </div>
              <div className="p-3 rounded-full bg-red-100">
                <XCircleIcon className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
      {}
      <div className="card p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search payments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input lg:w-48"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input lg:w-48"
          >
            <option value="">All Types</option>
            <option value="appointment">Appointment</option>
            <option value="product">Product</option>
            <option value="adoption">Adoption Fee</option>
            <option value="subscription">Subscription</option>
          </select>
        </div>
      </div>
      {}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Recent Payments</h2>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <FunnelIcon className="h-4 w-4" />
              <span>{paymentList.length} payments</span>
            </div>
          </div>
        </div>
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : paymentList.length === 0 ? (
          <div className="text-center py-12">
            <CreditCardIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No payments found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
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
                {paymentList.map((payment) => (
                  <PaymentRow
                    key={payment._id}
                    payment={payment}
                    onUpdateStatus={handleUpdateStatus}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
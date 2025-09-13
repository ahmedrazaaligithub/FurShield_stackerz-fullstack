import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { 
  DocumentTextIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  UserIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { cn } from '../../utils/cn'
export default function AdminAuditLogsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20
  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ['audit-logs', searchTerm, actionFilter, dateFilter, currentPage],
    queryFn: () => Promise.resolve({
      data: {
        data: [
          {
            _id: '1',
            action: 'ORDER_CREATED',
            userId: '64f1234567890abcdef12345',
            userName: 'John Doe',
            userEmail: 'john@example.com',
            details: {
              orderId: 'ORD-2024-001',
              amount: 89.99,
              items: 3
            },
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            timestamp: new Date().toISOString(),
            status: 'success'
          },
          {
            _id: '2',
            action: 'ORDER_CANCELLED',
            userId: '64f1234567890abcdef12346',
            userName: 'Jane Smith',
            userEmail: 'jane@example.com',
            details: {
              orderId: 'ORD-2024-002',
              reason: 'Customer request',
              refundAmount: 45.50
            },
            ipAddress: '192.168.1.101',
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            status: 'success'
          },
          {
            _id: '3',
            action: 'USER_LOGIN',
            userId: '64f1234567890abcdef12347',
            userName: 'Admin User',
            userEmail: 'admin@furshield.com',
            details: {
              loginMethod: 'email',
              location: 'San Francisco, CA'
            },
            ipAddress: '192.168.1.102',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            status: 'success'
          },
          {
            _id: '4',
            action: 'PAYMENT_FAILED',
            userId: '64f1234567890abcdef12348',
            userName: 'Bob Wilson',
            userEmail: 'bob@example.com',
            details: {
              orderId: 'ORD-2024-003',
              amount: 129.99,
              errorCode: 'CARD_DECLINED',
              paymentMethod: 'Credit Card'
            },
            ipAddress: '192.168.1.103',
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
            timestamp: new Date(Date.now() - 10800000).toISOString(),
            status: 'error'
          },
          {
            _id: '5',
            action: 'PRODUCT_UPDATED',
            userId: 'admin',
            userName: 'System Administrator',
            userEmail: 'admin@furshield.com',
            details: {
              productId: 'PROD-001',
              productName: 'Premium Dog Food',
              changes: ['price', 'stock'],
              oldPrice: 49.99,
              newPrice: 54.99
            },
            ipAddress: '192.168.1.1',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            timestamp: new Date(Date.now() - 14400000).toISOString(),
            status: 'success'
          }
        ],
        totalPages: 5,
        currentPage: 1,
        totalItems: 95
      }
    })
  })
  const getActionIcon = (action, status) => {
    if (status === 'error') {
      return <XCircleIcon className="h-5 w-5 text-red-500" />
    }
    switch (action) {
      case 'ORDER_CREATED':
      case 'ORDER_UPDATED':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'ORDER_CANCELLED':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      case 'PAYMENT_FAILED':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
      case 'USER_LOGIN':
        return <UserIcon className="h-5 w-5 text-blue-500" />
      default:
        return <InformationCircleIcon className="h-5 w-5 text-gray-500" />
    }
  }
  const getActionColor = (action, status) => {
    if (status === 'error') return 'text-red-600 bg-red-50'
    switch (action) {
      case 'ORDER_CREATED':
      case 'ORDER_UPDATED':
        return 'text-green-600 bg-green-50'
      case 'ORDER_CANCELLED':
        return 'text-red-600 bg-red-50'
      case 'PAYMENT_FAILED':
        return 'text-red-600 bg-red-50'
      case 'USER_LOGIN':
        return 'text-blue-600 bg-blue-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }
  const formatAction = (action) => {
    return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }
  const logs = auditLogs?.data?.data || []
  return (
    <div className="space-y-6">
      {}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600 mt-1">System activity and security logs</p>
        </div>
        <div className="text-sm text-gray-500">
          Total Events: {auditLogs?.data?.totalItems || 0}
        </div>
      </div>
      {}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          {}
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Actions</option>
            <option value="ORDER_CREATED">Order Created</option>
            <option value="ORDER_CANCELLED">Order Cancelled</option>
            <option value="USER_LOGIN">User Login</option>
            <option value="PAYMENT_FAILED">Payment Failed</option>
            <option value="PRODUCT_UPDATED">Product Updated</option>
          </select>
          {}
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          {}
          <button
            onClick={() => {
              setSearchTerm('')
              setActionFilter('')
              setDateFilter('')
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
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getActionIcon(log.action, log.status)}
                      <span className="ml-2 text-sm font-medium text-gray-900">
                        {formatAction(log.action)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{log.userName}</div>
                    <div className="text-sm text-gray-500">{log.userEmail}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs">
                      {log.details.orderId && (
                        <div>Order: {log.details.orderId}</div>
                      )}
                      {log.details.amount && (
                        <div>Amount: ${log.details.amount}</div>
                      )}
                      {log.details.reason && (
                        <div>Reason: {log.details.reason}</div>
                      )}
                      {log.details.errorCode && (
                        <div>Error: {log.details.errorCode}</div>
                      )}
                      {log.details.productName && (
                        <div>Product: {log.details.productName}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.ipAddress}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={cn(
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      getActionColor(log.action, log.status)
                    )}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(auditLogs?.data?.totalPages || 1, currentPage + 1))}
              disabled={currentPage === (auditLogs?.data?.totalPages || 1)}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>
                {' '}to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, auditLogs?.data?.totalItems || 0)}
                </span>
                {' '}of{' '}
                <span className="font-medium">{auditLogs?.data?.totalItems || 0}</span>
                {' '}results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(auditLogs?.data?.totalPages || 1, currentPage + 1))}
                  disabled={currentPage === (auditLogs?.data?.totalPages || 1)}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
      {logs.length === 0 && (
        <div className="text-center py-12">
          <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No audit logs found</h3>
          <p className="text-gray-500">No logs match your current filters.</p>
        </div>
      )}
    </div>
  )
}
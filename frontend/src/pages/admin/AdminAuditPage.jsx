import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminAPI } from '../../services/api'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { 
  DocumentTextIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  UserIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { cn } from '../../utils/cn'
const AuditLogRow = ({ log }) => {
  const getActionIcon = (action) => {
    switch (action.toLowerCase()) {
      case 'create':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />
      case 'update':
        return <InformationCircleIcon className="h-4 w-4 text-blue-500" />
      case 'delete':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
      default:
        return <DocumentTextIcon className="h-4 w-4 text-gray-500" />
    }
  }
  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'high':
        return 'badge-error'
      case 'medium':
        return 'badge-warning'
      case 'low':
        return 'badge-success'
      default:
        return 'badge-secondary'
    }
  }
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          {getActionIcon(log.action)}
          <div className="ml-3">
            <div className="text-sm font-medium text-gray-900">{log.action}</div>
            <div className="text-sm text-gray-500">{log.resource}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          {log.user?.avatar ? (
            <img className="h-8 w-8 rounded-full" src={log.user.avatar} alt="" />
          ) : (
            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
              <UserIcon className="h-4 w-4 text-gray-400" />
            </div>
          )}
          <div className="ml-3">
            <div className="text-sm font-medium text-gray-900">{log.user?.name || 'System'}</div>
            <div className="text-sm text-gray-500">{log.user?.email || 'system@furshield.com'}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-gray-900 max-w-xs truncate">{log.description}</div>
        {log.details && (
          <div className="text-sm text-gray-500 mt-1 max-w-xs truncate">
            {JSON.stringify(log.details)}
          </div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {log.severity && (
          <span className={cn('badge', getSeverityColor(log.severity))}>
            {log.severity}
          </span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <div className="flex items-center">
          <CalendarIcon className="h-4 w-4 mr-1" />
          {new Date(log.createdAt).toLocaleDateString()}
        </div>
        <div className="text-xs text-gray-400 mt-1">
          {new Date(log.createdAt).toLocaleTimeString()}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {log.ipAddress || 'N/A'}
      </td>
    </tr>
  )
}
export default function AdminAuditPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [severityFilter, setSeverityFilter] = useState('')
  const [dateRange, setDateRange] = useState('7') 
  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ['admin-audit-logs', { 
      search: searchQuery, 
      action: actionFilter, 
      severity: severityFilter,
      dateRange 
    }],
    queryFn: () => adminAPI.getAuditLogs({
      search: searchQuery || undefined,
      action: actionFilter || undefined,
      severity: severityFilter || undefined,
      dateRange: dateRange || undefined
    })
  })
  const { data: auditStats } = useQuery({
    queryKey: ['admin-audit-stats'],
    queryFn: adminAPI.getAuditStats
  })
  const logList = auditLogs?.data?.data || []
  const stats = auditStats?.data?.data || {}
  return (
    <div className="space-y-6">
      {}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-gray-600 mt-1">Monitor system activities and security events</p>
      </div>
      {}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total Events</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalEvents || 0}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <DocumentTextIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">High Severity</p>
                <p className="text-2xl font-bold text-gray-900">{stats.highSeverityCount || 0}</p>
              </div>
              <div className="p-3 rounded-full bg-red-100">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Today's Events</p>
                <p className="text-2xl font-bold text-gray-900">{stats.todayCount || 0}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeUsers || 0}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <UserIcon className="h-6 w-6 text-purple-600" />
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
              placeholder="Search audit logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="input lg:w-48"
          >
            <option value="">All Actions</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
          </select>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="input lg:w-48"
          >
            <option value="">All Severity</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="input lg:w-48"
          >
            <option value="1">Last 24 hours</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
      </div>
      {}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Audit Trail</h2>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <FunnelIcon className="h-4 w-4" />
              <span>{logList.length} events</span>
            </div>
          </div>
        </div>
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : logList.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No audit logs found</p>
          </div>
        ) : (
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
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logList.map((log) => (
                  <AuditLogRow key={log._id} log={log} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {}
      <div className="card bg-yellow-50 border-yellow-200">
        <div className="card-content">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Security Notice</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Audit logs are automatically retained for 90 days. High severity events are flagged for immediate attention.
                All administrative actions are logged and monitored for security compliance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
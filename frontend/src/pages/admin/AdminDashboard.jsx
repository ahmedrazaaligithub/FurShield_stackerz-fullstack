import { useQuery } from '@tanstack/react-query'
import { adminAPI } from '../../services/api'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { 
  UsersIcon,
  HeartIcon,
  CalendarIcon,
  ShoppingBagIcon,
  ChartBarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

const StatCard = ({ title, value, icon: Icon, change, color = 'primary' }) => (
  <div className="card">
    <div className="card-content">
      <div className="flex items-center">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className={`text-sm ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change > 0 ? '+' : ''}{change}% from last month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  </div>
)

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminAPI.getStats
  })

  const { data: recentActivity } = useQuery({
    queryKey: ['admin-recent-activity'],
    queryFn: adminAPI.getRecentActivity
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const statsData = stats?.data?.data || {}
  const activities = recentActivity?.data?.data || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Monitor and manage your pet care platform
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={statsData.totalUsers || 0}
          icon={UsersIcon}
          change={statsData.userGrowth}
          color="blue"
        />
        <StatCard
          title="Active Pets"
          value={statsData.totalPets || 0}
          icon={HeartIcon}
          change={statsData.petGrowth}
          color="green"
        />
        <StatCard
          title="Appointments"
          value={statsData.totalAppointments || 0}
          icon={CalendarIcon}
          change={statsData.appointmentGrowth}
          color="purple"
        />
        <StatCard
          title="Revenue"
          value={`$${statsData.totalRevenue || 0}`}
          icon={ShoppingBagIcon}
          change={statsData.revenueGrowth}
          color="yellow"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="card-content">
            {activities.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent activity</p>
            ) : (
              <div className="space-y-3">
                {activities.slice(0, 10).map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                    <div className="flex-shrink-0">
                      <div className="h-2 w-2 bg-primary-600 rounded-full"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* System Health */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900">System Health</h2>
          </div>
          <div className="card-content space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Database</span>
              <span className="badge badge-success">Healthy</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">API Response Time</span>
              <span className="text-sm text-gray-900">125ms</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Active Sessions</span>
              <span className="text-sm text-gray-900">{statsData.activeSessions || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Storage Used</span>
              <span className="text-sm text-gray-900">2.4 GB / 10 GB</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="btn btn-outline text-left p-4 h-auto">
              <UsersIcon className="h-5 w-5 mb-2" />
              <div className="text-sm font-medium">Manage Users</div>
            </button>
            <button className="btn btn-outline text-left p-4 h-auto">
              <HeartIcon className="h-5 w-5 mb-2" />
              <div className="text-sm font-medium">Review Pets</div>
            </button>
            <button className="btn btn-outline text-left p-4 h-auto">
              <ChartBarIcon className="h-5 w-5 mb-2" />
              <div className="text-sm font-medium">View Reports</div>
            </button>
            <button className="btn btn-outline text-left p-4 h-auto">
              <ExclamationTriangleIcon className="h-5 w-5 mb-2" />
              <div className="text-sm font-medium">System Alerts</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

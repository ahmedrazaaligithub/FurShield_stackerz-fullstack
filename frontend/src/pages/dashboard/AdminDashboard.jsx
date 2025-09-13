import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { 
  UsersIcon,
  ShoppingBagIcon,
  CalendarIcon,
  HomeIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'
import { userAPI, orderAPI, appointmentAPI, shelterAPI } from '../../services/api'
const StatCard = ({ title, value, icon: Icon, color, href, change }) => (
  <Link to={href} className="block">
    <div className="card p-6 hover:shadow-glow transition-all duration-300 group">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 group-hover:text-gray-700">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {value}
          </p>
          {change && (
            <p className={`text-sm mt-2 ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change > 0 ? '+' : ''}{change}% from last month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-8 w-8 text-white" />
        </div>
      </div>
    </div>
  </Link>
)
export default function AdminDashboard() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [users, orders, appointments, shelters] = await Promise.all([
        userAPI.getUsers({ limit: 1 }),
        orderAPI.getOrders({ limit: 1 }),
        appointmentAPI.getAppointments({ limit: 1 }),
        shelterAPI.getShelters({ limit: 1 })
      ])
      return {
        totalUsers: users.data?.total || 0,
        totalOrders: orders.data?.total || 0,
        totalAppointments: appointments.data?.total || 0,
        totalShelters: shelters.data?.total || 0,
        pendingOrders: orders.data?.data?.filter(o => o.status === 'pending').length || 0,
        pendingVets: users.data?.data?.filter(u => u.role === 'vet' && !u.isVetVerified).length || 0,
        pendingShelters: shelters.data?.data?.filter(s => !s.isVerified).length || 0,
        revenue: orders.data?.data?.reduce((sum, o) => sum + (o.total || 0), 0) || 0
      }
    },
    enabled: !!user?.id && user?.role === 'admin'
  })
  const { data: recentOrders } = useQuery({
    queryKey: ['recent-orders'],
    queryFn: () => orderAPI.getOrders({ limit: 5, sort: '-createdAt' }),
    enabled: !!user?.id && user?.role === 'admin'
  })
  const { data: pendingApprovals } = useQuery({
    queryKey: ['pending-approvals'],
    queryFn: async () => {
      const [vets, shelters] = await Promise.all([
        userAPI.getUsers({ role: 'vet', verified: false, limit: 5 }),
        shelterAPI.getShelters({ verified: false, limit: 5 })
      ])
      return {
        vets: vets.data?.data || [],
        shelters: shelters.data?.data || []
      }
    },
    enabled: !!user?.id && user?.role === 'admin'
  })
  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <ShieldCheckIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Access Only</h2>
        <p className="text-gray-600">This dashboard is only available for administrators.</p>
      </div>
    )
  }
  const statsCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: UsersIcon,
      color: 'bg-blue-600',
      href: '/admin/users',
      change: 12
    },
    {
      title: 'Total Orders',
      value: stats?.totalOrders || 0,
      icon: ShoppingBagIcon,
      color: 'bg-green-600',
      href: '/admin/orders',
      change: 8
    },
    {
      title: 'Revenue',
      value: `$${(stats?.revenue || 0).toLocaleString()}`,
      icon: CurrencyDollarIcon,
      color: 'bg-purple-600',
      href: '/admin/orders',
      change: 15
    },
    {
      title: 'Active Shelters',
      value: stats?.totalShelters || 0,
      icon: HomeIcon,
      color: 'bg-orange-600',
      href: '/admin/shelters',
      change: 5
    }
  ]
  const pendingItems = [
    {
      title: 'Pending Orders',
      count: stats?.pendingOrders || 0,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      href: '/admin/orders?status=pending'
    },
    {
      title: 'Vet Verifications',
      count: stats?.pendingVets || 0,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      href: '/admin/approvals?type=vet'
    },
    {
      title: 'Shelter Approvals',
      count: stats?.pendingShelters || 0,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      href: '/admin/approvals?type=shelter'
    }
  ]
  return (
    <div className="space-y-8">
      {}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Admin Dashboard
            </h1>
            <p className="text-indigo-100">
              Welcome back, {user?.name}! Monitor and manage the FurShield platform.
            </p>
          </div>
          <ShieldCheckIcon className="h-16 w-16 text-white/20" />
        </div>
      </div>
      {}
      {(stats?.pendingOrders > 0 || stats?.pendingVets > 0 || stats?.pendingShelters > 0) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-3" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800">
                Actions Required
              </h3>
              <div className="mt-2 flex flex-wrap gap-4">
                {pendingItems.map((item) => (
                  item.count > 0 && (
                    <Link
                      key={item.title}
                      to={item.href}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${item.bgColor} ${item.color}`}
                    >
                      {item.count} {item.title}
                    </Link>
                  )
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {}
      {statsLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>
      )}
      {}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Recent Orders</h2>
              <Link to="/admin/orders" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                View all
              </Link>
            </div>
          </div>
          <div className="card-content">
            {recentOrders?.data?.data?.length > 0 ? (
              <div className="space-y-4">
                {recentOrders.data.data.slice(0, 5).map((order) => (
                  <div key={order._id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">
                        Order #{order.orderNumber || order._id.slice(-6)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {order.user?.name} • ${order.total}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                      order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No recent orders
              </div>
            )}
          </div>
        </div>
        {}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Pending Approvals</h2>
              <Link to="/admin/approvals" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                View all
              </Link>
            </div>
          </div>
          <div className="card-content">
            <div className="space-y-4">
              {pendingApprovals?.vets?.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Veterinarians</h3>
                  {pendingApprovals.vets.map((vet) => (
                    <div key={vet._id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg mb-2">
                      <div>
                        <p className="font-medium text-gray-900">Dr. {vet.name}</p>
                        <p className="text-sm text-gray-600">{vet.email}</p>
                      </div>
                      <Link
                        to={`/admin/approvals/vet/${vet._id}`}
                        className="btn btn-primary btn-sm"
                      >
                        Review
                      </Link>
                    </div>
                  ))}
                </div>
              )}
              {pendingApprovals?.shelters?.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Shelters</h3>
                  {pendingApprovals.shelters.map((shelter) => (
                    <div key={shelter._id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg mb-2">
                      <div>
                        <p className="font-medium text-gray-900">{shelter.name}</p>
                        <p className="text-sm text-gray-600">{shelter.email}</p>
                      </div>
                      <Link
                        to={`/admin/approvals/shelter/${shelter._id}`}
                        className="btn btn-primary btn-sm"
                      >
                        Review
                      </Link>
                    </div>
                  ))}
                </div>
              )}
              {(!pendingApprovals?.vets?.length && !pendingApprovals?.shelters?.length) && (
                <div className="text-center py-8 text-gray-500">
                  No pending approvals
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Link to="/admin/users" className="card p-6 hover:shadow-lg transition-shadow text-center">
          <UsersIcon className="h-8 w-8 text-blue-600 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900">Manage Users</h3>
        </Link>
        <Link to="/admin/orders" className="card p-6 hover:shadow-lg transition-shadow text-center">
          <ShoppingBagIcon className="h-8 w-8 text-green-600 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900">Manage Orders</h3>
        </Link>
        <Link to="/admin/approvals" className="card p-6 hover:shadow-lg transition-shadow text-center">
          <ShieldCheckIcon className="h-8 w-8 text-purple-600 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900">Approvals</h3>
        </Link>
        <Link to="/admin/reports" className="card p-6 hover:shadow-lg transition-shadow text-center">
          <ChartBarIcon className="h-8 w-8 text-orange-600 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900">Reports</h3>
        </Link>
      </div>
    </div>
  )
}
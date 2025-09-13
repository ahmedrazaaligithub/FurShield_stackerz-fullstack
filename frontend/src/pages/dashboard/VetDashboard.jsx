import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { 
  CalendarIcon,
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
  BellIcon,
  CheckBadgeIcon,
  ClockIcon,
  DocumentTextIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'
import { appointmentAPI, petAPI, userAPI } from '../../services/api'
import toast from 'react-hot-toast'
const StatCard = ({ title, value, icon: Icon, color, href }) => (
  <Link to={href} className="block">
    <div className="card p-6 hover:shadow-glow transition-all duration-300 group">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${color} mr-4`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600 group-hover:text-gray-700">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900">
            {value}
          </p>
        </div>
      </div>
    </div>
  </Link>
)
export default function VetDashboard() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('pending')
  const { data: appointments, isLoading: appointmentsLoading } = useQuery({
    queryKey: ['vet-appointments', user?.id],
    queryFn: () => appointmentAPI.getAppointments({ vetId: user?.id }),
    enabled: !!user?.id && user?.role === 'vet'
  })
  const { data: todayAppointments } = useQuery({
    queryKey: ['today-appointments', user?.id],
    queryFn: () => appointmentAPI.getAppointments({ 
      vetId: user?.id, 
      date: new Date().toISOString().split('T')[0] 
    }),
    enabled: !!user?.id && user?.role === 'vet'
  })
  const pendingAppointments = appointments?.data?.data?.filter(a => a.status === 'pending') || []
  const confirmedAppointments = appointments?.data?.data?.filter(a => a.status === 'confirmed') || []
  const completedAppointments = appointments?.data?.data?.filter(a => a.status === 'completed') || []
  const stats = [
    {
      title: 'Today\'s Appointments',
      value: todayAppointments?.data?.data?.length || 0,
      icon: CalendarIcon,
      color: 'bg-blue-600',
      href: '/appointments'
    },
    {
      title: 'Pending Requests',
      value: pendingAppointments.length,
      icon: ClockIcon,
      color: 'bg-yellow-600',
      href: '/appointments?status=pending'
    },
    {
      title: 'Total Patients',
      value: appointments?.data?.totalPatients || 0,
      icon: UserGroupIcon,
      color: 'bg-green-600',
      href: '/patients'
    },
    {
      title: 'Completed This Month',
      value: completedAppointments.filter(a => {
        const appointmentDate = new Date(a.scheduledDate)
        const currentMonth = new Date().getMonth()
        return appointmentDate.getMonth() === currentMonth
      }).length,
      icon: CheckBadgeIcon,
      color: 'bg-purple-600',
      href: '/appointments?status=completed'
    }
  ]
  const handleAcceptAppointment = async (appointmentId) => {
    try {
      await appointmentAPI.acceptAppointment(appointmentId)
      toast.success('Appointment accepted successfully')
    } catch (error) {
      toast.error('Failed to accept appointment')
    }
  }
  const handleRejectAppointment = async (appointmentId) => {
    try {
      await appointmentAPI.cancelAppointment(appointmentId, { reason: 'Vet unavailable' })
      toast.success('Appointment rejected')
    } catch (error) {
      toast.error('Failed to reject appointment')
    }
  }
  if (user?.role !== 'vet') {
    return (
      <div className="text-center py-12">
        <CheckBadgeIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Veterinarian Access Only</h2>
        <p className="text-gray-600">This dashboard is only available for verified veterinarians.</p>
      </div>
    )
  }
  if (!user?.isVetVerified) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <CheckBadgeIcon className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Pending</h2>
          <p className="text-gray-600 mb-4">
            Your veterinarian account is pending verification. You'll receive an email once approved.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              Verification usually takes 24-48 hours. Please ensure you've submitted all required documents.
            </p>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="space-y-8">
      {}
      <div className="bg-gradient-to-r from-blue-600 to-teal-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Veterinarian Dashboard
            </h1>
            <p className="text-blue-100">
              Welcome back, Dr. {user?.name}! Manage your appointments and patients here.
            </p>
          </div>
          <CheckBadgeIcon className="h-16 w-16 text-white/20" />
        </div>
      </div>
      {}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>
      {}
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold text-gray-900">Appointment Management</h2>
        </div>
        {}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {['pending', 'confirmed', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => setActiveTab(status)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === status
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {status} ({
                  status === 'pending' ? pendingAppointments.length :
                  status === 'confirmed' ? confirmedAppointments.length :
                  completedAppointments.length
                })
              </button>
            ))}
          </nav>
        </div>
        <div className="card-content">
          {appointmentsLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="md" />
            </div>
          ) : (
            <div className="space-y-4">
              {activeTab === 'pending' && (
                pendingAppointments.length > 0 ? (
                  pendingAppointments.map((appointment) => (
                    <div key={appointment._id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {appointment.pet?.name} - {appointment.type}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Owner: {appointment.owner?.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(appointment.scheduledDate).toLocaleDateString()} at{' '}
                            {new Date(appointment.scheduledDate).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                          {appointment.notes && (
                            <p className="text-sm text-gray-600 mt-2">
                              Notes: {appointment.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleAcceptAppointment(appointment._id)}
                            className="btn btn-primary btn-sm"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRejectAppointment(appointment._id)}
                            className="btn btn-outline btn-sm"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No pending appointments
                  </div>
                )
              )}
              {activeTab === 'confirmed' && (
                confirmedAppointments.length > 0 ? (
                  confirmedAppointments.map((appointment) => (
                    <div key={appointment._id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {appointment.pet?.name} - {appointment.type}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Owner: {appointment.owner?.name} | Contact: {appointment.owner?.phone}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(appointment.scheduledDate).toLocaleDateString()} at{' '}
                            {new Date(appointment.scheduledDate).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                        <Link
                          to={`/appointments/${appointment._id}`}
                          className="btn btn-primary btn-sm"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No confirmed appointments
                  </div>
                )
              )}
              {activeTab === 'completed' && (
                completedAppointments.length > 0 ? (
                  completedAppointments.map((appointment) => (
                    <div key={appointment._id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {appointment.pet?.name} - {appointment.type}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Owner: {appointment.owner?.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            Completed: {new Date(appointment.completedAt).toLocaleDateString()}
                          </p>
                          {appointment.diagnosis && (
                            <p className="text-sm text-gray-600 mt-2">
                              Diagnosis: {appointment.diagnosis}
                            </p>
                          )}
                        </div>
                        <Link
                          to={`/appointments/${appointment._id}`}
                          className="btn btn-outline btn-sm"
                        >
                          View Report
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No completed appointments
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
      {}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/appointments" className="card p-6 hover:shadow-lg transition-shadow">
          <CalendarIcon className="h-8 w-8 text-blue-600 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">View All Appointments</h3>
          <p className="text-sm text-gray-600">Manage your appointment schedule</p>
        </Link>
        <Link to="/patients" className="card p-6 hover:shadow-lg transition-shadow">
          <UserGroupIcon className="h-8 w-8 text-green-600 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">Patient Records</h3>
          <p className="text-sm text-gray-600">Access patient medical histories</p>
        </Link>
        <Link to="/profile" className="card p-6 hover:shadow-lg transition-shadow">
          <DocumentTextIcon className="h-8 w-8 text-purple-600 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">Update Profile</h3>
          <p className="text-sm text-gray-600">Manage your professional information</p>
        </Link>
      </div>
    </div>
  )
}
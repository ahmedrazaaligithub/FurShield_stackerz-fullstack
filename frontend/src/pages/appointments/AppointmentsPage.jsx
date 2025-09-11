import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { appointmentAPI } from '../../services/api'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { 
  CalendarIcon, 
  PlusIcon,
  ClockIcon,
  UserIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'
import { cn } from '../../utils/cn'
import { useAuth } from '../../contexts/AuthContext'
import VetDirectoryPage from '../vets/VetDirectoryPage'

const AppointmentCard = ({ appointment }) => (
  <Link to={`/appointments/${appointment._id}`} className="block">
    <div className="card hover:shadow-glow transition-all duration-300 group">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <CalendarIcon className="h-8 w-8 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                {appointment.type}
              </h3>
              <p className="text-sm text-gray-600">
                {appointment.pet?.name} • {appointment.pet?.species}
              </p>
            </div>
          </div>
          <span className={cn(
            'badge',
            appointment.status === 'confirmed' ? 'badge-success' :
            appointment.status === 'pending' ? 'badge-warning' :
            appointment.status === 'completed' ? 'badge-primary' :
            'badge-secondary'
          )}>
            {appointment.status}
          </span>
        </div>
        
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center">
            <ClockIcon className="h-4 w-4 mr-2" />
            <span>
              {new Date(appointment.scheduledDate).toLocaleDateString()} at{' '}
              {new Date(appointment.scheduledDate).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          </div>
          {appointment.vet && (
            <div className="flex items-center">
              <UserIcon className="h-4 w-4 mr-2" />
              <span>Dr. {appointment.vet.name}</span>
            </div>
          )}
        </div>
        
        {appointment.reason && (
          <p className="text-gray-700 text-sm mt-3 line-clamp-2">
            {appointment.reason}
          </p>
        )}
        
        <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
          <span>Created {new Date(appointment.createdAt).toLocaleDateString()}</span>
          {appointment.estimatedDuration && (
            <span>{appointment.estimatedDuration} minutes</span>
          )}
        </div>
      </div>
    </div>
  </Link>
)

export default function AppointmentsPage() {
  const { user } = useAuth()
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  // Debug user role
  console.log('User object:', user)
  console.log('User role:', user?.role)
  
  // If user is a veterinarian, show vet directory instead
  if (user?.role === 'veterinarian' || user?.role === 'vet') {
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Veterinarian Network</h1>
          <p className="text-gray-600 mt-2">Connect with fellow veterinary professionals</p>
        </div>
        <VetDirectoryPage />
      </div>
    )
  }

  const { data: appointments, isLoading, error } = useQuery({
    queryKey: ['appointments', { status: statusFilter, type: typeFilter }],
    queryFn: () => appointmentAPI.getAppointments({
      status: statusFilter || undefined,
      type: typeFilter || undefined
    })
  })

  const filteredAppointments = appointments?.data?.data || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-600 mt-1">
            Manage your veterinary appointments
          </p>
        </div>
        <Link to="/appointments/book" className="btn btn-primary">
          <PlusIcon className="h-4 w-4 mr-2" />
          Book Appointment
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input"
          >
            <option value="">All Types</option>
            <option value="checkup">Checkup</option>
            <option value="vaccination">Vaccination</option>
            <option value="emergency">Emergency</option>
            <option value="surgery">Surgery</option>
            <option value="consultation">Consultation</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center items-center min-h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">Failed to load appointments</p>
          <p className="text-gray-600">Please try again later</p>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="text-center py-12">
          <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {statusFilter || typeFilter ? 'No appointments found' : 'No appointments yet'}
          </h3>
          <p className="text-gray-600 mb-6">
            {statusFilter || typeFilter 
              ? 'Try adjusting your filters'
              : 'Book your first appointment to get started'
            }
          </p>
          <Link to="/appointments/book" className="btn btn-primary">
            <PlusIcon className="h-4 w-4 mr-2" />
            Book Your First Appointment
          </Link>
        </div>
      ) : (
        <>
          {/* Results Summary */}
          <div className="flex items-center justify-between">
            <p className="text-gray-600">
              {filteredAppointments.length} appointment{filteredAppointments.length !== 1 ? 's' : ''}
            </p>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <FunnelIcon className="h-4 w-4" />
              <span>Sort by: Date</span>
            </div>
          </div>

          {/* Appointments Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredAppointments.map((appointment) => (
              <AppointmentCard key={appointment._id} appointment={appointment} />
            ))}
          </div>
        </>
      )}

      {/* Quick Stats */}
      {filteredAppointments.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {filteredAppointments.filter(a => a.status === 'confirmed').length}
              </div>
              <div className="text-sm text-gray-600">Confirmed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {filteredAppointments.filter(a => a.status === 'pending').length}
              </div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {filteredAppointments.filter(a => a.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">
                {filteredAppointments.filter(a => a.type === 'checkup').length}
              </div>
              <div className="text-sm text-gray-600">Checkups</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { appointmentAPI, userAPI } from '../../services/api'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { 
  CalendarIcon, 
  PlusIcon,
  ClockIcon,
  UserIcon,
  FunnelIcon,
  StarIcon,
  MapPinIcon,
  PhoneIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
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
const VetCard = ({ vet }) => (
  <div className="card hover:shadow-glow transition-all duration-300 group">
    <div className="p-6">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          {vet.avatar ? (
            <img
              src={vet.avatar}
              alt={vet.name}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="h-16 w-16 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full flex items-center justify-center">
              <UserIcon className="h-8 w-8 text-primary-600" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
              Dr. {vet.name}
            </h3>
            {vet.isVetVerified && (
              <ShieldCheckIcon className="h-5 w-5 text-green-500" title="Verified Veterinarian" />
            )}
          </div>
          <p className="text-sm text-gray-600 mb-2">
            {vet.profile?.specialization || 'General Practice'}
          </p>
          <div className="flex items-center space-x-4 mb-3">
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <StarIconSolid
                  key={star}
                  className={cn(
                    'h-4 w-4',
                    star <= (vet.averageRating || 4.5) ? 'text-yellow-400' : 'text-gray-300'
                  )}
                />
              ))}
              <span className="text-sm text-gray-600 ml-1">
                ({vet.averageRating || 4.5}/5)
              </span>
            </div>
            <span className="text-sm text-gray-500">
              {vet.profile?.experience || 5}+ years exp
            </span>
          </div>
          <div className="space-y-1 text-sm text-gray-600">
            {vet.profile?.location && (
              <div className="flex items-center">
                <MapPinIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">{vet.profile.location}</span>
              </div>
            )}
            {vet.phone && (
              <div className="flex items-center">
                <PhoneIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>{vet.phone}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 flex flex-col space-y-2">
          <Link
            to={`/profile/${vet._id}`}
            className="btn btn-secondary btn-sm"
          >
            View Profile
          </Link>
          <Link
            to={`/appointments/book?vet=${vet._id}`}
            className="btn btn-primary btn-sm"
          >
            Book Now
          </Link>
        </div>
      </div>
      {vet.profile?.bio && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-700 line-clamp-2">
            {vet.profile.bio}
          </p>
        </div>
      )}
    </div>
  </div>
)
const AvailableVetsSection = () => {
  const { data: vets, isLoading: vetsLoading } = useQuery({
    queryKey: ['available-vets'],
    queryFn: () => userAPI.getVets({ limit: 10, verified: true })
  })
  const availableVets = vets?.data?.data || []
  if (vetsLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }
  return (
    <div className="space-y-6">
      <div className="text-center">
        <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments yet</h3>
        <p className="text-gray-600 mb-8">Choose from our verified veterinarians to book your first appointment</p>
      </div>
      {availableVets.length > 0 ? (
        <>
          <div className="flex items-center justify-between">
            <h4 className="text-xl font-semibold text-gray-900">Available Veterinarians</h4>
            <Link to="/vets" className="text-primary-600 hover:text-primary-700 font-medium">
              View All Vets →
            </Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {availableVets.map((vet) => (
              <VetCard key={vet._id} vet={vet} />
            ))}
          </div>
          <div className="text-center">
            <Link to="/appointments/book" className="btn btn-primary">
              <PlusIcon className="h-4 w-4 mr-2" />
              Book Your First Appointment
            </Link>
          </div>
        </>
      ) : (
        <div className="text-center">
          <p className="text-gray-600 mb-6">No veterinarians available at the moment</p>
          <Link to="/appointments/book" className="btn btn-primary">
            <PlusIcon className="h-4 w-4 mr-2" />
            Book Appointment
          </Link>
        </div>
      )}
    </div>
  )
}
export default function AppointmentsPage() {
  const { user } = useAuth()
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  console.log('User object:', user)
  console.log('User role:', user?.role)
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
      {}
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
      {}
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
      {}
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
        <AvailableVetsSection />
      ) : (
        <>
          {}
          <div className="flex items-center justify-between">
            <p className="text-gray-600">
              {filteredAppointments.length} appointment{filteredAppointments.length !== 1 ? 's' : ''}
            </p>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <FunnelIcon className="h-4 w-4" />
              <span>Sort by: Date</span>
            </div>
          </div>
          {}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredAppointments.map((appointment) => (
              <AppointmentCard key={appointment._id} appointment={appointment} />
            ))}
          </div>
        </>
      )}
      {}
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
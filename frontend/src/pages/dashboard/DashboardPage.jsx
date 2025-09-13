import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { 
  HeartIcon, 
  CalendarIcon, 
  ShoppingBagIcon,
  UserGroupIcon,
  BellIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'
import { petAPI, appointmentAPI, orderAPI } from '../../services/api'
import ShelterDashboard from './ShelterDashboard'
import VetDashboard from './VetDashboard'
import AdminDashboard from './AdminDashboard'
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
const QuickAction = ({ title, description, icon: Icon, href, color }) => (
  <Link to={href} className="block">
    <div className="card p-6 hover:shadow-glow transition-all duration-300 group">
      <div className={`inline-flex p-3 rounded-lg ${color} mb-4`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
        {title}
      </h3>
      <p className="text-gray-600 text-sm">
        {description}
      </p>
    </div>
  </Link>
)
export default function DashboardPage() {
  const { user } = useAuth()
  if (user?.role === 'admin') {
    return <AdminDashboard />
  }
  if (user?.role === 'shelter') {
    return <ShelterDashboard />
  }
  if (user?.role === 'vet') {
    return <VetDashboard />
  }
  const { data: pets, isLoading: petsLoading } = useQuery({
    queryKey: ['user-pets'],
    queryFn: () => petAPI.getUserPets(user?.id),
    enabled: !!user?.id
  })
  const { data: appointments, isLoading: appointmentsLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => appointmentAPI.getAppointments({ limit: 5, status: 'upcoming' })
  })
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => orderAPI.getOrders({ limit: 5 })
  })
  const stats = [
    {
      title: 'Pets',
      value: pets?.data?.data?.length || 0,
      icon: HeartIcon,
      color: 'bg-primary-600',
      href: '/pets'
    },
    {
      title: 'Upcoming Appointments',
      value: appointments?.data?.data?.length || 0,
      icon: CalendarIcon,
      color: 'bg-secondary-600',
      href: '/appointments'
    },
    {
      title: 'Recent Orders',
      value: orders?.data?.data?.length || 0,
      icon: ShoppingBagIcon,
      color: 'bg-green-600',
      href: '/orders'
    }
  ]
  const quickActions = [
    {
      title: 'Add New Pet',
      description: 'Register a new pet and start tracking their health',
      icon: HeartIcon,
      href: '/pets/add',
      color: 'bg-primary-600'
    },
    {
      title: 'Book Appointment',
      description: 'Schedule a visit with a verified veterinarian',
      icon: CalendarIcon,
      href: '/appointments/book',
      color: 'bg-secondary-600'
    },
    {
      title: 'Browse Adoptions',
      description: 'Find pets looking for their forever homes',
      icon: UserGroupIcon,
      href: '/adoption',
      color: 'bg-accent-600'
    },
    {
      title: 'Shop Pet Supplies',
      description: 'Browse premium pet food, toys, and accessories',
      icon: ShoppingBagIcon,
      href: '/shop',
      color: 'bg-green-600'
    }
  ]
  const isLoading = petsLoading || appointmentsLoading || ordersLoading
  return (
    <div className="space-y-8">
      {}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-600 mt-1">
            Here's what's happening with your pets today
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Link to="/ai-assistant" className="btn btn-primary">
            <BellIcon className="h-4 w-4 mr-2" />
            AI Assistant
          </Link>
        </div>
      </div>
      {}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>
      {}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Upcoming Appointments
              </h2>
              <Link to="/appointments" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                View all
              </Link>
            </div>
          </div>
          <div className="card-content">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="md" />
              </div>
            ) : appointments?.data?.data?.length > 0 ? (
              <div className="space-y-4">
                {appointments.data.data.slice(0, 3).map((appointment) => (
                  <div key={appointment._id} className="flex items-center space-x-4 p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex-shrink-0">
                      <CalendarIcon className="h-8 w-8 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {appointment.pet?.name} - {appointment.type}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(appointment.scheduledDate).toLocaleDateString()} at{' '}
                        {new Date(appointment.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-xs text-gray-400">
                        Dr. {appointment.vet?.name}
                      </p>
                    </div>
                    <div className={`px-2 py-1 text-xs rounded-full ${
                      appointment.status === 'confirmed' 
                        ? 'bg-green-100 text-green-800'
                        : appointment.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {appointment.status}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No upcoming appointments</p>
                <Link to="/appointments/book" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                  Book your first appointment
                </Link>
              </div>
            )}
          </div>
        </div>
        {}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
               My Pets
              </h2>
              <Link to="/pets" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                View all
              </Link>
            </div>
          </div>
          <div className="card-content">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="md" />
              </div>
            ) : pets?.data?.data?.length > 0 ? (
              <div className="space-y-4">
                {pets.data.data.slice(0, 3).map((pet) => (
                  <div key={pet._id} className="flex items-center space-x-4 p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex-shrink-0">
                      {pet.photos?.[0] ? (
                        <img
                          src={pet.photos[0]}
                          alt={pet.name}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
                          <HeartIcon className="h-6 w-6 text-primary-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {pet.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {pet.species} • {pet.breed}
                      </p>
                      <p className="text-xs text-gray-400">
                        {pet.age} years old
                      </p>
                    </div>
                    <Link 
                      to={`/pets/${pet._id}`}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      View
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <HeartIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No pets registered yet</p>
                <Link to="/pets/add" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                  Add your first pet
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      {}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => (
            <QuickAction key={index} {...action} />
          ))}
        </div>
      </div>
      {}
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold text-gray-900">
            Pet Care Tips
          </h2>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">Regular Checkups</h3>
              <p className="text-sm text-gray-600">
                Schedule annual wellness exams to catch health issues early and keep your pet healthy.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">Vaccination Schedule</h3>
              <p className="text-sm text-gray-600">
                Keep your pet's vaccinations up to date to protect them from preventable diseases.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">Dental Care</h3>
              <p className="text-sm text-gray-600">
                Regular dental cleaning and care can prevent serious health problems in pets.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">Nutrition</h3>
              <p className="text-sm text-gray-600">
                Feed your pet age-appropriate, high-quality food in proper portions for optimal health.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
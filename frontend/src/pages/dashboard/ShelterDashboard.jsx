import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { 
  HeartIcon, 
  CalendarIcon, 
  HomeIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ClipboardDocumentListIcon,
  ShieldCheckIcon,
  PhotoIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'
import { petAPI, appointmentAPI, adoptionAPI, chatAPI, shelterAPI, orderAPI } from '../../services/api'
import toast from 'react-hot-toast'
import ShelterProfileForm from '../../components/shelters/ShelterProfileForm'
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
const QuickAction = ({ title, description, icon: Icon, href, color, onClick }) => {
  const content = (
    <div className="card p-6 hover:shadow-glow transition-all duration-300 group cursor-pointer">
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
  )
  if (onClick) {
    return <div onClick={onClick}>{content}</div>
  }
  return <Link to={href} className="block">{content}</Link>
}
export default function ShelterDashboard() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [petToDelete, setPetToDelete] = useState(null)
  const [showShelterForm, setShowShelterForm] = useState(false)
  const { data: myShelterResp, isLoading: myShelterLoading, isError: myShelterError } = useQuery({
    queryKey: ['my-shelter'],
    queryFn: () => shelterAPI.getMyShelter(),
    enabled: !!user?.id && user?.role === 'shelter',
    retry: false
  })
  const myShelter = myShelterResp?.data?.data
  const { data: pets, isLoading: petsLoading } = useQuery({
    queryKey: ['shelter-pets', user?.id],
    queryFn: () => petAPI.getUserPets(user?.id),
    enabled: !!user?.id && user?.role === 'shelter'
  })
  const { data: adoptions, isLoading: adoptionsLoading } = useQuery({
    queryKey: ['shelter-adoptions', user?.id],
    queryFn: () => adoptionAPI.getShelterListings(user?.id),
    enabled: !!user?.id && user?.role === 'shelter'
  })
  const { data: appointments, isLoading: appointmentsLoading } = useQuery({
    queryKey: ['shelter-appointments', user?.id],
    queryFn: () => appointmentAPI.getAppointments({ userId: user?.id }),
    enabled: !!user?.id && user?.role === 'shelter'
  })
  const { data: inquiries, isLoading: inquiriesLoading } = useQuery({
    queryKey: ['adoption-inquiries', user?.id],
    queryFn: () => adoptionAPI.getInquiries({ shelterId: user?.id }),
    enabled: !!user?.id && user?.role === 'shelter'
  })
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['shelter-orders', user?.id],
    queryFn: () => orderAPI.getOrders({ sellerId: user?.id }),
    enabled: !!user?.id && user?.role === 'shelter'
  })
  const deletePetMutation = useMutation({
    mutationFn: (petId) => petAPI.deletePet(petId),
    onSuccess: () => {
      queryClient.invalidateQueries(['shelter-pets'])
      toast.success('Pet removed successfully')
      setShowDeleteModal(false)
      setPetToDelete(null)
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete pet')
    }
  })
  const handleDeletePet = (pet) => {
    setPetToDelete(pet)
    setShowDeleteModal(true)
  }
  const confirmDelete = () => {
    if (petToDelete) {
      deletePetMutation.mutate(petToDelete._id)
    }
  }
  const stats = [
    {
      title: 'Total Pets',
      value: pets?.data?.data?.length || 0,
      icon: HeartIcon,
      color: 'bg-blue-600',
      href: '/pets'
    },
    {
      title: 'Active Adoptions',
      value: adoptions?.data?.data?.filter(a => a.status === 'available')?.length || 0,
      icon: HomeIcon,
      color: 'bg-green-600',
      href: '/adoption'
    },
    {
      title: 'Adoption Requests',
      value: appointments?.data?.data?.filter(a => a.status === 'pending')?.length || 0,
      icon: CalendarIcon,
      color: 'bg-purple-600',
      href: '/appointments'
    },
    {
      title: 'Adoption Inquiries',
      value: inquiries?.data?.data?.length || 0,
      icon: ChatBubbleLeftRightIcon,
      color: 'bg-orange-600',
      href: '/inquiries'
    },
    {
      title: 'Customer Orders',
      value: orders?.data?.data?.length || 0,
      icon: ShoppingBagIcon,
      color: 'bg-indigo-600',
      href: '/shelter/orders'
    }
  ]
  const quickActions = [
    {
      title: 'List New Pet',
      description: 'Add a new pet to your shelter inventory',
      icon: PlusIcon,
      href: '/pets/add',
      color: 'bg-blue-600'
    },
    {
      title: 'Create Adoption Listing',
      description: 'Post a pet for adoption',
      icon: HomeIcon,
      href: '/adoption/create',
      color: 'bg-green-600'
    },
    {
      title: 'Manage Appointments',
      description: 'View and manage adoption appointments',
      icon: CalendarIcon,
      href: '/appointments',
      color: 'bg-purple-600'
    },
    {
      title: 'Manage Inquiries',
      description: 'Respond to adoption inquiries and applications',
      icon: ChatBubbleLeftRightIcon,
      href: '/inquiries',
      color: 'bg-orange-600'
    },
    {
      title: 'View Orders',
      description: 'Manage customer orders and fulfillment',
      icon: ShoppingBagIcon,
      href: '/shelter/orders',
      color: 'bg-indigo-600'
    }
  ]
  const isLoading = petsLoading || adoptionsLoading || appointmentsLoading || inquiriesLoading || ordersLoading
  if (user?.role !== 'shelter') {
    return (
      <div className="text-center py-12">
        <ShieldCheckIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Shelter Access Only</h2>
        <p className="text-gray-600">This dashboard is only available for shelter representatives.</p>
      </div>
    )
  }
  return (
    <div className="space-y-8">
      {}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Shelter Dashboard
            </h1>
            <p className="text-blue-100">
              Welcome back, {user?.name}! Manage your shelter operations here.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {myShelterLoading ? null : myShelter ? (
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${myShelter.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {myShelter.isVerified ? 'Verified Shelter' : 'Pending Verification'}
              </span>
            ) : (
              <button onClick={() => setShowShelterForm(true)} className="btn btn-white/10 hover:bg-white/20">
                Create Shelter Profile
              </button>
            )}
            <ShieldCheckIcon className="h-16 w-16 text-white/20" />
          </div>
        </div>
      </div>
      {}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>
      {}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => (
            <QuickAction key={index} {...action} />
          ))}
        </div>
      </div>
      {}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Your Shelter Pets
              </h2>
              <Link to="/pets/add" className="btn btn-primary btn-sm">
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Pet
              </Link>
            </div>
          </div>
          <div className="card-content">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="md" />
              </div>
            ) : pets?.data?.data?.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {pets.data.data.map((pet) => (
                  <div key={pet._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {pet.photos?.[0] ? (
                          <img
                            src={pet.photos[0]}
                            alt={pet.name}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <HeartIcon className="h-6 w-6 text-blue-600" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{pet.name}</p>
                        <p className="text-xs text-gray-500">
                          {pet.species} • {pet.breed} • {pet.age} years
                        </p>
                        <p className="text-xs text-gray-400">
                          Health: <span className={`font-medium ${
                            pet.healthStatus === 'healthy' ? 'text-green-600' :
                            pet.healthStatus === 'needs-attention' ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>{pet.healthStatus}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Link
                        to={`/pets/${pet._id}`}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="View pet"
                      >
                        <PhotoIcon className="h-4 w-4" />
                      </Link>
                      <Link
                        to={`/pets/${pet._id}/edit`}
                        className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                        title="Edit pet"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDeletePet(pet)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete pet"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <HeartIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No pets registered yet</p>
                <Link to="/pets/add" className="btn btn-primary btn-sm">
                  Add Your First Pet
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
                Adoption Appointments
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
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {appointments.data.data.slice(0, 5).map((appointment) => (
                  <div key={appointment._id} className="p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {appointment.petName} - {appointment.type}
                        </p>
                        <p className="text-xs text-gray-500">
                          Adopter: {appointment.adopterName}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        appointment.status === 'confirmed' 
                          ? 'bg-green-100 text-green-800'
                          : appointment.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {appointment.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      {new Date(appointment.scheduledDate).toLocaleDateString()} at{' '}
                      {new Date(appointment.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No adoption appointments yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
      {}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Confirm Delete
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to remove {petToDelete?.name} from your shelter? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deletePetMutation.isPending}
                className="btn btn-danger"
              >
                {deletePetMutation.isPending ? 'Deleting...' : 'Delete Pet'}
              </button>
            </div>
          </div>
        </div>
      )}
      {}
      {showShelterForm && (
        <ShelterProfileForm
          onClose={() => setShowShelterForm(false)}
          onSuccess={() => {
            queryClient.invalidateQueries(['my-shelter'])
          }}
        />
      )}
    </div>
  )
}
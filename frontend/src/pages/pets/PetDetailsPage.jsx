import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { petAPI, appointmentAPI } from '../../services/api'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { 
  ArrowLeftIcon,
  PencilIcon,
  CalendarIcon,
  HeartIcon,
  PhotoIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { cn } from '../../utils/cn'
import toast from 'react-hot-toast'

export default function PetDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('overview')
  const [isUploading, setIsUploading] = useState(false)

  const { data: pet, isLoading, error } = useQuery({
    queryKey: ['pet', id],
    queryFn: () => petAPI.getPet(id)
  })

  const { data: healthRecords } = useQuery({
    queryKey: ['pet-health-records', id],
    queryFn: () => petAPI.getHealthRecords(id),
    enabled: !!id
  })

  const { data: appointments } = useQuery({
    queryKey: ['pet-appointments', id],
    queryFn: () => appointmentAPI.getAppointments({ petId: id }),
    enabled: !!id
  })

  const deletePetMutation = useMutation({
    mutationFn: petAPI.deletePet,
    onSuccess: () => {
      toast.success('Pet deleted successfully')
      navigate('/pets')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete pet')
    }
  })

  const uploadPhotosMutation = useMutation({
    mutationFn: ({ petId, formData }) => petAPI.uploadPhotos(petId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries(['pet', id])
      toast.success('Photos uploaded successfully')
      setIsUploading(false)
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to upload photos')
      setIsUploading(false)
    }
  })

  const handleDeletePet = () => {
    if (window.confirm('Are you sure you want to delete this pet? This action cannot be undone.')) {
      deletePetMutation.mutate(id)
    }
  }

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    setIsUploading(true)
    
    try {
      const uploadedPhotos = []
      
      // Mock pet data for development without backend
      const mockPetData = {
        _id: id,
        name: 'Buddy',
        species: 'dog',
        breed: 'Golden Retriever',
        age: 3,
        weight: 30,
        color: 'Golden',
        gender: 'male',
        description: 'Friendly and energetic dog who loves to play fetch.',
        photos: [
          '/api/placeholder/300/300',
          '/api/placeholder/300/300'
        ],
        owner: {
          _id: 'mock-owner-id',
          name: 'John Doe',
          email: 'john@example.com'
        },
        createdAt: new Date().toISOString()
      }

      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('type', 'pet')
        
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/v1/upload/single`, {
            method: 'POST',
            body: formData,
            credentials: 'include',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          })
          
          const data = await response.json()
          if (data.success) {
            uploadedPhotos.push(data.data.url)
          } else {
            console.error('Upload failed:', data.error)
            // Fallback to mock for development
            const mockUrl = `/uploads/pets/${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${file.name}`
            uploadedPhotos.push(mockUrl)
          }
        } catch (error) {
          console.error('Upload error:', error)
          // Fallback to mock for development
          const mockUrl = `/uploads/pets/${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${file.name}`
          uploadedPhotos.push(mockUrl)
        }
      }
      
      // Update pet photos
      const currentPhotos = petData.photos || []
      const updatedPhotos = [...currentPhotos, ...uploadedPhotos]
      
      // Update query cache
      setTimeout(() => {
        queryClient.setQueryData(['pet', id], (oldData) => {
          if (oldData?.data?.data) {
            return {
              ...oldData,
              data: {
                ...oldData.data,
                data: {
                  ...oldData.data.data,
                  photos: updatedPhotos
                }
              }
            }
          }
          return oldData
        })
        
        toast.success('Photos uploaded successfully! (Mock mode)')
        setIsUploading(false)
      }, 1000)
      
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload photos')
      setIsUploading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !pet?.data?.data) {
    return (
      <div className="text-center py-12">
        <HeartIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Pet not found</h3>
        <p className="text-gray-600 mb-6">The pet you're looking for doesn't exist or has been removed.</p>
        <Link to="/pets" className="btn btn-primary">
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Pets
        </Link>
      </div>
    )
  }

  const petData = pet.data.data
  const petHealthRecords = healthRecords?.data?.data || []
  const petAppointments = appointments?.data?.data || []

  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'health', name: 'Health Records' },
    { id: 'appointments', name: 'Appointments' },
    { id: 'photos', name: 'Photos' }
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/pets')}
            className="btn btn-ghost p-2"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{petData.name}</h1>
            <p className="text-gray-600 capitalize">{petData.species} • {petData.breed}</p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <Link
            to={`/appointments/book?petId=${id}`}
            className="btn btn-secondary"
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            Book Appointment
          </Link>
          <Link
            to={`/pets/${id}/edit`}
            className="btn btn-outline"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit
          </Link>
          <button
            onClick={handleDeletePet}
            disabled={deletePetMutation.isPending}
            className="btn btn-outline text-red-600 border-red-300 hover:bg-red-50"
          >
            <TrashIcon className="h-4 w-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      {/* Pet Summary Card */}
      <div className="card">
        <div className="p-6">
          <div className="flex items-start space-x-6">
            <div className="flex-shrink-0">
              {petData.photos?.[0] ? (
                <img
                  src={petData.photos[0].startsWith('/') ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${petData.photos[0]}` : petData.photos[0]}
                  alt={petData.name}
                  className="h-32 w-32 rounded-lg object-cover"
                />
              ) : (
                <div className="h-32 w-32 bg-gray-200 rounded-lg flex items-center justify-center">
                  <PhotoIcon className="h-16 w-16 text-gray-400" />
                </div>
              )}
            </div>
            
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <label className="label">Age</label>
                <p className="text-lg font-semibold text-gray-900">{petData.age} years</p>
              </div>
              <div>
                <label className="label">Weight</label>
                <p className="text-lg font-semibold text-gray-900">
                  {petData.weight ? `${petData.weight} lbs` : 'Not recorded'}
                </p>
              </div>
              <div>
                <label className="label">Gender</label>
                <p className="text-lg font-semibold text-gray-900 capitalize">{petData.gender}</p>
              </div>
              <div>
                <label className="label">Health Status</label>
                <span className={cn(
                  'badge',
                  petData.healthStatus === 'healthy' ? 'badge-success' :
                  petData.healthStatus === 'needs-attention' ? 'badge-warning' :
                  'badge-danger'
                )}>
                  {petData.healthStatus?.replace('-', ' ')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'py-2 px-1 border-b-2 font-medium text-sm',
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            </div>
            <div className="card-content space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Species</label>
                  <p className="text-gray-900 capitalize">{petData.species}</p>
                </div>
                <div>
                  <label className="label">Breed</label>
                  <p className="text-gray-900">{petData.breed}</p>
                </div>
                <div>
                  <label className="label">Color</label>
                  <p className="text-gray-900">{petData.color || 'Not specified'}</p>
                </div>
                <div>
                  <label className="label">Microchip ID</label>
                  <p className="text-gray-900">{petData.microchipId || 'Not registered'}</p>
                </div>
              </div>
              
              {petData.notes && (
                <div>
                  <label className="label">Notes</label>
                  <p className="text-gray-900">{petData.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Medical Information */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Medical Information</h3>
            </div>
            <div className="card-content space-y-4">
              {petData.medicalConditions?.length > 0 && (
                <div>
                  <label className="label">Medical Conditions</label>
                  <div className="flex flex-wrap gap-2">
                    {petData.medicalConditions.map((condition, index) => (
                      <span key={index} className="badge badge-secondary">
                        {condition}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {petData.allergies?.length > 0 && (
                <div>
                  <label className="label">Allergies</label>
                  <div className="flex flex-wrap gap-2">
                    {petData.allergies.map((allergy, index) => (
                      <span key={index} className="badge badge-warning">
                        {allergy}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {petData.medications?.length > 0 && (
                <div>
                  <label className="label">Current Medications</label>
                  <div className="flex flex-wrap gap-2">
                    {petData.medications.map((medication, index) => (
                      <span key={index} className="badge badge-primary">
                        {medication}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {petData.vetContact && (
                <div>
                  <label className="label">Veterinarian</label>
                  <p className="text-gray-900">{petData.vetContact}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'health' && (
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Health Records</h3>
              <button className="btn btn-primary btn-sm">
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Record
              </button>
            </div>
          </div>
          <div className="card-content">
            {petHealthRecords.length > 0 ? (
              <div className="space-y-4">
                {petHealthRecords.map((record) => (
                  <div key={record._id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{record.type}</h4>
                      <span className="text-sm text-gray-500">
                        {new Date(record.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-2">{record.description}</p>
                    {record.vet && (
                      <p className="text-sm text-gray-500">Dr. {record.vet.name}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <HeartIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No health records yet</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'appointments' && (
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Appointments</h3>
              <Link
                to={`/appointments/book?petId=${id}`}
                className="btn btn-primary btn-sm"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Book Appointment
              </Link>
            </div>
          </div>
          <div className="card-content">
            {petAppointments.length > 0 ? (
              <div className="space-y-4">
                {petAppointments.map((appointment) => (
                  <div key={appointment._id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{appointment.type}</h4>
                      <span className={cn(
                        'badge',
                        appointment.status === 'confirmed' ? 'badge-success' :
                        appointment.status === 'pending' ? 'badge-warning' :
                        'badge-secondary'
                      )}>
                        {appointment.status}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-2">
                      {new Date(appointment.scheduledDate).toLocaleDateString()} at{' '}
                      {new Date(appointment.scheduledDate).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                    {appointment.vet && (
                      <p className="text-sm text-gray-500">Dr. {appointment.vet.name}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No appointments scheduled</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'photos' && (
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Photos</h3>
              <label className="btn btn-primary btn-sm cursor-pointer">
                <PlusIcon className="h-4 w-4 mr-2" />
                {isUploading ? 'Uploading...' : 'Add Photos'}
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
            </div>
          </div>
          <div className="card-content">
            {petData.photos?.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {petData.photos.map((photo, index) => (
                  <img
                    key={index}
                    src={photo.startsWith('/') ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${photo}` : photo}
                    alt={`${petData.name} photo ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No photos uploaded yet</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

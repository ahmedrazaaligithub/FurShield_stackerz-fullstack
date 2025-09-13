import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { petAPI, appointmentAPI } from '../../services/api'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { uploadImageToCloudinary } from '../../utils/uploadImage'
import { useAuth } from '../../contexts/AuthContext'
import { 
  ArrowLeftIcon,
  PencilIcon,
  CalendarIcon,
  HeartIcon,
  PhotoIcon,
  PlusIcon,
  TrashIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
  ShieldCheckIcon,
  HomeIcon,
  StarIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import { cn } from '../../utils/cn'
import toast from 'react-hot-toast'
import VetHealthRecordForm from '../../components/vets/VetHealthRecordForm'
export default function PetDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [isUploading, setIsUploading] = useState(false)
  const [newFeedback, setNewFeedback] = useState('')
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false)
  const [editingFeedback, setEditingFeedback] = useState(null)
  const [editContent, setEditContent] = useState('')
  const [showVetRecordModal, setShowVetRecordModal] = useState(false)
  const isVet = user?.role === 'veterinarian' || user?.role === 'vet'
  const isShelter = user?.role === 'shelter'
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
  const { data: feedbackData, isLoading: feedbackLoading, error: feedbackError } = useQuery({
    queryKey: ['pet-feedback', id],
    queryFn: () => petAPI.getFeedback(id),
    enabled: !!id,
    retry: 3,
    staleTime: 5 * 60 * 1000, 
    cacheTime: 10 * 60 * 1000, 
    onError: (error) => {
      console.error('Failed to fetch feedback:', error)
      if (error.response?.status !== 404) {
        toast.error('Failed to load feedback')
      }
    }
  })
  const feedbacks = feedbackData?.data?.data || []
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
  const uploadPhotoMutation = useMutation({
    mutationFn: async (file) => {
      const photoUrl = await uploadImageToCloudinary(file)
      const updatedPhotos = [...(petData.photos || []), photoUrl]
      return petAPI.updatePet(id, { photos: updatedPhotos })
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pet', id])
      toast.success('Photo uploaded successfully!')
    },
    onError: (error) => {
      console.error('Photo upload error:', error)
      toast.error('Failed to upload photo')
    }
  })
  const deletePhotoMutation = useMutation({
    mutationFn: async (photoIndex) => {
      const updatedPhotos = petData.photos.filter((_, index) => index !== photoIndex)
      return petAPI.updatePet(id, { photos: updatedPhotos })
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pet', id])
      toast.success('Photo deleted successfully!')
    },
    onError: (error) => {
      console.error('Photo deletion error:', error)
      toast.error('Failed to delete photo')
    }
  })
  const handleDeletePet = () => {
    if (window.confirm('Are you sure you want to delete this pet? This action cannot be undone.')) {
      deletePetMutation.mutate(id)
    }
  }
  const handleDeletePhoto = (photoIndex) => {
    if (window.confirm('Are you sure you want to delete this photo?')) {
      deletePhotoMutation.mutate(photoIndex)
    }
  }
  const submitFeedbackMutation = useMutation({
    mutationFn: (feedbackData) => petAPI.submitFeedback(id, feedbackData),
    onSuccess: (response) => {
      queryClient.setQueryData(['pet-feedback', id], (oldData) => {
        const feedbackContent = newFeedback 
        const newFeedbackItem = response?.data?.data || {
          id: Date.now(),
          user: { 
            name: user?.name || 'Anonymous',
            role: user?.role || 'user'
          },
          content: feedbackContent,
          createdAt: new Date().toISOString(),
          type: isVet ? 'professional_advice' : isShelter ? 'care_tip' : 'experience_share'
        }
        if (oldData?.data?.data) {
          return {
            ...oldData,
            data: {
              ...oldData.data,
              data: [newFeedbackItem, ...oldData.data.data]
            }
          }
        }
        return {
          data: {
            data: [newFeedbackItem]
          }
        }
      })
      queryClient.invalidateQueries(['pet-feedback', id])
      setNewFeedback('')
      toast.success('Feedback submitted successfully!')
    },
    onError: (error) => {
      console.error('Failed to submit feedback:', error)
      toast.error('Failed to submit feedback')
    }
  })
  const handleSubmitFeedback = async (e) => {
    e.preventDefault()
    if (!newFeedback.trim()) return
    const feedbackData = {
      content: newFeedback.trim(),
      type: isVet ? 'professional_advice' : isShelter ? 'care_tip' : 'experience_share'
    }
    submitFeedbackMutation.mutate(feedbackData)
  }
  const handleEditFeedback = (feedback) => {
    setEditingFeedback(feedback.id)
    setEditContent(feedback.content)
  }
  const editFeedbackMutation = useMutation({
    mutationFn: ({ feedbackId, content }) => petAPI.updateFeedback(feedbackId, { content }),
    onSuccess: (response, variables) => {
      queryClient.setQueryData(['pet-feedback', id], (oldData) => {
        if (oldData?.data?.data) {
          return {
            ...oldData,
            data: {
              ...oldData.data,
              data: oldData.data.data.map(feedback => 
                feedback.id === variables.feedbackId 
                  ? { ...feedback, content: variables.content, updatedAt: new Date().toISOString() }
                  : feedback
              )
            }
          }
        }
        return oldData
      })
      setEditingFeedback(null)
      setEditContent('')
      toast.success('Feedback updated successfully!')
    },
    onError: (error) => {
      console.error('Failed to update feedback:', error)
      toast.error('Failed to update feedback')
    }
  })
  const handleSaveEdit = async (feedbackId) => {
    if (!editContent.trim()) return
    editFeedbackMutation.mutate({ feedbackId, content: editContent.trim() })
  }
  const handleCancelEdit = () => {
    setEditingFeedback(null)
    setEditContent('')
  }
  const deleteFeedbackMutation = useMutation({
    mutationFn: (feedbackId) => petAPI.deleteFeedback(feedbackId),
    onSuccess: (response, feedbackId) => {
      queryClient.setQueryData(['pet-feedback', id], (oldData) => {
        if (oldData?.data?.data) {
          return {
            ...oldData,
            data: {
              ...oldData.data,
              data: oldData.data.data.filter(feedback => feedback.id !== feedbackId)
            }
          }
        }
        return oldData
      })
      toast.success('Feedback deleted successfully!')
    },
    onError: (error) => {
      console.error('Failed to delete feedback:', error)
      toast.error('Failed to delete feedback')
    }
  })
  const handleDeleteFeedback = async (feedbackId) => {
    if (!window.confirm('Are you sure you want to delete this feedback? This action cannot be undone.')) {
      return
    }
    deleteFeedbackMutation.mutate(feedbackId)
  }
  const getRoleIcon = (role) => {
    switch (role) {
      case 'veterinarian':
      case 'vet':
        return <ShieldCheckIcon className="h-4 w-4" />
      case 'shelter':
        return <HomeIcon className="h-4 w-4" />
      default:
        return <UserIcon className="h-4 w-4" />
    }
  }
  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'veterinarian':
      case 'vet':
        return 'badge-success'
      case 'shelter':
        return 'badge-warning'
      default:
        return 'badge-secondary'
    }
  }
  const getRoleLabel = (role) => {
    switch (role) {
      case 'veterinarian':
      case 'vet':
        return 'Veterinarian'
      case 'shelter':
        return 'Shelter'
      default:
        return 'Pet Owner'
    }
  }
  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return
    setIsUploading(true)
    try {
      const uploadedPhotos = []
      for (const file of files) {
        try {
          const data = await uploadImageToCloudinary(file)
          uploadedPhotos.push(data.secure_url)
        } catch (error) {
          console.error('Upload error:', error)
          toast.error(`Failed to upload ${file.name}`)
        }
      }
      if (uploadedPhotos.length > 0) {
        const currentPhotos = petData.photos || []
        const updatedPhotos = [...currentPhotos, ...uploadedPhotos]
        try {
          await petAPI.updatePet(id, { photos: updatedPhotos })
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
          toast.success(`${uploadedPhotos.length} photo(s) uploaded successfully`)
        } catch (error) {
          console.error('Failed to update pet photos:', error)
          toast.error('Failed to save photos to pet record')
        }
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload photos')
    } finally {
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
    const isAccessDenied = error?.response?.status === 403
    const errorMessage = isAccessDenied 
      ? "You don't have permission to view this pet. You can only access pets you own or have appointments with."
      : "The pet you're looking for doesn't exist or has been removed."
    
    return (
      <div className="text-center py-12">
        <HeartIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {isAccessDenied ? 'Access Denied' : 'Pet not found'}
        </h3>
        <p className="text-gray-600 mb-6">{errorMessage}</p>
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
  const currentVetAppointment = (isVet && Array.isArray(petAppointments)) 
    ? petAppointments.find(a => 
        (a?.vet?._id || a?.vet) === user?.id && ['confirmed', 'in-progress', 'completed'].includes(a?.status)
      )
    : null
  const canVetAddRecord = !!currentVetAppointment
  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'health', name: 'Health Records' },
    { id: 'appointments', name: 'Appointments' },
    { id: 'photos', name: 'Photos' },
    { id: 'feedback', name: 'Feedback & Suggestions' }
  ]
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {}
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
        {!isVet && (
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
        )}
      </div>
      {}
      <div className="card">
        <div className="p-6">
          <div className="flex items-start space-x-6">
            <div className="flex-shrink-0">
              {petData.photos?.[0] ? (
                <img
                  src={petData.photos[0]}
                  alt={petData.name}
                  className="h-32 w-32 rounded-lg object-cover"
                />
              ) : (
                <div className="h-32 w-32 bg-gray-200 rounded-lg flex items-center justify-center">
                  <PhotoIcon className="h-16 w-16 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-4">
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
              {}
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <StarIconSolid
                        key={star}
                        className={cn(
                          'h-5 w-5',
                          star <= (petData.averageRating || 0) ? 'text-yellow-400' : 'text-gray-300'
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-lg font-semibold text-gray-900">
                    {petData.averageRating || 0}/5
                  </span>
                  <span className="text-sm text-gray-600">
                    ({petData.totalRatings || 0} reviews)
                  </span>
                </div>
                <button className="btn btn-outline btn-sm ml-auto">
                  <StarIcon className="h-4 w-4 mr-2" />
                  Rate This Pet
                </button>
              </div>
            </div>
          </div>
          {}
          {petData.owner && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {petData.owner.avatar ? (
                      <img
                        src={petData.owner.avatar}
                        alt={petData.owner.name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <UserIcon className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-lg font-semibold text-gray-900">
                        {petData.owner.name}
                      </h4>
                      <span className={cn(
                        'badge badge-sm',
                        petData.owner.role === 'veterinarian' ? 'badge-success' :
                        petData.owner.role === 'shelter' ? 'badge-warning' :
                        'badge-secondary'
                      )}>
                        {petData.owner.role === 'veterinarian' ? 'Veterinarian' :
                         petData.owner.role === 'shelter' ? 'Shelter' :
                         'Pet Owner'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-sm text-gray-500">
                        {petData.owner.totalPets || 1} pet{(petData.owner.totalPets || 1) !== 1 ? 's' : ''}
                      </span>
                      {petData.owner.joinedDate && (
                        <span className="text-sm text-gray-500">
                          Member since {new Date(petData.owner.joinedDate).getFullYear()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/profile/${petData.owner._id}`)}
                  className="btn btn-outline btn-sm"
                >
                  <EyeIcon className="h-4 w-4 mr-2" />
                  View Profile
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {}
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
      {}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {}
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
          {}
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
      {}
      {showVetRecordModal && (
        <VetHealthRecordForm
          pet={petData}
          appointment={currentVetAppointment || { scheduledDate: new Date().toISOString() }}
          onClose={() => setShowVetRecordModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries(['pet-health-records', id])
          }}
        />
      )}
      {activeTab === 'health' && (
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Health Records</h3>
              {!isVet && user?.id === petData.owner?._id && (
                <button className="btn btn-primary btn-sm">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Record
                </button>
              )}
              {isVet && canVetAddRecord && (
                <button
                  onClick={() => setShowVetRecordModal(true)}
                  className="btn btn-primary btn-sm"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Health Record
                </button>
              )}
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
              {!isVet && user?.id === petData.owner?._id && (
                <Link
                  to={`/appointments/book?petId=${id}`}
                  className="btn btn-primary btn-sm"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Book Appointment
                </Link>
              )}
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
                      {new Date(appointment.appointmentDate || appointment.scheduledDate).toLocaleDateString()} at{' '}
                      {new Date(appointment.appointmentDate || appointment.scheduledDate).toLocaleTimeString([], { 
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
              {!isVet && user?.id === petData.owner?._id && (
                <label className="btn btn-primary btn-sm cursor-pointer">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  {isUploading ? 'Uploading...' : 'Add Photos'}
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
          <div className="card-content">
            {petData.photos?.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {petData.photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo}
                      alt={`${petData.name} photo ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    {!isVet && user?.id === petData.owner?._id && (
                      <button
                        onClick={() => handleDeletePhoto(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
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

      {activeTab === 'feedback' && (
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">
                {isVet ? 'Professional Advice' : isShelter ? 'Care Tips' : 'Share Your Experience'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {isVet 
                  ? 'Provide professional medical advice and recommendations'
                  : isShelter 
                    ? 'Share care tips and shelter experience'
                    : 'Share your experience and tips with other pet owners'
                }
              </p>
            </div>
            <div className="card-content">
              <form onSubmit={handleSubmitFeedback} className="space-y-4">
                <div>
                  <textarea
                    value={newFeedback}
                    onChange={(e) => setNewFeedback(e.target.value)}
                    placeholder={
                      isVet 
                        ? 'Provide professional advice, treatment recommendations, or health observations...'
                        : isShelter
                          ? 'Share care tips, behavioral insights, or shelter experience...'
                          : 'Share your experience, tips, or ask questions...'
                    }
                    className="input min-h-24 resize-y"
                    required
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getRoleIcon(user?.role)}
                    <span className={cn('badge', getRoleBadgeClass(user?.role))}>
                      {getRoleLabel(user?.role)}
                    </span>
                  </div>
                  <button
                    type="submit"
                    disabled={submitFeedbackMutation.isPending || !newFeedback.trim()}
                    className="btn btn-primary"
                  >
                    {submitFeedbackMutation.isPending ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                </div>
              </form>
            </div>
          </div>
          {}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">
                Community Feedback ({feedbacks.length})
              </h3>
            </div>
            <div className="card-content">
              {feedbackLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="md" />
                </div>
              ) : feedbacks.length > 0 ? (
                <div className="space-y-4">
                  {feedbacks.map((feedback) => (
                    <div key={feedback.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            {getRoleIcon(feedback.user.role)}
                            <span className="font-medium text-gray-900">
                              {feedback.user.name}
                            </span>
                            <span className={cn('badge badge-sm', getRoleBadgeClass(feedback.user.role))}>
                              {getRoleLabel(feedback.user.role)}
                            </span>
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(feedback.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="mb-3">
                        {editingFeedback === feedback.id ? (
                          <div className="space-y-3">
                            <textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="input min-h-20 resize-y w-full"
                              placeholder="Edit your feedback..."
                            />
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleSaveEdit(feedback.id)}
                                disabled={!editContent.trim()}
                                className="btn btn-primary btn-sm"
                              >
                                Save
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="btn btn-outline btn-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-700 leading-relaxed">
                            {feedback.content}
                            {feedback.updatedAt && (
                              <span className="text-xs text-gray-400 ml-2">(edited)</span>
                            )}
                          </p>
                        )}
                      </div>
                      {}
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          'badge badge-sm',
                          feedback.type === 'professional_advice' ? 'badge-success' :
                          feedback.type === 'care_tip' ? 'badge-warning' :
                          'badge-info'
                        )}>
                          {feedback.type === 'professional_advice' ? '🩺 Professional Advice' :
                           feedback.type === 'care_tip' ? '🏠 Care Tip' :
                           '💭 Experience Share'}
                        </span>
                        {}
                        {feedback.user.name === user?.name && editingFeedback !== feedback.id && (
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => handleEditFeedback(feedback)}
                              className="text-gray-400 hover:text-gray-600 text-sm transition-colors"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteFeedback(feedback.id)}
                              className="text-red-400 hover:text-red-600 text-sm transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No feedback yet</h4>
                  <p className="text-gray-500">Be the first to share advice or experience about this pet!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
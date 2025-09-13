import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { petAPI, userAPI, appointmentAPI } from '../../services/api'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { 
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
const appointmentTypes = [
  { value: 'checkup', label: 'Regular Checkup', duration: 30 },
  { value: 'vaccination', label: 'Vaccination', duration: 15 },
  { value: 'emergency', label: 'Emergency', duration: 60 },
  { value: 'surgery', label: 'Surgery Consultation', duration: 45 },
  { value: 'consultation', label: 'General Consultation', duration: 30 },
  { value: 'dental', label: 'Dental Care', duration: 45 },
  { value: 'grooming', label: 'Grooming', duration: 60 }
]
export default function BookAppointmentPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselectedPetId = searchParams.get('petId')
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    petId: preselectedPetId || '',
    vetId: '',
    type: '',
    reason: '',
    preferredDate: '',
    preferredTime: '',
    notes: ''
  })
  const [errors, setErrors] = useState({})
  const [showAllVets, setShowAllVets] = useState(false)
  const [filters, setFilters] = useState({
    location: '',
    condition: '',
    specialization: '',
    radius: '25',
    verified: 'true'
  })
  const [userLocation, setUserLocation] = useState(null)
  const { data: pets } = useQuery({
    queryKey: ['pets'],
    queryFn: () => petAPI.getPets()
  })
  const { data: vets, refetch: refetchVets } = useQuery({
    queryKey: ['vets', filters],
    queryFn: () => {
      const params = { ...filters }
      if (userLocation && filters.radius) {
        params.latitude = userLocation.latitude
        params.longitude = userLocation.longitude
      }
      return userAPI.getVets(params)
    }
  })
  const bookAppointmentMutation = useMutation({
    mutationFn: appointmentAPI.createAppointment,
    onSuccess: (data) => {
      toast.success('Appointment booked successfully!')
      navigate(`/appointments/${data.data.data._id}`)
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to book appointment')
    }
  })
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }
  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
  }
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
          toast.success('Location detected! Showing nearby vets.')
        },
        (error) => {
          toast.error('Unable to get your location. Please enter manually.')
        }
      )
    } else {
      toast.error('Geolocation is not supported by this browser.')
    }
  }
  const validateForm = () => {
    const newErrors = {}
    if (!formData.petId) newErrors.petId = 'Please select a pet'
    if (!formData.vetId) newErrors.vetId = 'Please select a veterinarian'
    if (!formData.type) newErrors.type = 'Please select appointment type'
    if (!formData.reason.trim()) newErrors.reason = 'Please provide a reason for the visit'
    if (!formData.preferredDate) newErrors.preferredDate = 'Please select a preferred date'
    if (!formData.preferredTime) newErrors.preferredTime = 'Please select a preferred time'
    if (formData.preferredDate) {
      const selectedDate = new Date(formData.preferredDate + 'T' + formData.preferredTime)
      if (selectedDate <= new Date()) {
        newErrors.preferredDate = 'Please select a future date and time'
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    const appointmentData = {
      ...formData,
      scheduledDate: new Date(formData.preferredDate + 'T' + formData.preferredTime).toISOString(),
      estimatedDuration: appointmentTypes.find(t => t.value === formData.type)?.duration || 30
    }
    bookAppointmentMutation.mutate(appointmentData)
  }
  const isVeterinarian = user?.role === 'veterinarian'
  useEffect(() => {
    if (isVeterinarian) {
      toast.error('Veterinarians cannot book appointments. You can view other veterinarian profiles instead.')
      navigate('/vets') 
    }
  }, [isVeterinarian, navigate])
  const selectedType = appointmentTypes.find(t => t.value === formData.type)
  const userPets = pets?.data?.data || []
  const availableVets = vets?.data?.data || []
  const displayedVets = showAllVets ? availableVets : availableVets.slice(0, 2)
  if (isVeterinarian) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <UserIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
        <p className="text-gray-600 mb-6">
          As a veterinarian, you cannot book appointments. You can view other veterinarian profiles, reviews, and connect with colleagues.
        </p>
        <button
          onClick={() => navigate('/vets')}
          className="btn btn-primary"
        >
          View Veterinarian Directory
        </button>
      </div>
    )
  }
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/appointments')}
          className="btn btn-ghost p-2"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Book Appointment</h1>
          <p className="text-gray-600">Schedule a visit with a veterinarian</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        {}
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900">Select Pet</h2>
          </div>
          <div className="card-content">
            <div>
              <label className="label">Pet *</label>
              <select
                name="petId"
                value={formData.petId}
                onChange={handleInputChange}
                className={`input ${errors.petId ? 'border-red-300' : ''}`}
              >
                <option value="">Select a pet</option>
                {userPets.map(pet => (
                  <option key={pet._id} value={pet._id}>
                    {pet.name} ({pet.species} - {pet.breed})
                  </option>
                ))}
              </select>
              {errors.petId && <p className="mt-1 text-sm text-red-600">{errors.petId}</p>}
            </div>
          </div>
        </div>
        {}
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900">Find Veterinarians</h2>
          </div>
          <div className="card-content space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="label">Location</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    name="location"
                    value={filters.location}
                    onChange={handleFilterChange}
                    placeholder="City, area, or address"
                    className="input flex-1"
                  />
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    className="btn btn-outline px-3"
                    title="Use current location"
                  >
                    📍
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Condition/Symptom</label>
                <select
                  name="condition"
                  value={filters.condition}
                  onChange={handleFilterChange}
                  className="input"
                >
                  <option value="">All conditions</option>
                  <option value="skin">Skin problems</option>
                  <option value="dental">Dental issues</option>
                  <option value="surgery">Surgery needed</option>
                  <option value="emergency">Emergency care</option>
                  <option value="cardiology">Heart problems</option>
                  <option value="orthopedic">Bone/joint issues</option>
                  <option value="oncology">Cancer treatment</option>
                  <option value="neurology">Neurological issues</option>
                  <option value="ophthalmology">Eye problems</option>
                  <option value="reproduction">Breeding/reproduction</option>
                  <option value="behavior">Behavioral issues</option>
                  <option value="exotic">Exotic pets</option>
                </select>
              </div>
              <div>
                <label className="label">Specialization</label>
                <input
                  type="text"
                  name="specialization"
                  value={filters.specialization}
                  onChange={handleFilterChange}
                  placeholder="e.g., Surgery, Dermatology"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Distance (km)</label>
                <select
                  name="radius"
                  value={filters.radius}
                  onChange={handleFilterChange}
                  className="input"
                >
                  <option value="5">Within 5 km</option>
                  <option value="10">Within 10 km</option>
                  <option value="25">Within 25 km</option>
                  <option value="50">Within 50 km</option>
                  <option value="100">Within 100 km</option>
                </select>
              </div>
              <div>
                <label className="label">Verification</label>
                <select
                  name="verified"
                  value={filters.verified}
                  onChange={handleFilterChange}
                  className="input"
                >
                  <option value="">All vets</option>
                  <option value="true">Verified only</option>
                </select>
              </div>
            </div>
            {userLocation && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800">
                  📍 Using your current location to show nearby veterinarians
                </p>
              </div>
            )}
          </div>
        </div>
        {}
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900">Select Veterinarian</h2>
          </div>
          <div className="card-content">
            <div className="space-y-4">
              <label className="label">Veterinarian *</label>
              {errors.vetId && <p className="text-sm text-red-600 mb-2">{errors.vetId}</p>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayedVets.map(vet => (
                  <div
                    key={vet._id}
                    onClick={() => handleInputChange({ target: { name: 'vetId', value: vet._id } })}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      formData.vetId === vet._id 
                        ? 'border-primary-500 bg-primary-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        {vet.avatar ? (
                          <img
                            src={vet.avatar}
                            alt={`Dr. ${vet.name}`}
                            className="h-16 w-16 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center">
                            <UserIcon className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Dr. {vet.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {vet.profile?.specialization || 'General Practice'}
                        </p>
                        {vet.profile?.experience && (
                          <p className="text-sm text-gray-500 mb-1">
                            {vet.profile.experience} years experience
                          </p>
                        )}
                        {vet.distance && (
                          <p className="text-sm text-blue-600 mb-1">
                            📍 {vet.distance} km away
                          </p>
                        )}
                        {vet.profile?.consultationFee && (
                          <p className="text-sm text-green-600 mb-1">
                            💰 ₹{vet.profile.consultationFee} consultation fee
                          </p>
                        )}
                        {vet.rating && (
                          <div className="flex items-center mb-2">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <svg
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < Math.floor(vet.rating) ? 'text-yellow-400' : 'text-gray-300'
                                  }`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                              <span className="ml-1 text-sm text-gray-600">
                                {vet.rating} ({vet.reviewCount || 0} reviews)
                              </span>
                            </div>
                          </div>
                        )}
                        {vet.bio && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {vet.bio}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-1">
                          {vet.profile?.languages && vet.profile.languages.map((lang, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {lang}
                            </span>
                          ))}
                          {vet.profile?.conditions && vet.profile.conditions.slice(0, 3).map((condition, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {condition}
                            </span>
                          ))}
                        </div>
                      </div>
                      {formData.vetId === vet._id && (
                        <div className="flex-shrink-0">
                          <div className="h-6 w-6 bg-primary-500 rounded-full flex items-center justify-center">
                            <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {availableVets.length === 0 && (
                <div className="text-center py-8">
                  <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No veterinarians available at the moment</p>
                </div>
              )}
              {}
              {availableVets.length > 2 && (
                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={() => setShowAllVets(!showAllVets)}
                    className="text-primary-600 hover:text-primary-700 font-medium text-sm transition-colors"
                  >
                    {showAllVets ? (
                      <>Show Less Veterinarians</>
                    ) : (
                      <>Show All Veterinarians ({availableVets.length})</>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        {}
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900">Appointment Details</h2>
          </div>
          <div className="card-content space-y-4">
            <div>
              <label className="label">Appointment Type *</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className={`input ${errors.type ? 'border-red-300' : ''}`}
              >
                <option value="">Select appointment type</option>
                {appointmentTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label} ({type.duration} min)
                  </option>
                ))}
              </select>
              {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type}</p>}
            </div>
            <div>
              <label className="label">Reason for Visit *</label>
              <textarea
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                rows={3}
                className={`textarea ${errors.reason ? 'border-red-300' : ''}`}
                placeholder="Describe the reason for this appointment..."
              />
              {errors.reason && <p className="mt-1 text-sm text-red-600">{errors.reason}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Preferred Date *</label>
                <input
                  type="date"
                  name="preferredDate"
                  value={formData.preferredDate}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  className={`input ${errors.preferredDate ? 'border-red-300' : ''}`}
                />
                {errors.preferredDate && <p className="mt-1 text-sm text-red-600">{errors.preferredDate}</p>}
              </div>
              <div>
                <label className="label">Preferred Time *</label>
                <input
                  type="time"
                  name="preferredTime"
                  value={formData.preferredTime}
                  onChange={handleInputChange}
                  className={`input ${errors.preferredTime ? 'border-red-300' : ''}`}
                />
                {errors.preferredTime && <p className="mt-1 text-sm text-red-600">{errors.preferredTime}</p>}
              </div>
            </div>
            <div>
              <label className="label">Additional Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="textarea"
                placeholder="Any additional information or special requests..."
              />
            </div>
          </div>
        </div>
        {}
        {selectedType && formData.preferredDate && formData.preferredTime && (
          <div className="card bg-primary-50 border-primary-200">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-primary-900">Appointment Summary</h3>
            </div>
            <div className="card-content">
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-primary-800">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  <span>
                    {new Date(formData.preferredDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex items-center text-primary-800">
                  <ClockIcon className="h-4 w-4 mr-2" />
                  <span>
                    {new Date('2000-01-01T' + formData.preferredTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })} ({selectedType.duration} minutes)
                  </span>
                </div>
                <div className="flex items-center text-primary-800">
                  <UserIcon className="h-4 w-4 mr-2" />
                  <span>{selectedType.label}</span>
                </div>
              </div>
            </div>
          </div>
        )}
        {}
        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={bookAppointmentMutation.isPending}
            className="btn btn-primary btn-lg flex-1"
          >
            {bookAppointmentMutation.isPending ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : null}
            {bookAppointmentMutation.isPending ? 'Booking...' : 'Book Appointment'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/appointments')}
            className="btn btn-outline btn-lg"
          >
            Cancel
          </button>
        </div>
      </form>
      {}
      <div className="card bg-gray-50">
        <div className="card-content">
          <h4 className="font-medium text-gray-900 mb-2">Important Information</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Appointments are subject to veterinarian availability</li>
            <li>• You will receive a confirmation email once approved</li>
            <li>• Please arrive 10 minutes early for your appointment</li>
            <li>• Bring any relevant medical records or medications</li>
            <li>• Cancellations must be made at least 24 hours in advance</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
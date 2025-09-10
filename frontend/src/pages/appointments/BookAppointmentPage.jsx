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

  const { data: pets } = useQuery({
    queryKey: ['pets'],
    queryFn: () => petAPI.getPets()
  })

  const { data: vets } = useQuery({
    queryKey: ['vets'],
    queryFn: () => userAPI.getVets()
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

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.petId) newErrors.petId = 'Please select a pet'
    if (!formData.vetId) newErrors.vetId = 'Please select a veterinarian'
    if (!formData.type) newErrors.type = 'Please select appointment type'
    if (!formData.reason.trim()) newErrors.reason = 'Please provide a reason for the visit'
    if (!formData.preferredDate) newErrors.preferredDate = 'Please select a preferred date'
    if (!formData.preferredTime) newErrors.preferredTime = 'Please select a preferred time'
    
    // Check if date is in the future
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

  const selectedType = appointmentTypes.find(t => t.value === formData.type)
  const userPets = pets?.data?.data || []
  const availableVets = vets?.data?.data || []

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
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
        {/* Pet Selection */}
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

        {/* Veterinarian Selection */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900">Select Veterinarian</h2>
          </div>
          <div className="card-content">
            <div>
              <label className="label">Veterinarian *</label>
              <select
                name="vetId"
                value={formData.vetId}
                onChange={handleInputChange}
                className={`input ${errors.vetId ? 'border-red-300' : ''}`}
              >
                <option value="">Select a veterinarian</option>
                {availableVets.map(vet => (
                  <option key={vet._id} value={vet._id}>
                    Dr. {vet.name} - {vet.specialization || 'General Practice'}
                  </option>
                ))}
              </select>
              {errors.vetId && <p className="mt-1 text-sm text-red-600">{errors.vetId}</p>}
            </div>
          </div>
        </div>

        {/* Appointment Details */}
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

        {/* Appointment Summary */}
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

        {/* Submit Buttons */}
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

      {/* Information */}
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

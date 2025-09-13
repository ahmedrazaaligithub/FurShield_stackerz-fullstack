import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { petAPI } from '../../services/api'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { uploadImageToCloudinary } from '../../utils/uploadImage'
import { 
  ArrowLeftIcon,
  PhotoIcon,
  PlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
const species = [
  'dog', 'cat', 'bird', 'rabbit', 'fish', 'reptile', 'hamster', 'guinea-pig', 'other'
]
const healthStatuses = [
  { value: 'healthy', label: 'Healthy', color: 'text-green-600' },
  { value: 'needs-attention', label: 'Needs Attention', color: 'text-yellow-600' },
  { value: 'critical', label: 'Critical', color: 'text-red-600' }
]
export default function AddPetPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = Boolean(id)
  const [formData, setFormData] = useState({
    name: '',
    species: '',
    breed: '',
    age: '',
    weight: '',
    color: '',
    gender: '',
    healthStatus: 'healthy',
    medicalConditions: [],
    allergies: [],
    medications: [],
    vetContact: '',
    microchipId: '',
    notes: ''
  })
  const [photos, setPhotos] = useState([])
  const [newCondition, setNewCondition] = useState('')
  const [newAllergy, setNewAllergy] = useState('')
  const [newMedication, setNewMedication] = useState('')
  const [errors, setErrors] = useState({})
  const createPetMutation = useMutation({
    mutationFn: petAPI.createPet,
    onSuccess: (data) => {
      toast.success('Pet added successfully!')
      navigate(`/pets/${data.data.data._id}`)
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to add pet')
    }
  })
  const updatePetMutation = useMutation({
    mutationFn: ({ id, data }) => petAPI.updatePet(id, data),
    onSuccess: (data) => {
      toast.success('Pet updated successfully!')
      navigate(`/pets/${data.data.data._id}`)
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update pet')
    }
  })
  useEffect(() => {
    if (isEditing && id) {
      setFormData({
        name: 'Buddy',
        species: 'dog',
        breed: 'Golden Retriever',
        age: '3',
        weight: '25',
        color: 'Golden',
        gender: 'male',
        healthStatus: 'healthy',
        medicalConditions: ['Hip Dysplasia'],
        allergies: ['Chicken'],
        medications: ['Glucosamine supplements (daily)'],
        vetContact: 'Dr. Smith - (555) 123-4567',
        microchipId: 'ABC123456789',
        notes: 'Very friendly and energetic dog. Loves playing fetch.'
      })
    }
  }, [isEditing, id])
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }
  const handlePhotoChange = async (e) => {
    const files = Array.from(e.target.files)
    for (const file of files) {
      try {
        const data = await uploadImageToCloudinary(file)
        setPhotos(prev => [...prev, {
          url: data.secure_url,
          public_id: data.public_id,
          name: file.name
        }])
        toast.success('Photo uploaded successfully')
      } catch (error) {
        console.error('Upload error:', error)
        toast.error('Failed to upload photo')
      }
    }
  }
  const removePhoto = (index) => {
    const photoToRemove = photos[index]
    if (photoToRemove && photoToRemove.preview && photoToRemove.preview.startsWith('blob:')) {
      URL.revokeObjectURL(photoToRemove.preview)
    }
    setPhotos(prev => prev.filter((_, i) => i !== index))
  }
  const addCondition = () => {
    if (newCondition.trim() && !formData.medicalConditions.includes(newCondition.trim())) {
      setFormData(prev => ({
        ...prev,
        medicalConditions: [...prev.medicalConditions, newCondition.trim()]
      }))
      setNewCondition('')
    }
  }
  const removeCondition = (condition) => {
    setFormData(prev => ({
      ...prev,
      medicalConditions: prev.medicalConditions.filter(c => c !== condition)
    }))
  }
  const addAllergy = () => {
    if (newAllergy.trim() && !formData.allergies.includes(newAllergy.trim())) {
      setFormData(prev => ({
        ...prev,
        allergies: [...prev.allergies, newAllergy.trim()]
      }))
      setNewAllergy('')
    }
  }
  const removeAllergy = (allergy) => {
    setFormData(prev => ({
      ...prev,
      allergies: prev.allergies.filter(a => a !== allergy)
    }))
  }
  const addMedication = () => {
    if (newMedication.trim() && !formData.medications.includes(newMedication.trim())) {
      setFormData(prev => ({
        ...prev,
        medications: [...prev.medications, newMedication.trim()]
      }))
      setNewMedication('')
    }
  }
  const removeMedication = (medication) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.filter(m => m !== medication)
    }))
  }
  const validateForm = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = 'Pet name is required'
    if (!formData.species) newErrors.species = 'Species is required'
    if (!formData.breed.trim()) newErrors.breed = 'Breed is required'
    if (!formData.age || formData.age < 0) newErrors.age = 'Valid age is required'
    if (!formData.gender) newErrors.gender = 'Gender is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    const petData = {
      ...formData,
      age: parseInt(formData.age),
      weight: formData.weight ? parseFloat(formData.weight) : undefined,
      photos: photos.map(photo => photo.url)
    }
    if (isEditing) {
      updatePetMutation.mutate({ id, data: petData })
    } else {
      createPetMutation.mutate(petData)
    }
  }
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/pets')}
          className="btn btn-ghost p-2"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isEditing ? 'Edit Pet' : 'Add New Pet'}</h1>
          <p className="text-gray-600">Register your pet and start tracking their health</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-8">
        {}
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
          </div>
          <div className="card-content">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">Pet Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`input ${errors.name ? 'border-red-300' : ''}`}
                  placeholder="Enter your pet's name"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>
              <div>
                <label className="label">Species *</label>
                <select
                  name="species"
                  value={formData.species}
                  onChange={handleInputChange}
                  className={`input ${errors.species ? 'border-red-300' : ''}`}
                >
                  <option value="">Select species</option>
                  {species.map(s => (
                    <option key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}
                    </option>
                  ))}
                </select>
                {errors.species && <p className="mt-1 text-sm text-red-600">{errors.species}</p>}
              </div>
              <div>
                <label className="label">Breed *</label>
                <input
                  type="text"
                  name="breed"
                  value={formData.breed}
                  onChange={handleInputChange}
                  className={`input ${errors.breed ? 'border-red-300' : ''}`}
                  placeholder="Enter breed"
                />
                {errors.breed && <p className="mt-1 text-sm text-red-600">{errors.breed}</p>}
              </div>
              <div>
                <label className="label">Age (years) *</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  className={`input ${errors.age ? 'border-red-300' : ''}`}
                  placeholder="Enter age"
                  min="0"
                  step="0.1"
                />
                {errors.age && <p className="mt-1 text-sm text-red-600">{errors.age}</p>}
              </div>
              <div>
                <label className="label">Weight (lbs)</label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Enter weight"
                  min="0"
                  step="0.1"
                />
              </div>
              <div>
                <label className="label">Gender *</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className={`input ${errors.gender ? 'border-red-300' : ''}`}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
                {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender}</p>}
              </div>
              <div>
                <label className="label">Color/Markings</label>
                <input
                  type="text"
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Describe color and markings"
                />
              </div>
              <div>
                <label className="label">Health Status</label>
                <select
                  name="healthStatus"
                  value={formData.healthStatus}
                  onChange={handleInputChange}
                  className="input"
                >
                  {healthStatuses.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
        {}
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900">Photos</h2>
          </div>
          <div className="card-content">
            <div className="space-y-4">
              <div>
                <label className="label">Upload Photos</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <div className="space-y-2">
                    <p className="text-gray-600">Upload photos of your pet</p>
                    <label className="btn btn-outline cursor-pointer">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                      Choose Files
                    </label>
                  </div>
                </div>
              </div>
              {photos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative">
                      <img
                        src={photo.url}
                        alt={`Pet photo ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900">Medical Information</h2>
          </div>
          <div className="card-content space-y-6">
            <div>
              <label className="label">Medical Conditions</label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={newCondition}
                  onChange={(e) => setNewCondition(e.target.value)}
                  className="input flex-1"
                  placeholder="Add medical condition"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCondition())}
                />
                <button
                  type="button"
                  onClick={addCondition}
                  className="btn btn-outline"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>
              {formData.medicalConditions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.medicalConditions.map((condition, index) => (
                    <span key={index} className="badge badge-secondary flex items-center">
                      {condition}
                      <button
                        type="button"
                        onClick={() => removeCondition(condition)}
                        className="ml-2 text-gray-500 hover:text-gray-700"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            {}
            <div>
              <label className="label">Allergies</label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                  className="input flex-1"
                  placeholder="Add allergy"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergy())}
                />
                <button
                  type="button"
                  onClick={addAllergy}
                  className="btn btn-outline"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>
              {formData.allergies.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.allergies.map((allergy, index) => (
                    <span key={index} className="badge badge-warning flex items-center">
                      {allergy}
                      <button
                        type="button"
                        onClick={() => removeAllergy(allergy)}
                        className="ml-2 text-gray-500 hover:text-gray-700"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            {}
            <div>
              <label className="label">Current Medications</label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={newMedication}
                  onChange={(e) => setNewMedication(e.target.value)}
                  className="input flex-1"
                  placeholder="Add medication"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMedication())}
                />
                <button
                  type="button"
                  onClick={addMedication}
                  className="btn btn-outline"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>
              {formData.medications.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.medications.map((medication, index) => (
                    <span key={index} className="badge badge-primary flex items-center">
                      {medication}
                      <button
                        type="button"
                        onClick={() => removeMedication(medication)}
                        className="ml-2 text-gray-500 hover:text-gray-700"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">Veterinarian Contact</label>
                <input
                  type="text"
                  name="vetContact"
                  value={formData.vetContact}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Vet name or clinic"
                />
              </div>
              <div>
                <label className="label">Microchip ID</label>
                <input
                  type="text"
                  name="microchipId"
                  value={formData.microchipId}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Enter microchip ID"
                />
              </div>
            </div>
            <div>
              <label className="label">Additional Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={4}
                className="textarea"
                placeholder="Any additional information about your pet..."
              />
            </div>
          </div>
        </div>
        {}
        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={createPetMutation.isPending || updatePetMutation.isPending}
            className="btn btn-primary btn-lg"
          >
            {(createPetMutation.isPending || updatePetMutation.isPending) ? (
              <LoadingSpinner size="sm" />
            ) : (
              isEditing ? 'Update Pet' : 'Add Pet'
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate('/pets')}
            className="btn btn-outline btn-lg"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { adoptionAPI } from '../../services/api'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { 
  ArrowLeftIcon,
  PhotoIcon,
  PlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function CreateListingPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    species: '',
    breed: '',
    age: '',
    gender: '',
    size: '',
    weight: '',
    color: '',
    temperament: [],
    goodWith: [],
    specialNeeds: false,
    specialNeedsDescription: '',
    medicalHistory: '',
    adoptionFee: '',
    photos: [],
    adoptionRequirements: []
  })
  const [errors, setErrors] = useState({})
  const [newTemperament, setNewTemperament] = useState('')
  const [newGoodWith, setNewGoodWith] = useState('')
  const [newRequirement, setNewRequirement] = useState('')

  const createListingMutation = useMutation({
    mutationFn: adoptionAPI.createListing,
    onSuccess: (data) => {
      toast.success('Adoption listing created successfully!')
      navigate(`/adoption/${data.data.data._id}`)
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to create listing')
    }
  })

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const addToArray = (field, value, setValue) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()]
      }))
      setValue('')
    }
  }

  const removeFromArray = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.title.trim()) newErrors.title = 'Title is required'
    if (!formData.description.trim()) newErrors.description = 'Description is required'
    if (!formData.species) newErrors.species = 'Species is required'
    if (!formData.age) newErrors.age = 'Age is required'
    if (!formData.gender) newErrors.gender = 'Gender is required'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    createListingMutation.mutate(formData)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/adoption')}
          className="btn btn-ghost p-2"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Adoption Listing</h1>
          <p className="text-gray-600">Help a pet find their forever home</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
          </div>
          <div className="card-content space-y-4">
            <div>
              <label className="label">Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={`input ${errors.title ? 'border-red-300' : ''}`}
                placeholder="e.g., Friendly Golden Retriever Looking for Love"
              />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
            </div>

            <div>
              <label className="label">Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className={`textarea ${errors.description ? 'border-red-300' : ''}`}
                placeholder="Tell potential adopters about this pet's personality, habits, and what makes them special..."
              />
              {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">Species *</label>
                <select
                  name="species"
                  value={formData.species}
                  onChange={handleInputChange}
                  className={`input ${errors.species ? 'border-red-300' : ''}`}
                >
                  <option value="">Select species</option>
                  <option value="dog">Dog</option>
                  <option value="cat">Cat</option>
                  <option value="bird">Bird</option>
                  <option value="rabbit">Rabbit</option>
                  <option value="other">Other</option>
                </select>
                {errors.species && <p className="mt-1 text-sm text-red-600">{errors.species}</p>}
              </div>

              <div>
                <label className="label">Age *</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  className={`input ${errors.age ? 'border-red-300' : ''}`}
                  placeholder="Age in years"
                  min="0"
                  max="30"
                />
                {errors.age && <p className="mt-1 text-sm text-red-600">{errors.age}</p>}
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">Breed</label>
                <input
                  type="text"
                  name="breed"
                  value={formData.breed}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="e.g., Golden Retriever"
                />
              </div>

              <div>
                <label className="label">Size</label>
                <select
                  name="size"
                  value={formData.size}
                  onChange={handleInputChange}
                  className="input"
                >
                  <option value="">Select size</option>
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                  <option value="extra-large">Extra Large</option>
                </select>
              </div>

              <div>
                <label className="label">Weight (lbs)</label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Weight in pounds"
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="label">Color</label>
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleInputChange}
                className="input"
                placeholder="e.g., Golden, Black and White"
              />
            </div>
          </div>
        </div>

        {/* Temperament & Behavior */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900">Temperament & Behavior</h2>
          </div>
          <div className="card-content space-y-4">
            <div>
              <label className="label">Temperament Traits</label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={newTemperament}
                  onChange={(e) => setNewTemperament(e.target.value)}
                  className="input flex-1"
                  placeholder="e.g., Friendly, Energetic, Calm"
                />
                <button
                  type="button"
                  onClick={() => addToArray('temperament', newTemperament, setNewTemperament)}
                  className="btn btn-outline"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.temperament.map((trait, index) => (
                  <span key={index} className="badge badge-primary flex items-center">
                    {trait}
                    <button
                      type="button"
                      onClick={() => removeFromArray('temperament', index)}
                      className="ml-1"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Good With</label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={newGoodWith}
                  onChange={(e) => setNewGoodWith(e.target.value)}
                  className="input flex-1"
                  placeholder="e.g., Children, Dogs, Cats"
                />
                <button
                  type="button"
                  onClick={() => addToArray('goodWith', newGoodWith, setNewGoodWith)}
                  className="btn btn-outline"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.goodWith.map((item, index) => (
                  <span key={index} className="badge badge-success flex items-center">
                    {item}
                    <button
                      type="button"
                      onClick={() => removeFromArray('goodWith', index)}
                      className="ml-1"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Medical Information */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900">Medical Information</h2>
          </div>
          <div className="card-content space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="specialNeeds"
                checked={formData.specialNeeds}
                onChange={handleInputChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm text-gray-900">
                This pet has special needs
              </label>
            </div>

            {formData.specialNeeds && (
              <div>
                <label className="label">Special Needs Description</label>
                <textarea
                  name="specialNeedsDescription"
                  value={formData.specialNeedsDescription}
                  onChange={handleInputChange}
                  rows={3}
                  className="textarea"
                  placeholder="Describe the special needs and care requirements..."
                />
              </div>
            )}

            <div>
              <label className="label">Medical History</label>
              <textarea
                name="medicalHistory"
                value={formData.medicalHistory}
                onChange={handleInputChange}
                rows={3}
                className="textarea"
                placeholder="Include vaccination history, spay/neuter status, any medical conditions..."
              />
            </div>
          </div>
        </div>

        {/* Adoption Details */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900">Adoption Details</h2>
          </div>
          <div className="card-content space-y-4">
            <div>
              <label className="label">Adoption Fee ($)</label>
              <input
                type="number"
                name="adoptionFee"
                value={formData.adoptionFee}
                onChange={handleInputChange}
                className="input"
                placeholder="0"
                min="0"
              />
            </div>

            <div>
              <label className="label">Adoption Requirements</label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={newRequirement}
                  onChange={(e) => setNewRequirement(e.target.value)}
                  className="input flex-1"
                  placeholder="e.g., Fenced yard required, No small children"
                />
                <button
                  type="button"
                  onClick={() => addToArray('adoptionRequirements', newRequirement, setNewRequirement)}
                  className="btn btn-outline"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2">
                {formData.adoptionRequirements.map((requirement, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">{requirement}</span>
                    <button
                      type="button"
                      onClick={() => removeFromArray('adoptionRequirements', index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={createListingMutation.isPending}
            className="btn btn-primary btn-lg flex-1"
          >
            {createListingMutation.isPending ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : null}
            {createListingMutation.isPending ? 'Creating...' : 'Create Listing'}
          </button>
          
          <button
            type="button"
            onClick={() => navigate('/adoption')}
            className="btn btn-outline btn-lg"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { adoptionAPI, petAPI } from '../../services/api'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { 
  ArrowLeftIcon,
  PhotoIcon,
  PlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
export default function CreateListingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    size: '',
    temperament: [],
    energyLevel: 'medium',
    specialNeeds: false,
    specialNeedsDescription: '',
    adoptionFee: '',
    photos: [],
    adoptionRequirements: [],
    goodWith: []
  })
  const [errors, setErrors] = useState({})
  const [newTemperament, setNewTemperament] = useState('')
  const [newGoodWith, setNewGoodWith] = useState('')
  const [petId, setPetId] = useState('')
  const [goodWithChildren, setGoodWithChildren] = useState(false)
  const [goodWithDogs, setGoodWithDogs] = useState(false)
  const [goodWithCats, setGoodWithCats] = useState(false)
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
  const { data: myPetsResp, isLoading: petsLoading } = useQuery({
    queryKey: ['my-pets'],
    queryFn: () => petAPI.getMyPets(),
    enabled: !!user?.id && user?.role === 'shelter'
  })
  const myPets = myPetsResp?.data?.data || []
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
    if (!petId) newErrors.petId = 'Please select a pet for this listing'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    const payload = {
      petId,
      title: formData.title,
      description: formData.description,
      adoptionFee: formData.adoptionFee ? Number(formData.adoptionFee) : undefined,
      size: formData.size && formData.size !== '' ? formData.size : undefined,
      energyLevel: formData.energyLevel && formData.energyLevel !== '' ? formData.energyLevel : undefined,
      specialNeeds: formData.specialNeeds,
      specialNeedsDescription: formData.specialNeeds ? formData.specialNeedsDescription : undefined,
      goodWith: {
        children: goodWithChildren,
        dogs: goodWithDogs,
        cats: goodWithCats
      },
      requirements: formData.adoptionRequirements?.length ? formData.adoptionRequirements.join(', ') : undefined,
      temperament: formData.temperament?.length ? formData.temperament : undefined,
      photos: formData.photos?.length ? formData.photos : undefined
    }
    createListingMutation.mutate(payload)
  }
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {}
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
        {}
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900">Select Pet *</h2>
          </div>
          <div className="card-content space-y-3">
            {petsLoading ? (
              <div className="flex items-center"><LoadingSpinner size="sm" /><span className="ml-2 text-gray-600">Loading pets...</span></div>
            ) : myPets.length > 0 ? (
              <select
                value={petId}
                onChange={(e) => setPetId(e.target.value)}
                className={`input ${errors.petId ? 'border-red-300' : ''}`}
              >
                <option value="">Select a pet</option>
                {myPets.map(p => (
                  <option key={p._id} value={p._id}>{p.name} • {p.species} • {p.breed}</option>
                ))}
              </select>
            ) : (
              <div className="text-sm text-gray-600">No pets found. Please add a pet first.</div>
            )}
            {errors.petId && <p className="text-sm text-red-600">{errors.petId}</p>}
          </div>
        </div>
        {}
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
                <label className="label">Energy Level</label>
                <select
                  name="energyLevel"
                  value={formData.energyLevel}
                  onChange={handleInputChange}
                  className="input"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
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
        {}
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
        {}
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900">Compatibility & Medical Information</h2>
          </div>
          <div className="card-content space-y-4">
            <div>
              <label className="label">Good With</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="h-4 w-4" checked={goodWithChildren} onChange={(e) => setGoodWithChildren(e.target.checked)} />
                  <span className="text-sm">Children</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="h-4 w-4" checked={goodWithDogs} onChange={(e) => setGoodWithDogs(e.target.checked)} />
                  <span className="text-sm">Dogs</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="h-4 w-4" checked={goodWithCats} onChange={(e) => setGoodWithCats(e.target.checked)} />
                  <span className="text-sm">Cats</span>
                </label>
              </div>
            </div>
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
        {}
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
        {}
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
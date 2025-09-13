import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { shelterAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { LoadingSpinner } from '../ui/LoadingSpinner'
export default function ShelterProfileForm({ onClose, onSuccess }) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: { street: '', city: '', state: '', zipCode: '', country: '' },
    phone: '',
    email: '',
    website: '',
    capacity: '',
    services: [],
    licenseNumber: '',
    socialMedia: { facebook: '', instagram: '', twitter: '' }
  })
  const [errors, setErrors] = useState({})
  const serviceOptions = ['adoption', 'fostering', 'medical-care', 'grooming', 'training', 'boarding']
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }
  const handleAddressChange = (field, value) => {
    setFormData(prev => ({ ...prev, address: { ...prev.address, [field]: value } }))
    if (errors[`address.${field}`]) setErrors(prev => ({ ...prev, [`address.${field}`]: '' }))
  }
  const handleServiceToggle = (svc) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(svc)
        ? prev.services.filter(s => s !== svc)
        : [...prev.services, svc]
    }))
  }
  const validate = () => {
    const e = {}
    if (!formData.name.trim()) e.name = 'Shelter name is required'
    if (!formData.address.city.trim()) e['address.city'] = 'City is required'
    if (!formData.address.country.trim()) e['address.country'] = 'Country is required'
    if (formData.phone && !/^\+?[1-9][\d\s]{6,14}$/.test(formData.phone)) e.phone = 'Invalid phone number'
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(formData.email)) e.email = 'Invalid email'
    if (formData.website && !/^https?:\/\/[^\s]+\.[^\s]{2,}$/.test(formData.website)) e.website = 'Invalid website URL'
    if (formData.capacity && isNaN(formData.capacity)) e.capacity = 'Invalid capacity'
    setErrors(e)
    return Object.keys(e).length === 0
  }
  const createMutation = useMutation({
    mutationFn: (payload) => shelterAPI.createShelter(payload),
    onSuccess: () => {
      toast.success('Shelter profile created')
      queryClient.invalidateQueries(['my-shelter'])
      onSuccess?.()
      onClose?.()
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to create shelter profile')
    }
  })
  const onSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    const payload = {
      ...formData,
      capacity: formData.capacity ? Number(formData.capacity) : undefined,
      services: formData.services,
    }
    createMutation.mutate(payload)
  }
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Create Shelter Profile</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Shelter Name *</label>
              <input name="name" value={formData.name} onChange={handleChange} className={`input ${errors.name ? 'border-red-300' : ''}`} placeholder="Happy Paws Shelter" />
              {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="label">Capacity</label>
              <input type="number" name="capacity" value={formData.capacity} onChange={handleChange} className="input" placeholder="e.g., 50" />
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="textarea" placeholder="About your shelter..." />
          </div>
          <div>
            <label className="label">Address *</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input value={formData.address.street} onChange={(e) => handleAddressChange('street', e.target.value)} className="input" placeholder="Street" />
              <input value={formData.address.city} onChange={(e) => handleAddressChange('city', e.target.value)} className={`input ${errors['address.city'] ? 'border-red-300' : ''}`} placeholder="City" />
              <input value={formData.address.state} onChange={(e) => handleAddressChange('state', e.target.value)} className="input" placeholder="State" />
              <input value={formData.address.zipCode} onChange={(e) => handleAddressChange('zipCode', e.target.value)} className="input" placeholder="ZIP Code" />
              <input value={formData.address.country} onChange={(e) => handleAddressChange('country', e.target.value)} className={`input ${errors['address.country'] ? 'border-red-300' : ''}`} placeholder="Country" />
            </div>
            {(errors['address.city'] || errors['address.country']) && (
              <p className="text-sm text-red-600 mt-1">{errors['address.city'] || errors['address.country']}</p>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Phone</label>
              <input name="phone" value={formData.phone} onChange={handleChange} className={`input ${errors.phone ? 'border-red-300' : ''}`} placeholder="+1 555 0123" />
              {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone}</p>}
            </div>
            <div>
              <label className="label">Email</label>
              <input name="email" value={formData.email} onChange={handleChange} className={`input ${errors.email ? 'border-red-300' : ''}`} placeholder="contact@shelter.org" />
              {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="label">Website</label>
              <input name="website" value={formData.website} onChange={handleChange} className={`input ${errors.website ? 'border-red-300' : ''}`} placeholder="https://example.org" />
              {errors.website && <p className="text-sm text-red-600 mt-1">{errors.website}</p>}
            </div>
            <div>
              <label className="label">License Number</label>
              <input name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} className="input" placeholder="SH-2024-001" />
            </div>
          </div>
          <div>
            <label className="label">Services Offered</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {serviceOptions.map(svc => (
                <label key={svc} className="flex items-center space-x-2 p-2 border rounded cursor-pointer hover:bg-gray-50">
                  <input type="checkbox" checked={formData.services.includes(svc)} onChange={() => handleServiceToggle(svc)} className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" />
                  <span className="text-sm capitalize">{svc.replace('-', ' ')}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Social Media</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input value={formData.socialMedia.facebook} onChange={(e) => setFormData(prev => ({ ...prev, socialMedia: { ...prev.socialMedia, facebook: e.target.value } }))} className="input" placeholder="Facebook URL" />
              <input value={formData.socialMedia.instagram} onChange={(e) => setFormData(prev => ({ ...prev, socialMedia: { ...prev.socialMedia, instagram: e.target.value } }))} className="input" placeholder="Instagram URL" />
              <input value={formData.socialMedia.twitter} onChange={(e) => setFormData(prev => ({ ...prev, socialMedia: { ...prev.socialMedia, twitter: e.target.value } }))} className="input" placeholder="Twitter URL" />
            </div>
          </div>
          <div className="flex justify-end space-x-3 border-t pt-4">
            <button type="button" onClick={onClose} className="btn btn-outline" disabled={createMutation.isPending}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              {createMutation.isPending ? (<><LoadingSpinner size="sm" className="mr-2" />Saving...</>) : 'Create Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
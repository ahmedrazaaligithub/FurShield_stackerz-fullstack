import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import PhoneInput from '../../components/ui/PhoneInput'
import { EyeIcon, EyeSlashIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
const roles = [
  { value: 'owner', label: 'Pet Owner', description: 'I have pets and need care services' },
  { value: 'vet', label: 'Veterinarian', description: 'I provide veterinary services' },
  { value: 'shelter', label: 'Shelter/Rescue', description: 'I run a pet shelter or rescue' }
]
const specializations = [
  'general', 'surgery', 'dermatology', 'cardiology', 'neurology', 
  'oncology', 'orthopedic', 'ophthalmology', 'dentistry', 'emergency',
  'exotic', 'behavior', 'internal-medicine', 'reproduction'
]
const languages = [
  'English', 'Urdu', 'Punjabi', 'Sindhi', 'Pashto', 'Balochi', 'Arabic', 'Persian'
]
const daysOfWeek = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' }
]
export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'owner',
    phone: '',
    address: '',
    licenseNumber: '',
    specialization: [],
    experience: '',
    clinicName: '',
    clinicAddress: '',
    consultationFee: '',
    availableHours: {
      monday: { start: '09:00', end: '17:00', available: false },
      tuesday: { start: '09:00', end: '17:00', available: false },
      wednesday: { start: '09:00', end: '17:00', available: false },
      thursday: { start: '09:00', end: '17:00', available: false },
      friday: { start: '09:00', end: '17:00', available: false },
      saturday: { start: '09:00', end: '17:00', available: false },
      sunday: { start: '09:00', end: '17:00', available: false }
    },
    languages: [],
    bio: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const { register } = useAuth()
  const navigate = useNavigate()
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }
  const handleSpecializationChange = (spec) => {
    setFormData(prev => ({
      ...prev,
      specialization: prev.specialization.includes(spec)
        ? prev.specialization.filter(s => s !== spec)
        : [...prev.specialization, spec]
    }))
  }
  const handleLanguageChange = (lang) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter(l => l !== lang)
        : [...prev.languages, lang]
    }))
  }
  const handleAvailabilityChange = (day, field, value) => {
    setFormData(prev => ({
      ...prev,
      availableHours: {
        ...prev.availableHours,
        [day]: {
          ...prev.availableHours[day],
          [field]: value
        }
      }
    }))
  }
  const handlePhoneChange = (phoneValue) => {
    setFormData(prev => ({ ...prev, phone: phoneValue }))
    if (errors.phone) {
      setErrors(prev => ({ ...prev, phone: '' }))
    }
  }
  const validateForm = () => {
    const newErrors = {}
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 10) {
      newErrors.password = 'Password must be at least 10 characters'
    } else if (!/^(?=.{10,64}$)(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^\w\s]).*$/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, number and special character'
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^\+[1-9]\d{6,14}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number'
    }
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required'
    } else if (formData.address.trim().length < 5) {
      newErrors.address = 'Address must be at least 5 characters'
    } else if (formData.address.trim().length > 200) {
      newErrors.address = 'Address cannot be more than 200 characters'
    }
    if (formData.role === 'vet') {
      if (!formData.licenseNumber.trim()) {
        newErrors.licenseNumber = 'License number is required'
      } else if (formData.licenseNumber.trim().length < 5) {
        newErrors.licenseNumber = 'License number must be at least 5 characters'
      }
      if (formData.specialization.length === 0) {
        newErrors.specialization = 'At least one specialization is required'
      }
      if (!formData.experience) {
        newErrors.experience = 'Years of experience is required'
      } else if (formData.experience < 0 || formData.experience > 50) {
        newErrors.experience = 'Experience must be between 0 and 50 years'
      }
      if (!formData.clinicName.trim()) {
        newErrors.clinicName = 'Clinic name is required'
      } else if (formData.clinicName.trim().length < 2) {
        newErrors.clinicName = 'Clinic name must be at least 2 characters'
      }
      if (!formData.clinicAddress.trim()) {
        newErrors.clinicAddress = 'Clinic address is required'
      } else if (formData.clinicAddress.trim().length < 5) {
        newErrors.clinicAddress = 'Clinic address must be at least 5 characters'
      }
      if (!formData.consultationFee) {
        newErrors.consultationFee = 'Consultation fee is required'
      } else if (formData.consultationFee < 0 || formData.consultationFee > 10000) {
        newErrors.consultationFee = 'Consultation fee must be between 0 and 10000'
      }
      if (formData.languages.length === 0) {
        newErrors.languages = 'At least one language is required'
      }
      if (!formData.bio.trim()) {
        newErrors.bio = 'Bio is required'
      } else if (formData.bio.trim().length < 50) {
        newErrors.bio = 'Bio must be at least 50 characters'
      } else if (formData.bio.trim().length > 1000) {
        newErrors.bio = 'Bio cannot be more than 1000 characters'
      }
      const hasAvailableDay = Object.values(formData.availableHours).some(day => day.available)
      if (!hasAvailableDay) {
        newErrors.availableHours = 'At least one day must be available'
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    setLoading(true)
    const submitData = { ...formData }
    if (formData.role !== 'vet') {
      delete submitData.licenseNumber
      delete submitData.specialization
      delete submitData.experience
      delete submitData.clinicName
      delete submitData.clinicAddress
      delete submitData.consultationFee
      delete submitData.availableHours
      delete submitData.languages
      delete submitData.bio
    }
    const result = await register(submitData)
    setLoading(false)
    if (result.success) {
      navigate('/dashboard')
    }
  }
  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center">
            <div className="h-12 w-12 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-2xl">🐾</span>
            </div>
            <span className="ml-3 text-2xl font-bold text-gray-900">PetCare</span>
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join thousands of pet owners and professionals
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="label">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                className={`input ${errors.name ? 'border-red-300 focus-visible:ring-red-500' : ''}`}
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>
            <div>
              <label htmlFor="email" className="label">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`input ${errors.email ? 'border-red-300 focus-visible:ring-red-500' : ''}`}
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>
            <div>
              <label htmlFor="role" className="label">
                I am a
              </label>
              <div className="space-y-2">
                {roles.map((role) => (
                  <label key={role.value} className="flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="role"
                      value={role.value}
                      checked={formData.role === role.value}
                      onChange={handleChange}
                      className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{role.label}</div>
                      <div className="text-sm text-gray-500">{role.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="phone" className="label">
                Phone Number
              </label>
              <PhoneInput
                value={formData.phone}
                onChange={handlePhoneChange}
                error={errors.phone}
                placeholder="Enter your phone number"
                required
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="address" className="label">
                Address
              </label>
              <textarea
                id="address"
                name="address"
                rows={2}
                required
                className={`textarea ${errors.address ? 'border-red-300 focus-visible:ring-red-500' : ''}`}
                placeholder="Enter your address"
                value={formData.address}
                onChange={handleChange}
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-600">{errors.address}</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className={`input pr-10 ${errors.password ? 'border-red-300 focus-visible:ring-red-500' : ''}`}
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>
            <div>
              <label htmlFor="confirmPassword" className="label">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className={`input pr-10 ${errors.confirmPassword ? 'border-red-300 focus-visible:ring-red-500' : ''}`}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>
            {}
            {formData.role === 'vet' && (
              <div className="space-y-6 border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900">Professional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="licenseNumber" className="label">
                      License Number *
                    </label>
                    <input
                      id="licenseNumber"
                      name="licenseNumber"
                      type="text"
                      required
                      className={`input ${errors.licenseNumber ? 'border-red-300 focus-visible:ring-red-500' : ''}`}
                      placeholder="Enter your veterinary license number"
                      value={formData.licenseNumber}
                      onChange={handleChange}
                    />
                    {errors.licenseNumber && (
                      <p className="mt-1 text-sm text-red-600">{errors.licenseNumber}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="experience" className="label">
                      Years of Experience *
                    </label>
                    <input
                      id="experience"
                      name="experience"
                      type="number"
                      min="0"
                      max="50"
                      required
                      className={`input ${errors.experience ? 'border-red-300 focus-visible:ring-red-500' : ''}`}
                      placeholder="Years of experience"
                      value={formData.experience}
                      onChange={handleChange}
                    />
                    {errors.experience && (
                      <p className="mt-1 text-sm text-red-600">{errors.experience}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="label">Specializations *</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {specializations.map((spec) => (
                      <label key={spec} className="flex items-center space-x-2 p-2 border rounded cursor-pointer hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={formData.specialization.includes(spec)}
                          onChange={() => handleSpecializationChange(spec)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <span className="text-sm capitalize">{spec.replace('-', ' ')}</span>
                      </label>
                    ))}
                  </div>
                  {errors.specialization && (
                    <p className="mt-1 text-sm text-red-600">{errors.specialization}</p>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="clinicName" className="label">
                      Clinic Name *
                    </label>
                    <input
                      id="clinicName"
                      name="clinicName"
                      type="text"
                      required
                      className={`input ${errors.clinicName ? 'border-red-300 focus-visible:ring-red-500' : ''}`}
                      placeholder="Enter clinic name"
                      value={formData.clinicName}
                      onChange={handleChange}
                    />
                    {errors.clinicName && (
                      <p className="mt-1 text-sm text-red-600">{errors.clinicName}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="consultationFee" className="label">
                      Consultation Fee (PKR) *
                    </label>
                    <input
                      id="consultationFee"
                      name="consultationFee"
                      type="number"
                      min="0"
                      max="10000"
                      required
                      className={`input ${errors.consultationFee ? 'border-red-300 focus-visible:ring-red-500' : ''}`}
                      placeholder="Enter consultation fee"
                      value={formData.consultationFee}
                      onChange={handleChange}
                    />
                    {errors.consultationFee && (
                      <p className="mt-1 text-sm text-red-600">{errors.consultationFee}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label htmlFor="clinicAddress" className="label">
                    Clinic Address *
                  </label>
                  <textarea
                    id="clinicAddress"
                    name="clinicAddress"
                    rows={2}
                    required
                    className={`textarea ${errors.clinicAddress ? 'border-red-300 focus-visible:ring-red-500' : ''}`}
                    placeholder="Enter clinic address"
                    value={formData.clinicAddress}
                    onChange={handleChange}
                  />
                  {errors.clinicAddress && (
                    <p className="mt-1 text-sm text-red-600">{errors.clinicAddress}</p>
                  )}
                </div>
                <div>
                  <label className="label">Languages Spoken *</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {languages.map((lang) => (
                      <label key={lang} className="flex items-center space-x-2 p-2 border rounded cursor-pointer hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={formData.languages.includes(lang)}
                          onChange={() => handleLanguageChange(lang)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <span className="text-sm">{lang}</span>
                      </label>
                    ))}
                  </div>
                  {errors.languages && (
                    <p className="mt-1 text-sm text-red-600">{errors.languages}</p>
                  )}
                </div>
                <div>
                  <label className="label">Available Hours *</label>
                  <div className="space-y-3">
                    {daysOfWeek.map((day) => (
                      <div key={day.key} className="flex items-center space-x-4 p-3 border rounded">
                        <label className="flex items-center space-x-2 min-w-[100px]">
                          <input
                            type="checkbox"
                            checked={formData.availableHours[day.key].available}
                            onChange={(e) => handleAvailabilityChange(day.key, 'available', e.target.checked)}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <span className="text-sm font-medium">{day.label}</span>
                        </label>
                        {formData.availableHours[day.key].available && (
                          <div className="flex items-center space-x-2">
                            <input
                              type="time"
                              value={formData.availableHours[day.key].start}
                              onChange={(e) => handleAvailabilityChange(day.key, 'start', e.target.value)}
                              className="input text-sm py-1"
                            />
                            <span className="text-sm text-gray-500">to</span>
                            <input
                              type="time"
                              value={formData.availableHours[day.key].end}
                              onChange={(e) => handleAvailabilityChange(day.key, 'end', e.target.value)}
                              className="input text-sm py-1"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {errors.availableHours && (
                    <p className="mt-1 text-sm text-red-600">{errors.availableHours}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="bio" className="label">
                    Professional Bio *
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    rows={4}
                    required
                    className={`textarea ${errors.bio ? 'border-red-300 focus-visible:ring-red-500' : ''}`}
                    placeholder="Tell us about your experience, qualifications, and approach to veterinary care (minimum 50 characters)"
                    value={formData.bio}
                    onChange={handleChange}
                  />
                  <div className="mt-1 text-sm text-gray-500">
                    {formData.bio.length}/1000 characters
                  </div>
                  {errors.bio && (
                    <p className="mt-1 text-sm text-red-600">{errors.bio}</p>
                  )}
                </div>
              </div>
            )}
          </div>
          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full btn-lg"
            >
              {loading ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : null}
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
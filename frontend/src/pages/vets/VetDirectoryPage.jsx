import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { userAPI } from '../../services/api'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { 
  UserIcon,
  StarIcon,
  ChatBubbleLeftRightIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
export default function VetDirectoryPage() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSpecialization, setSelectedSpecialization] = useState('')
  const { data: vets, isLoading } = useQuery({
    queryKey: ['vets'],
    queryFn: () => userAPI.getVets()
  })
  const availableVets = vets?.data?.data || []
  const filteredVets = availableVets.filter(vet => {
    const matchesSearch = vet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vet.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSpecialization = !selectedSpecialization || vet.specialization === selectedSpecialization
    return matchesSearch && matchesSpecialization
  })
  const specializations = [...new Set(availableVets.map(vet => vet.specialization).filter(Boolean))]
  const handleChatVet = (vetId) => {
    console.log('Chat with vet:', vetId)
  }
  const handleViewProfile = (vetId) => {
    navigate(`/vets/${vetId}`)
  }
  if (isLoading) {
    return <LoadingSpinner />
  }
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {}
      <div className="card">
        <div className="card-content">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by name or specialization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input w-full"
              />
            </div>
            <div className="md:w-64">
              <select
                value={selectedSpecialization}
                onChange={(e) => setSelectedSpecialization(e.target.value)}
                className="input w-full"
              >
                <option value="">All Specializations</option>
                {specializations.map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
      {}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVets.map(vet => (
          <div key={vet._id} className="card hover:shadow-lg transition-shadow">
            <div className="card-content p-6">
              {}
              <div className="flex items-center space-x-4 mb-4">
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
                  <p className="text-sm text-gray-600">
                    {vet.specialization || 'General Practice'}
                  </p>
                </div>
              </div>
              {}
              {vet.rating && (
                <div className="flex items-center mb-3">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      i < Math.floor(vet.rating) ? (
                        <StarIconSolid key={i} className="h-4 w-4 text-yellow-400" />
                      ) : (
                        <StarIcon key={i} className="h-4 w-4 text-gray-300" />
                      )
                    ))}
                    <span className="ml-2 text-sm text-gray-600">
                      {vet.rating} ({vet.reviewCount || 0} reviews)
                    </span>
                  </div>
                </div>
              )}
              {}
              {vet.experience && (
                <p className="text-sm text-gray-600 mb-3">
                  {vet.experience} years of experience
                </p>
              )}
              {}
              <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                {vet.bio || `Dr. ${vet.name} is a dedicated veterinary professional committed to providing exceptional care for your beloved pets.`}
              </p>
              {}
              <div className="space-y-2 mb-4">
                {vet.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <PhoneIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{vet.phone}</span>
                  </div>
                )}
                {vet.email && (
                  <div className="flex items-center text-sm text-gray-600">
                    <EnvelopeIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate" title={vet.email}>{vet.email}</span>
                  </div>
                )}
                {vet.address && (
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPinIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate" title={vet.address}>{vet.address}</span>
                  </div>
                )}
              </div>
              {}
              {vet.languages && vet.languages.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1">
                    {vet.languages.map((lang, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {}
              <div className="flex space-x-2">
                <button
                  onClick={() => handleChatVet(vet._id)}
                  className="flex-1 btn btn-primary text-sm"
                >
                  <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                  Chat
                </button>
                <button 
                  onClick={() => handleViewProfile(vet._id)}
                  className="flex-1 btn btn-outline text-sm"
                >
                  View Profile
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {}
      {filteredVets.length === 0 && (
        <div className="text-center py-12">
          <UserIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No veterinarians found</h3>
          <p className="text-gray-600">
            {searchTerm || selectedSpecialization 
              ? 'Try adjusting your search criteria' 
              : 'No veterinarians are currently available'}
          </p>
        </div>
      )}
    </div>
  )
}
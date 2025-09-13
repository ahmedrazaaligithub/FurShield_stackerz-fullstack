import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adoptionAPI } from '../../services/api'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { 
  ArrowLeftIcon,
  HeartIcon,
  MapPinIcon,
  CalendarIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon
} from '@heroicons/react/24/outline'
import { cn } from '../../utils/cn'
import toast from 'react-hot-toast'
export default function AdoptionDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showInquiryModal, setShowInquiryModal] = useState(false)
  const [inquiryMessage, setInquiryMessage] = useState('')
  const { data: listing, isLoading, error } = useQuery({
    queryKey: ['adoption-listing', id],
    queryFn: () => adoptionAPI.getAdoption(id)
  })
  const inquiryMutation = useMutation({
    mutationFn: ({ id, message }) => adoptionAPI.createInquiry(id, { message }),
    onSuccess: () => {
      toast.success('Inquiry submitted successfully!')
      queryClient.invalidateQueries(['adoption-listing', id])
      setShowInquiryModal(false)
      setInquiryMessage('')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to submit inquiry')
    }
  })
  const handleSubmitInquiry = () => {
    if (!inquiryMessage.trim()) {
      toast.error('Please provide a message with your inquiry')
      return
    }
    inquiryMutation.mutate({ id, message: inquiryMessage })
  }
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }
  if (error || !listing?.data?.data) {
    return (
      <div className="text-center py-12">
        <HeartIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Listing not found</h3>
        <p className="text-gray-600 mb-6">The adoption listing you're looking for doesn't exist.</p>
        <button
          onClick={() => navigate('/adoption')}
          className="btn btn-primary"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Adoption
        </button>
      </div>
    )
  }
  const listingData = listing.data.data
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/adoption')}
          className="btn btn-ghost p-2"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{listingData.title || listingData.pet?.name}</h1>
          <p className="text-gray-600 capitalize">
            {listingData.pet?.species || listingData.species} • {listingData.pet?.age || listingData.age} years old • {listingData.pet?.gender || listingData.gender}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {}
        <div className="lg:col-span-2 space-y-6">
          {}
          <div className="card">
            <div className="p-0">
              {(listingData.pet?.photos?.length > 0 || listingData.photos?.length > 0) ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
                  {(listingData.pet?.photos || listingData.photos || []).map((photo, index) => (
                    <img
                      key={index}
                      src={photo}
                      alt={`${listingData.title || listingData.pet?.name} photo ${index + 1}`}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  ))}
                </div>
              ) : (
                <div className="h-64 bg-gray-200 rounded-t-lg flex items-center justify-center">
                  <HeartIcon className="h-16 w-16 text-gray-400" />
                </div>
              )}
            </div>
          </div>
          {}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900">About {listingData.title || listingData.pet?.name}</h2>
            </div>
            <div className="card-content">
              <p className="text-gray-700 leading-relaxed">{listingData.description}</p>
            </div>
          </div>
          {}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900">Pet Details</h2>
            </div>
            <div className="card-content">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <label className="label">Species</label>
                  <p className="text-gray-900 capitalize">{listingData.pet?.species || listingData.species}</p>
                </div>
                <div>
                  <label className="label">Age</label>
                  <p className="text-gray-900">{listingData.pet?.age || listingData.age} years old</p>
                </div>
                <div>
                  <label className="label">Gender</label>
                  <p className="text-gray-900 capitalize">{listingData.pet?.gender || listingData.gender}</p>
                </div>
                <div>
                  <label className="label">Size</label>
                  <p className="text-gray-900 capitalize">{listingData.size || listingData.pet?.size || 'Not specified'}</p>
                </div>
                <div>
                  <label className="label">Weight</label>
                  <p className="text-gray-900">{(listingData.pet?.weight || listingData.weight) ? `${listingData.pet?.weight || listingData.weight} lbs` : 'Not specified'}</p>
                </div>
                <div>
                  <label className="label">Color</label>
                  <p className="text-gray-900">{listingData.pet?.color || listingData.color || 'Not specified'}</p>
                </div>
              </div>
              {(listingData.pet?.breed || listingData.breed) && (
                <div className="mt-6">
                  <label className="label">Breed</label>
                  <p className="text-gray-900">{listingData.pet?.breed || listingData.breed}</p>
                </div>
              )}
              {listingData.temperament?.length > 0 && (
                <div className="mt-6">
                  <label className="label">Temperament</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {listingData.temperament.map((trait, index) => (
                      <span key={index} className="badge badge-primary">
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {listingData.goodWith?.length > 0 && (
                <div className="mt-6">
                  <label className="label">Good With</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {listingData.goodWith.map((item, index) => (
                      <span key={index} className="badge badge-success">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {listingData.specialNeeds && (
                <div className="mt-6">
                  <label className="label">Special Needs</label>
                  <p className="text-gray-900">{listingData.specialNeedsDescription || 'Yes'}</p>
                </div>
              )}
              {(listingData.pet?.medicalHistory || listingData.medicalHistory) && (
                <div className="mt-6">
                  <label className="label">Medical History</label>
                  <p className="text-gray-700">{listingData.pet?.medicalHistory || listingData.medicalHistory}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        {}
        <div className="space-y-6">
          {}
          <div className="card">
            <div className="card-content">
              <div className="text-center mb-4">
                <span className={cn(
                  'badge text-lg px-4 py-2',
                  listingData.status === 'available' ? 'badge-success' :
                  listingData.status === 'pending' ? 'badge-warning' :
                  'badge-secondary'
                )}>
                  {listingData.status}
                </span>
              </div>
              {listingData.status === 'available' && (
                <button
                  onClick={() => setShowInquiryModal(true)}
                  className="btn btn-primary w-full btn-lg"
                >
                  <HeartIcon className="h-5 w-5 mr-2" />
                  Inquire About Adoption
                </button>
              )}
              {listingData.priority === 'urgent' && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm font-medium">
                    🚨 Urgent: This pet needs immediate adoption
                  </p>
                </div>
              )}
            </div>
          </div>
          {}
          {listingData.shelter && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900">Shelter Information</h3>
              </div>
              <div className="card-content space-y-3">
                <div>
                  <h4 className="font-medium text-gray-900">{listingData.shelter.name}</h4>
                  {listingData.shelter.address && (
                    <div className="flex items-center text-gray-600 mt-1">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      <span className="text-sm">
                        {typeof listingData.shelter.address === 'string' 
                          ? listingData.shelter.address 
                          : `${listingData.shelter.address.street || ''}, ${listingData.shelter.address.city || ''}, ${listingData.shelter.address.state || ''} ${listingData.shelter.address.zipCode || ''}`.replace(/^,\s*|,\s*$/, '').replace(/,\s*,/g, ',')
                        }
                      </span>
                    </div>
                  )}
                </div>
                {listingData.shelter.phone && (
                  <div className="flex items-center text-gray-600">
                    <PhoneIcon className="h-4 w-4 mr-2" />
                    <span className="text-sm">{listingData.shelter.phone}</span>
                  </div>
                )}
                {listingData.shelter.email && (
                  <div className="flex items-center text-gray-600">
                    <EnvelopeIcon className="h-4 w-4 mr-2" />
                    <span className="text-sm">{listingData.shelter.email}</span>
                  </div>
                )}
                {listingData.shelter.website && (
                  <a
                    href={listingData.shelter.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline w-full mt-3"
                  >
                    Visit Shelter Website
                  </a>
                )}
              </div>
            </div>
          )}
          {}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Adoption Information</h3>
            </div>
            <div className="card-content space-y-3">
              {listingData.adoptionFee && (
                <div>
                  <label className="label">Adoption Fee</label>
                  <p className="text-lg font-semibold text-gray-900">
                    ${listingData.adoptionFee}
                  </p>
                </div>
              )}
              <div className="flex items-center text-gray-600">
                <CalendarIcon className="h-4 w-4 mr-2" />
                <span className="text-sm">
                  Listed {new Date(listingData.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center text-gray-600">
                <UserIcon className="h-4 w-4 mr-2" />
                <span className="text-sm">
                  {listingData.inquiries?.length || 0} inquiries
                </span>
              </div>
            </div>
          </div>
          {}
          {listingData.adoptionRequirements?.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900">Adoption Requirements</h3>
              </div>
              <div className="card-content">
                <ul className="space-y-2">
                  {listingData.adoptionRequirements.map((requirement, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-primary-600 mr-2">•</span>
                      <span className="text-sm text-gray-700">{requirement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
      {}
      {showInquiryModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Inquire About {listingData.title || listingData.pet?.name}
            </h3>
            <p className="text-gray-600 mb-4">
              Send a message to the shelter expressing your interest in adopting this pet.
            </p>
            <textarea
              value={inquiryMessage}
              onChange={(e) => setInquiryMessage(e.target.value)}
              rows={4}
              className="textarea w-full mb-4"
              placeholder="Tell the shelter why you'd be a great home for this pet..."
            />
            <div className="flex space-x-3">
              <button
                onClick={handleSubmitInquiry}
                disabled={inquiryMutation.isPending}
                className="btn btn-primary flex-1"
              >
                {inquiryMutation.isPending ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : null}
                Send Inquiry
              </button>
              <button
                onClick={() => setShowInquiryModal(false)}
                className="btn btn-outline flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
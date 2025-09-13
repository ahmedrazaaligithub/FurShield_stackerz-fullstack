import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userAPI } from '../../services/api'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { 
  UserIcon,
  StarIcon,
  ChatBubbleLeftRightIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  ArrowLeftIcon,
  ClockIcon,
  AcademicCapIcon,
  HeartIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid, HeartIcon as HeartIconSolid, CheckBadgeIcon as CheckBadgeIconSolid } from '@heroicons/react/24/solid'
import toast from 'react-hot-toast'
export default function VetProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: vet, isLoading, error } = useQuery({
    queryKey: ['vet', id],
    queryFn: () => userAPI.getVetById(id)
  })
  const { data: favorites } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => userAPI.getFavoriteVets()
  })
  const addFavoriteMutation = useMutation({
    mutationFn: (vetId) => userAPI.addFavoriteVet(vetId),
    onSuccess: () => {
      queryClient.invalidateQueries(['favorites'])
      queryClient.refetchQueries(['favorites'])
      toast.success('Added to favorites!')
    },
    onError: (error) => {
      console.error('Add favorite error:', error)
      toast.error(error.response?.data?.error || 'Failed to add to favorites')
    }
  })
  const removeFavoriteMutation = useMutation({
    mutationFn: (vetId) => userAPI.removeFavoriteVet(vetId),
    onSuccess: () => {
      queryClient.invalidateQueries(['favorites'])
      toast.success('Removed from favorites')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to remove from favorites')
    }
  })
  const vetData = vet?.data?.data
  const favoriteVetsData = favorites?.data?.data?.data || []
  console.log('VetProfile - Favorites response:', favorites)
  console.log('VetProfile - Favorite vets data:', favoriteVetsData)
  console.log('VetProfile - Current vet ID:', id)
  console.log('VetProfile - Is favorite check:', favoriteVetsData.some(fav => fav._id === id))
  const isFavorite = favoriteVetsData.some(fav => fav._id === id)
  const handleChatVet = () => {
    console.log('Chat with vet:', id)
  }
  const handleToggleFavorite = () => {
    if (isFavorite) {
      removeFavoriteMutation.mutate(id)
    } else {
      addFavoriteMutation.mutate(id)
    }
  }
  if (isLoading) {
    return <LoadingSpinner />
  }
  if (error || !vetData) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <UserIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Veterinarian Not Found</h2>
        <p className="text-gray-600 mb-6">The veterinarian profile you're looking for doesn't exist.</p>
        <button
          onClick={() => navigate('/vets')}
          className="btn btn-primary"
        >
          Back to Directory
        </button>
      </div>
    )
  }
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/vets')}
          className="btn btn-ghost p-2"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Veterinarian Profile</h1>
          <p className="text-gray-600">Professional details and information</p>
        </div>
      </div>
      {}
      <div className="card">
        <div className="card-content p-8">
          <div className="flex flex-col md:flex-row items-start space-y-6 md:space-y-0 md:space-x-8">
            {}
            <div className="flex-shrink-0">
              {vetData.avatar ? (
                <img
                  src={vetData.avatar}
                  alt={`Dr. ${vetData.name}`}
                  className="h-32 w-32 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="h-32 w-32 bg-gray-200 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                  <UserIcon className="h-16 w-16 text-gray-400" />
                </div>
              )}
            </div>
            {}
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h2 className="text-3xl font-bold text-gray-900">Dr. {vetData.name}</h2>
                  {vetData.isVetVerified && (
                    <div className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                      <CheckBadgeIconSolid className="h-4 w-4 mr-1" />
                      Verified
                    </div>
                  )}
                </div>
                <p className="text-xl text-primary-600 font-medium">
                  {vetData.profile?.specialization?.join(', ') || vetData.specialization || 'General Practice'}
                </p>
              </div>
              {}
              {vetData.rating && (
                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      i < Math.floor(vetData.rating) ? (
                        <StarIconSolid key={i} className="h-5 w-5 text-yellow-400" />
                      ) : (
                        <StarIcon key={i} className="h-5 w-5 text-gray-300" />
                      )
                    ))}
                  </div>
                  <span className="text-lg font-medium text-gray-900">{vetData.rating}</span>
                  <span className="text-gray-600">({vetData.reviewCount || 0} reviews)</span>
                </div>
              )}
              {}
              {(vetData.profile?.experience || vetData.experience) && (
                <div className="flex items-center text-gray-600">
                  <ClockIcon className="h-5 w-5 mr-2" />
                  <span>{vetData.profile?.experience || vetData.experience} years of experience</span>
                </div>
              )}
              {}
              {vetData.profile?.licenseNumber && (
                <div className="flex items-center text-gray-600">
                  <AcademicCapIcon className="h-5 w-5 mr-2" />
                  <span>License: {vetData.profile.licenseNumber}</span>
                </div>
              )}
              {}
              {vetData.profile?.clinicName && (
                <div className="flex items-center text-gray-600">
                  <MapPinIcon className="h-5 w-5 mr-2" />
                  <span>{vetData.profile.clinicName}</span>
                </div>
              )}
              {}
              <div className="flex space-x-4 pt-4">
                <button
                  onClick={handleChatVet}
                  className="btn btn-primary"
                >
                  <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
                  Start Chat
                </button>
                <button 
                  onClick={handleToggleFavorite}
                  className={`btn ${isFavorite ? 'btn-primary' : 'btn-outline'}`}
                  disabled={addFavoriteMutation.isLoading || removeFavoriteMutation.isLoading}
                >
                  {isFavorite ? (
                    <HeartIconSolid className="h-5 w-5 mr-2 text-red-500" />
                  ) : (
                    <HeartIcon className="h-5 w-5 mr-2" />
                  )}
                  {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {}
        <div className="lg:col-span-2 space-y-6">
          {}
          {(vetData.profile?.bio || vetData.bio) && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-xl font-semibold text-gray-900">About</h3>
              </div>
              <div className="card-content">
                <p className="text-gray-700 leading-relaxed">{vetData.profile?.bio || vetData.bio}</p>
              </div>
            </div>
          )}
          {}
          {vetData.education && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <AcademicCapIcon className="h-5 w-5 mr-2" />
                  Education & Certifications
                </h3>
              </div>
              <div className="card-content">
                <div className="space-y-3">
                  {vetData.education.map((edu, index) => (
                    <div key={index} className="border-l-4 border-primary-200 pl-4">
                      <h4 className="font-semibold text-gray-900">{edu.degree}</h4>
                      <p className="text-gray-600">{edu.institution}</p>
                      {edu.year && <p className="text-sm text-gray-500">{edu.year}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {}
          {vetData.services && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-xl font-semibold text-gray-900">Services Offered</h3>
              </div>
              <div className="card-content">
                <div className="grid grid-cols-2 gap-3">
                  {vetData.services.map((service, index) => (
                    <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <div className="h-2 w-2 bg-primary-500 rounded-full mr-3"></div>
                      <span className="text-gray-700">{service}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        {}
        <div className="space-y-6">
          {}
          <div className="card">
            <div className="card-header">
              <h3 className="text-xl font-semibold text-gray-900">Contact Information</h3>
            </div>
            <div className="card-content space-y-4">
              {vetData.phone && (
                <div className="flex items-start">
                  <PhoneIcon className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="text-gray-900 break-all">{vetData.phone}</p>
                  </div>
                </div>
              )}
              {vetData.email && (
                <div className="flex items-start">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-gray-900 break-all" title={vetData.email}>{vetData.email}</p>
                  </div>
                </div>
              )}
              {vetData.address && (
                <div className="flex items-start">
                  <MapPinIcon className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="text-gray-900 break-words">{vetData.address}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          {}
          {(vetData.profile?.languages || vetData.languages) && (vetData.profile?.languages?.length > 0 || vetData.languages?.length > 0) && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-xl font-semibold text-gray-900">Languages</h3>
              </div>
              <div className="card-content">
                <div className="flex flex-wrap gap-2">
                  {(vetData.profile?.languages || vetData.languages).map((lang, index) => (
                    <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
          {}
          {vetData.profile?.consultationFee && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-xl font-semibold text-gray-900">Consultation Fee</h3>
              </div>
              <div className="card-content">
                <div className="text-2xl font-bold text-green-600">
                  ${vetData.profile.consultationFee}
                </div>
                <p className="text-gray-600 text-sm">Per consultation</p>
              </div>
            </div>
          )}
          {}
          {(vetData.profile?.availableHours || vetData.availability) && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-xl font-semibold text-gray-900">Availability</h3>
              </div>
              <div className="card-content">
                <div className="space-y-2">
                  {vetData.profile?.availableHours ? 
                    Object.entries(vetData.profile.availableHours).map(([day, dayData]) => (
                      <div key={day} className="flex justify-between">
                        <span className="capitalize text-gray-600">{day}</span>
                        <span className="text-gray-900">
                          {dayData.available ? 
                            `${dayData.startTime} - ${dayData.endTime}` : 
                            'Unavailable'
                          }
                        </span>
                      </div>
                    )) :
                    Object.entries(vetData.availability).map(([day, hours]) => (
                      <div key={day} className="flex justify-between">
                        <span className="capitalize text-gray-600">{day}</span>
                        <span className="text-gray-900">{hours}</span>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {}
      {vetData.reviews && vetData.reviews.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-xl font-semibold text-gray-900">Reviews & Testimonials</h3>
          </div>
          <div className="card-content">
            <div className="space-y-6">
              {vetData.reviews.map((review, index) => (
                <div key={index} className="border-b border-gray-200 pb-6 last:border-b-0">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <UserIcon className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-semibold text-gray-900">{review.userName}</h4>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            i < review.rating ? (
                              <StarIconSolid key={i} className="h-4 w-4 text-yellow-400" />
                            ) : (
                              <StarIcon key={i} className="h-4 w-4 text-gray-300" />
                            )
                          ))}
                        </div>
                        <span className="text-sm text-gray-500">{review.date}</span>
                      </div>
                      <p className="text-gray-700">{review.comment}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
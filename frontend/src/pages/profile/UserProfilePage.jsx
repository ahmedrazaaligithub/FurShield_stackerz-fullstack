import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { userAPI, petAPI, ratingAPI } from '../../services/api'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { useAuth } from '../../contexts/AuthContext'
import { 
  UserIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  MapPinIcon,
  StarIcon,
  ArrowLeftIcon,
  CalendarIcon,
  HeartIcon,
  ShieldCheckIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import { cn } from '../../utils/cn'
import toast from 'react-hot-toast'
export default function UserProfilePage() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState('about')
  const { data: profileData, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: () => userAPI.getUserProfile(userId),
    enabled: !!userId
  })
  const { data: userPets, isLoading: petsLoading } = useQuery({
    queryKey: ['user-pets', userId],
    queryFn: () => petAPI.getUserPets(userId),
    enabled: !!userId
  })
  const { data: userRatings, isLoading: ratingsLoading } = useQuery({
    queryKey: ['user-ratings', userId],
    queryFn: () => ratingAPI.getUserRatings(userId),
    enabled: !!userId
  })
  if (profileLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }
  if (profileError || !profileData?.data?.data) {
    return (
      <div className="text-center py-12">
        <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">User not found</h3>
        <p className="text-gray-600 mb-6">The user profile you're looking for doesn't exist.</p>
        <button onClick={() => navigate(-1)} className="btn btn-primary">
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Go Back
        </button>
      </div>
    )
  }
  const userData = profileData.data.data
  const pets = userPets?.data?.data || []
  const ratings = userRatings?.data?.data || []
  const isOwnProfile = currentUser?.id === userId
  const tabs = [
    { id: 'about', name: 'About' },
    { id: 'pets', name: `Pets (${pets.length})` },
    { id: 'reviews', name: `Reviews (${ratings.length})` }
  ]
  const renderStars = (rating) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIconSolid
            key={star}
            className={cn(
              'h-4 w-4',
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            )}
          />
        ))}
      </div>
    )
  }
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate(-1)}
          className="btn btn-ghost p-2"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Profile</h1>
          <p className="text-gray-600">View user details and activity</p>
        </div>
      </div>
      {}
      <div className="card">
        <div className="p-6">
          <div className="flex items-start space-x-6">
            <div className="flex-shrink-0">
              {userData.avatar ? (
                <img
                  src={userData.avatar}
                  alt={userData.name}
                  className="h-24 w-24 rounded-full object-cover"
                />
              ) : (
                <div className="h-24 w-24 bg-gray-200 rounded-full flex items-center justify-center">
                  <UserIcon className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h2 className="text-2xl font-bold text-gray-900">{userData.name}</h2>
                    <div className="flex items-center space-x-2">
                      <span className={cn(
                        'px-3 py-1 rounded-full text-sm font-medium',
                        userData.role === 'vet' ? 'bg-blue-100 text-blue-800' :
                        userData.role === 'shelter' ? 'bg-green-100 text-green-800' :
                        userData.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      )}>
                        {userData.role === 'vet' ? 'Veterinarian' : 
                         userData.role === 'shelter' ? 'Shelter' :
                         userData.role === 'admin' ? 'Admin' : 'Pet Owner'}
                      </span>
                      {userData.role === 'vet' && userData.isVetVerified && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <ShieldCheckIcon className="h-3 w-3 mr-1" />
                          Verified
                        </span>
                      )}
                      {userData.isEmailVerified && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <CheckCircleIcon className="h-3 w-3 mr-1" />
                          Email Verified
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center space-x-2">
                      {renderStars(userData.averageRating || 0)}
                      <span className="text-sm text-gray-600">
                        ({userData.averageRating || 0}/5 from {ratings.length} reviews)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6 mt-3 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <HeartIcon className="h-4 w-4" />
                      <span>{pets.length} pets</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CalendarIcon className="h-4 w-4" />
                      <span>Joined {new Date(userData.createdAt).toLocaleDateString()}</span>
                    </div>
                    {userData.location && (
                      <div className="flex items-center space-x-1">
                        <MapPinIcon className="h-4 w-4" />
                        <span>{userData.location}</span>
                      </div>
                    )}
                  </div>
                </div>
                {!isOwnProfile && (
                  <div className="flex space-x-3">
                    <button className="btn btn-outline">
                      <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                      Message
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'py-2 px-1 border-b-2 font-medium text-sm',
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>
      {}
      {activeTab === 'about' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            </div>
            <div className="card-content space-y-4">
              {userData.email && (
                <div className="flex items-center space-x-3">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-900">{userData.email}</span>
                </div>
              )}
              {userData.phone && (
                <div className="flex items-center space-x-3">
                  <PhoneIcon className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-900">{userData.phone}</span>
                </div>
              )}
              {userData.location && (
                <div className="flex items-center space-x-3">
                  <MapPinIcon className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-900">{userData.location}</span>
                </div>
              )}
              {userData.bio && (
                <div>
                  <label className="label">Bio</label>
                  <p className="text-gray-900">{userData.bio}</p>
                </div>
              )}
            </div>
          </div>
          {}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Statistics</h3>
            </div>
            <div className="card-content">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-primary-600">{pets.length}</div>
                  <div className="text-sm text-gray-600">Pets</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{userData.averageRating || 0}</div>
                  <div className="text-sm text-gray-600">Average Rating</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{ratings.length}</div>
                  <div className="text-sm text-gray-600">Reviews</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.floor((Date.now() - new Date(userData.createdAt)) / (1000 * 60 * 60 * 24))}
                  </div>
                  <div className="text-sm text-gray-600">Days Active</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'pets' && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">User's Pets</h3>
          </div>
          <div className="card-content">
            {petsLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="md" />
              </div>
            ) : pets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pets.map((pet) => (
                  <div key={pet._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-3 mb-3">
                      {pet.photos?.[0] ? (
                        <img
                          src={pet.photos[0]}
                          alt={pet.name}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 bg-gray-200 rounded-lg flex items-center justify-center">
                          <HeartIcon className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-semibold text-gray-900">{pet.name}</h4>
                        <p className="text-sm text-gray-600 capitalize">{pet.species} • {pet.breed}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/pets/${pet._id}`)}
                      className="btn btn-outline btn-sm w-full"
                    >
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <HeartIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No pets registered yet</p>
              </div>
            )}
          </div>
        </div>
      )}
      {activeTab === 'reviews' && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Reviews & Ratings</h3>
          </div>
          <div className="card-content">
            {ratingsLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="md" />
              </div>
            ) : ratings.length > 0 ? (
              <div className="space-y-4">
                {ratings.map((rating) => (
                  <div key={rating._id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          {renderStars(rating.rating)}
                        </div>
                        <span className="text-sm text-gray-600">
                          by {rating.reviewer?.name || 'Anonymous'}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(rating.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {rating.comment && (
                      <p className="text-gray-700">{rating.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <StarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No reviews yet</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
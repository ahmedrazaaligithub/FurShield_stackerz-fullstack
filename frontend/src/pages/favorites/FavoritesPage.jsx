import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { userAPI } from '../../services/api'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { 
  UserIcon,
  StarIcon,
  ChatBubbleLeftRightIcon,
  HeartIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid, HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'
import toast from 'react-hot-toast'

export default function FavoritesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: favorites, isLoading } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => userAPI.getFavoriteVets()
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

  const favoriteVets = favorites?.data?.data || []

  const handleChatVet = (vetId) => {
    // TODO: Implement chat functionality
    console.log('Chat with vet:', vetId)
  }

  const handleViewProfile = (vetId) => {
    navigate(`/vets/${vetId}`)
  }

  const handleRemoveFavorite = (vetId) => {
    if (window.confirm('Are you sure you want to remove this veterinarian from your favorites?')) {
      removeFavoriteMutation.mutate(vetId)
    }
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center">
          <HeartIconSolid className="h-8 w-8 text-red-500 mr-3" />
          My Favorite Veterinarians
        </h1>
        <p className="text-gray-600 mt-2">Your saved veterinary professionals</p>
      </div>

      {/* Favorites Grid */}
      {favoriteVets.length === 0 ? (
        <div className="text-center py-12">
          <HeartIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No favorites yet</h3>
          <p className="text-gray-600 mb-6">
            Start adding veterinarians to your favorites to see them here
          </p>
          <button
            onClick={() => navigate('/vets')}
            className="btn btn-primary"
          >
            Browse Veterinarians
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favoriteVets.map(vet => (
            <div key={vet._id} className="card hover:shadow-lg transition-shadow relative">
              {/* Remove from favorites button */}
              <button
                onClick={() => handleRemoveFavorite(vet._id)}
                className="absolute top-4 right-4 p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors z-10"
                title="Remove from favorites"
              >
                <TrashIcon className="h-5 w-5" />
              </button>

              <div className="card-content p-6">
                {/* Profile Header */}
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
                  <div className="flex-shrink-0">
                    <HeartIconSolid className="h-6 w-6 text-red-500" />
                  </div>
                </div>

                {/* Rating */}
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

                {/* Experience */}
                {vet.experience && (
                  <p className="text-sm text-gray-600 mb-3">
                    {vet.experience} years of experience
                  </p>
                )}

                {/* Bio */}
                {vet.bio && (
                  <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                    {vet.bio}
                  </p>
                )}

                {/* Languages */}
                {vet.languages && vet.languages.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {vet.languages.slice(0, 3).map((lang, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {lang}
                        </span>
                      ))}
                      {vet.languages.length > 3 && (
                        <span className="text-xs text-gray-500">+{vet.languages.length - 3} more</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
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
      )}

      {/* Stats */}
      {favoriteVets.length > 0 && (
        <div className="card">
          <div className="card-content p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-500 mb-2">
                {favoriteVets.length}
              </div>
              <div className="text-gray-600">
                Favorite Veterinarian{favoriteVets.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { 
  HeartIcon as HeartIconSolid, 
  StarIcon as StarIconSolid, 
  ChatBubbleLeftIcon, 
  EyeIcon,
  ShoppingBagIcon,
  HomeIcon,
  BuildingStorefrontIcon,
  PhotoIcon
} from '@heroicons/react/24/solid'
import { 
  HeartIcon,
  StarIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'
import { userAPI, petAPI } from '../../services/api'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { cn } from '../../utils/cn'
export default function FavoritesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('veterinarians')
  const [favoritePets, setFavoritePets] = useState(() => {
    const saved = localStorage.getItem('favoritePets')
    return saved ? new Set(JSON.parse(saved)) : new Set()
  })
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('favoritePets')
      setFavoritePets(saved ? new Set(JSON.parse(saved)) : new Set())
    }
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('favoritesUpdated', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('favoritesUpdated', handleStorageChange)
    }
  }, [])
  const { data: allPets } = useQuery({
    queryKey: ['pets'],
    queryFn: () => petAPI.getPets({}),
    enabled: favoritePets.size > 0
  })
  const favoritePetsData = allPets?.data?.data?.filter(pet => favoritePets.has(pet._id)) || []
  const handleRemovePetFavorite = (petId) => {
    setFavoritePets(prev => {
      const newFavorites = new Set(prev)
      newFavorites.delete(petId)
      localStorage.setItem('favoritePets', JSON.stringify([...newFavorites]))
      window.dispatchEvent(new CustomEvent('favoritesUpdated'))
      toast.success('Removed from favorites')
      return newFavorites
    })
  }
  const tabs = [
    { id: 'veterinarians', name: 'Veterinarians', icon: HeartIconSolid, count: 0 },
    { id: 'products', name: 'Products', icon: ShoppingBagIcon, count: 0 },
    { id: 'pets', name: 'Pets', icon: HomeIcon, count: favoritePets.size },
    { id: 'shelters', name: 'Shelters', icon: BuildingStorefrontIcon, count: 0 }
  ]
  const { data: favorites, isLoading, refetch } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => userAPI.getFavoriteVets(),
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
    cacheTime: 0
  })
  useEffect(() => {
    refetch()
  }, [refetch])
  const removeFavoriteMutation = useMutation({
    mutationFn: (vetId) => userAPI.removeFavoriteVet(vetId),
    onSuccess: () => {
      queryClient.invalidateQueries(['favorites'])
      queryClient.refetchQueries(['favorites'])
      toast.success('Removed from favorites')
      refetch() 
    },
    onError: (error) => {
      console.error('Remove favorite error:', error)
      toast.error(error.response?.data?.error || 'Failed to remove from favorites')
    }
  })
  const favoriteVetsData = favorites?.data?.data?.data || []
  console.log('Favorites API response:', favorites)
  console.log('Favorite vets data structure:', favorites?.data?.data)
  console.log('Favorite vets array:', favoriteVetsData)
  console.log('Favorites length:', favoriteVetsData.length)
  console.log('Is loading:', isLoading)
  const handleChatVet = (vetId) => {
    console.log('Chat with vet:', vetId)
  }
  const handleViewProfile = (vetId) => {
    navigate(`/vets/${vetId}`)
  }
  const handleRemoveFavorite = async (vetId, event) => {
    event.preventDefault()
    event.stopPropagation()
    console.log('Remove favorite clicked for vet:', vetId)
    if (window.confirm('Are you sure you want to remove this veterinarian from your favorites?')) {
      console.log('Removing vet from favorites:', vetId)
      removeFavoriteMutation.mutate(vetId)
    } else {
      console.log('Removal cancelled')
    }
  }
  if (isLoading) {
    return <LoadingSpinner />
  }
  const handleManualRefresh = () => {
    console.log('Manual refresh triggered')
    refetch()
  }
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center">
          <HeartIconSolid className="h-8 w-8 text-red-500 mr-3" />
          My Favorites
        </h1>
        <p className="text-gray-600 mt-2">Your saved items across all categories</p>
      </div>
      {}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  isActive
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-5 w-5 mr-2" />
                {tab.name}
                {tab.count > 0 && (
                  <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                    isActive ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>
      {}
      {activeTab === 'veterinarians' && (
        <>
          {favoriteVetsData.length === 0 ? (
            <div className="text-center py-12">
              <HeartIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No favorite veterinarians yet</h3>
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
          {favoriteVetsData.map(vet => (
            <div key={vet._id} className="card hover:shadow-lg transition-shadow relative">
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
                      {vet.specialization || vet.profile?.specialization || 'General Practice'}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <button
                      onClick={(event) => handleRemoveFavorite(vet._id, event)}
                      className="p-1 hover:bg-red-50 rounded-full transition-colors"
                      title="Remove from favorites"
                    >
                      <HeartIconSolid className="h-6 w-6 text-red-500" />
                    </button>
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
                {(vet.experience || vet.profile?.experience) && (
                  <p className="text-sm text-gray-600 mb-3">
                    {vet.experience || vet.profile?.experience} years of experience
                  </p>
                )}
                {}
                <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                  {vet.bio || `Dr. ${vet.name} is a dedicated veterinary professional committed to providing exceptional care for your beloved pets.`}
                </p>
                {}
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
      )}
      {}
      {favoriteVetsData.length > 0 && (
        <div className="card">
          <div className="card-content p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-500 mb-2">
                {favoriteVetsData.length}
              </div>
              <div className="text-gray-600">
                Favorite Veterinarian{favoriteVetsData.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>
      )}
          </>
      )}
      {}
      {activeTab === 'products' && (
        <div className="text-center py-12">
          <ShoppingBagIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No favorite products yet</h3>
          <p className="text-gray-600 mb-6">
            Start adding products to your favorites to see them here
          </p>
          <button
            onClick={() => navigate('/products')}
            className="btn btn-primary"
          >
            Browse Products
          </button>
        </div>
      )}
      {}
      {activeTab === 'pets' && (
        <>
          {favoritePets.size === 0 ? (
            <div className="text-center py-12">
              <HomeIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No favorite pets yet</h3>
              <p className="text-gray-600 mb-6">
                Start adding pets to your favorites to see them here
              </p>
              <button
                onClick={() => navigate('/pets')}
                className="btn btn-primary"
              >
                Browse Pets
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoritePetsData.map(pet => (
                <div key={pet._id} className="card hover:shadow-lg transition-shadow relative">
                  <div className="relative">
                    {pet.photos?.[0] ? (
                      <img
                        src={pet.photos[0]}
                        alt={pet.name}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-t-lg flex items-center justify-center">
                        <PhotoIcon className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4">
                      <span className={cn(
                        'badge text-xs',
                        pet.healthStatus === 'healthy' ? 'badge-success' :
                        pet.healthStatus === 'needs-attention' ? 'badge-warning' :
                        'badge-danger'
                      )}>
                        {pet.healthStatus?.replace('-', ' ')}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {pet.name}
                      </h3>
                      <button
                        onClick={() => handleRemovePetFavorite(pet._id)}
                        className="p-1 hover:bg-red-50 rounded-full transition-colors"
                        title="Remove from favorites"
                      >
                        <HeartIconSolid className="h-6 w-6 text-red-500" />
                      </button>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><span className="font-medium">Species:</span> {pet.species}</p>
                      <p><span className="font-medium">Breed:</span> {pet.breed}</p>
                      <p><span className="font-medium">Age:</span> {pet.age} years old</p>
                      {pet.weight && (
                        <p><span className="font-medium">Weight:</span> {pet.weight} lbs</p>
                      )}
                    </div>
                    {pet.medicalConditions?.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-500 mb-1">Medical Conditions:</p>
                        <div className="flex flex-wrap gap-1">
                          {pet.medicalConditions.slice(0, 2).map((condition, index) => (
                            <span key={index} className="badge badge-secondary text-xs">
                              {condition}
                            </span>
                          ))}
                          {pet.medicalConditions.length > 2 && (
                            <span className="badge badge-secondary text-xs">
                              +{pet.medicalConditions.length - 2} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                      <span>Added {new Date(pet.createdAt).toLocaleDateString()}</span>
                      <div className="flex items-center space-x-2">
                        <CalendarIcon className="h-4 w-4" />
                        <span>Next checkup due</span>
                      </div>
                    </div>
                    <div className="mt-4">
                      <button
                        onClick={() => navigate(`/pets/${pet._id}`)}
                        className="w-full btn btn-primary text-sm"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      {}
      {activeTab === 'shelters' && (
        <div className="text-center py-12">
          <BuildingStorefrontIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No favorite shelters yet</h3>
          <p className="text-gray-600 mb-6">
            Start adding shelters to your favorites to see them here
          </p>
          <button
            onClick={() => navigate('/shelters')}
            className="btn btn-primary"
          >
            Browse Shelters
          </button>
        </div>
      )}
    </div>
  )
}
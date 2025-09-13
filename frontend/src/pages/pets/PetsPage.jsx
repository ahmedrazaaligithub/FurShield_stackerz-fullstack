import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { petAPI, userAPI } from '../../services/api'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { useAuth } from '../../contexts/AuthContext'
import { 
  HeartIcon, 
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarIcon,
  PhotoIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'
import { cn } from '../../utils/cn'
const PetCard = ({ pet, onToggleFavorite, isFavorite }) => (
  <div className="card hover:shadow-glow transition-all duration-300 group relative">
    <Link to={`/pets/${pet._id}`} className="block">
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
          <h3 className="text-xl font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
            {pet.name}
          </h3>
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
      </div>
    </Link>
    {}
    <button
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onToggleFavorite(pet._id)
      }}
      className="absolute top-4 left-4 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors z-10"
      title={isFavorite ? "Remove from favorites" : "Add to favorites"}
    >
      {isFavorite ? (
        <HeartIconSolid className="h-5 w-5 text-red-500" />
      ) : (
        <HeartIcon className="h-5 w-5 text-gray-600 hover:text-red-500" />
      )}
    </button>
  </div>
)
export default function PetsPage() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [speciesFilter, setSpeciesFilter] = useState('')
  const [healthFilter, setHealthFilter] = useState('')
  const [favoritePets, setFavoritePets] = useState(() => {
    const saved = localStorage.getItem('favoritePets')
    return saved ? new Set(JSON.parse(saved)) : new Set()
  })
  const queryClient = useQueryClient()
  const isVet = user?.role === 'veterinarian' || user?.role === 'vet'
  const { data: pets, isLoading, error } = useQuery({
    queryKey: ['pets', { search: searchTerm, species: speciesFilter, health: healthFilter }],
    queryFn: () => {
      if (user?.role === 'shelter' || user?.role === 'owner') {
        return petAPI.getMyPets()
      } else {
        return petAPI.getPets({
          search: searchTerm || undefined,
          species: speciesFilter || undefined,
          healthStatus: healthFilter || undefined
        })
      }
    },
    enabled: !!user
  })
  const handleToggleFavorite = (petId) => {
    const newFavorites = new Set(favoritePets)
    if (newFavorites.has(petId)) {
      newFavorites.delete(petId)
      toast.success('Removed from favorites')
    } else {
      newFavorites.add(petId)
      toast.success('Added to favorites')
    }
    localStorage.setItem('favoritePets', JSON.stringify([...newFavorites]))
    setFavoritePets(newFavorites)
    window.dispatchEvent(new CustomEvent('favoritesUpdated'))
  }
  const filteredPets = pets?.data?.data || []
  return (
    <div className="space-y-6">
      {}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            All Pets
          </h1>
          <p className="text-gray-600 mt-1">
            Browse all pets from the community and connect with pet owners
          </p>
        </div>
        <Link to="/pets/add" className="btn btn-primary">
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Pet
        </Link>
      </div>
      {}
      <div className="card p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search pets by name, breed, or species..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <select
              value={speciesFilter}
              onChange={(e) => setSpeciesFilter(e.target.value)}
              className="input min-w-32"
            >
              <option value="">All Species</option>
              <option value="dog">Dogs</option>
              <option value="cat">Cats</option>
              <option value="bird">Birds</option>
              <option value="rabbit">Rabbits</option>
              <option value="fish">Fish</option>
              <option value="reptile">Reptiles</option>
              <option value="other">Other</option>
            </select>
            <select
              value={healthFilter}
              onChange={(e) => setHealthFilter(e.target.value)}
              className="input min-w-40"
            >
              <option value="">All Health Status</option>
              <option value="healthy">Healthy</option>
              <option value="needs-attention">Needs Attention</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>
      </div>
      {}
      {isLoading ? (
        <div className="flex justify-center items-center min-h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">
            <HeartIcon className="h-12 w-12 mx-auto mb-2" />
            <p className="text-lg font-medium">Failed to load pets</p>
            <p className="text-sm text-gray-600">Please try again later</p>
          </div>
        </div>
      ) : filteredPets.length === 0 ? (
        <div className="text-center py-12">
          <HeartIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || speciesFilter || healthFilter ? 'No pets found' : 'No pets yet'}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || speciesFilter || healthFilter 
              ? 'Try adjusting your search or filters'
              : 'No pets have been added to the community yet'
            }
          </p>
          <Link to="/pets/add" className="btn btn-primary">
            <PlusIcon className="h-4 w-4 mr-2" />
            Add First Pet
          </Link>
        </div>
      ) : (
        <>
          {}
          <div className="flex items-center justify-between">
            <p className="text-gray-600">
              {filteredPets.length} pet{filteredPets.length !== 1 ? 's' : ''} found
            </p>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <FunnelIcon className="h-4 w-4" />
              <span>Sort by: Name</span>
            </div>
          </div>
          {}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPets.map((pet) => (
              <PetCard 
                key={pet._id} 
                pet={pet} 
                onToggleFavorite={handleToggleFavorite}
                isFavorite={favoritePets.has(pet._id)}
              />
            ))}
          </div>
        </>
      )}
      {}
      {filteredPets.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">
                {filteredPets.filter(pet => pet.healthStatus === 'healthy').length}
              </div>
              <div className="text-sm text-gray-600">Healthy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {filteredPets.filter(pet => pet.healthStatus === 'needs-attention').length}
              </div>
              <div className="text-sm text-gray-600">Need Attention</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary-600">
                {filteredPets.filter(pet => pet.species === 'dog').length}
              </div>
              <div className="text-sm text-gray-600">Dogs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent-600">
                {filteredPets.filter(pet => pet.species === 'cat').length}
              </div>
              <div className="text-sm text-gray-600">Cats</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
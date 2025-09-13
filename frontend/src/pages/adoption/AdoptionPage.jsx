import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { adoptionAPI } from '../../services/api'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { 
  HeartIcon, 
  MagnifyingGlassIcon,
  MapPinIcon,
  CalendarIcon,
  FunnelIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '../../contexts/AuthContext'
import { cn } from '../../utils/cn'
const AdoptionCard = ({ listing }) => (
  <Link to={`/adoption/${listing._id}`} className="block">
    <div className="card hover:shadow-glow transition-all duration-300 group">
      <div className="relative">
        <img
          src={listing.pet?.photos?.[0] || listing.photos?.[0] || '/placeholder-pet.jpg'}
          alt={listing.title || listing.pet?.name}
          className="w-full h-48 object-cover rounded-t-lg"
        />
        <div className="absolute top-4 right-4">
          <span className={cn(
            'badge text-xs',
            listing.status === 'available' ? 'badge-success' :
            listing.status === 'pending' ? 'badge-warning' :
            'badge-secondary'
          )}>
            {listing.status}
          </span>
        </div>
        <div className="absolute top-4 left-4">
          <span className={cn(
            'badge text-xs',
            listing.priority === 'urgent' ? 'badge-danger' :
            listing.priority === 'high' ? 'badge-warning' :
            'badge-primary'
          )}>
            {listing.priority}
          </span>
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 group-hover:text-primary-600 transition-colors mb-2">
          {listing.title || listing.pet?.name}
        </h3>
        <div className="space-y-2 text-sm text-gray-600 mb-4">
          <div className="flex items-center">
            <span className="font-medium w-16">Species:</span>
            <span className="capitalize">{listing.pet?.species || listing.species}</span>
          </div>
          <div className="flex items-center">
            <span className="font-medium w-16">Age:</span>
            <span>{listing.pet?.age || listing.age} years old</span>
          </div>
          <div className="flex items-center">
            <span className="font-medium w-16">Gender:</span>
            <span className="capitalize">{listing.pet?.gender || listing.gender}</span>
          </div>
          {listing.shelter && (
            <div className="flex items-center">
              <MapPinIcon className="h-4 w-4 mr-1" />
              <span>{listing.shelter.name}</span>
            </div>
          )}
        </div>
        <p className="text-gray-700 text-sm mb-4 line-clamp-3">
          {listing.description}
        </p>
        {listing.specialNeeds && (
          <div className="mb-4">
            <span className="badge badge-warning text-xs">Special Needs</span>
          </div>
        )}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center">
            <CalendarIcon className="h-4 w-4 mr-1" />
            <span>Listed {new Date(listing.createdAt).toLocaleDateString()}</span>
          </div>
          <span className="text-primary-600 font-medium">
            {listing.inquiries?.length || 0} inquiries
          </span>
        </div>
      </div>
    </div>
  </Link>
)
export default function AdoptionPage() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [speciesFilter, setSpeciesFilter] = useState('')
  const [ageFilter, setAgeFilter] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [specialNeedsFilter, setSpecialNeedsFilter] = useState(false)
  const { data: listings, isLoading, error } = useQuery({
    queryKey: ['adoption-listings', { 
      search: searchTerm, 
      species: speciesFilter, 
      age: ageFilter,
      location: locationFilter,
      specialNeeds: specialNeedsFilter
    }],
    queryFn: () => adoptionAPI.getListings({
      search: searchTerm || undefined,
      species: speciesFilter || undefined,
      ageRange: ageFilter || undefined,
      location: locationFilter || undefined,
      specialNeeds: specialNeedsFilter || undefined,
      status: 'available'
    })
  })
  const filteredListings = listings?.data?.data || []
  return (
    <div className="space-y-6">
      {}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pet Adoption</h1>
          <p className="text-gray-600 mt-1">
            Find your perfect companion and give a pet a loving home
          </p>
        </div>
        {user?.role === 'shelter' && (
          <Link to="/adoption/create" className="btn btn-primary">
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Listing
          </Link>
        )}
      </div>
      {}
      <div className="card p-6">
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, breed, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={speciesFilter}
              onChange={(e) => setSpeciesFilter(e.target.value)}
              className="input"
            >
              <option value="">All Species</option>
              <option value="dog">Dogs</option>
              <option value="cat">Cats</option>
              <option value="bird">Birds</option>
              <option value="rabbit">Rabbits</option>
              <option value="other">Other</option>
            </select>
            <select
              value={ageFilter}
              onChange={(e) => setAgeFilter(e.target.value)}
              className="input"
            >
              <option value="">All Ages</option>
              <option value="young">Young (0-2 years)</option>
              <option value="adult">Adult (2-7 years)</option>
              <option value="senior">Senior (7+ years)</option>
            </select>
            <input
              type="text"
              placeholder="Location"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="input"
            />
            <label className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={specialNeedsFilter}
                onChange={(e) => setSpecialNeedsFilter(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Special Needs</span>
            </label>
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
            <p className="text-lg font-medium">Failed to load adoption listings</p>
            <p className="text-sm text-gray-600">Please try again later</p>
          </div>
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="text-center py-12">
          <HeartIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || speciesFilter || ageFilter || locationFilter 
              ? 'No pets found' 
              : 'No pets available for adoption'
            }
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || speciesFilter || ageFilter || locationFilter
              ? 'Try adjusting your search criteria'
              : 'Check back later for new adoption opportunities'
            }
          </p>
        </div>
      ) : (
        <>
          {}
          <div className="flex items-center justify-between">
            <p className="text-gray-600">
              {filteredListings.length} pet{filteredListings.length !== 1 ? 's' : ''} available for adoption
            </p>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <FunnelIcon className="h-4 w-4" />
              <span>Sort by: Most Recent</span>
            </div>
          </div>
          {}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((listing) => (
              <AdoptionCard key={listing._id} listing={listing} />
            ))}
          </div>
        </>
      )}
      {}
      <div className="card p-8 text-center bg-gradient-to-r from-primary-50 to-secondary-50">
        <HeartIcon className="h-12 w-12 text-primary-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Ready to Make a Difference?
        </h3>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
          Every pet deserves a loving home. Browse our available pets and find your perfect companion today.
          Our adoption process is designed to ensure the best match for both you and your new pet.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="#" className="btn btn-primary">
            Learn About Adoption Process
          </Link>
          <Link to="#" className="btn btn-outline">
            Volunteer at Shelters
          </Link>
        </div>
      </div>
      {}
      {filteredListings.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Adoption Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">
                {filteredListings.filter(l => l.species === 'dog').length}
              </div>
              <div className="text-sm text-gray-600">Dogs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary-600">
                {filteredListings.filter(l => l.species === 'cat').length}
              </div>
              <div className="text-sm text-gray-600">Cats</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {filteredListings.filter(l => l.specialNeeds).length}
              </div>
              <div className="text-sm text-gray-600">Special Needs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {filteredListings.filter(l => l.priority === 'urgent').length}
              </div>
              <div className="text-sm text-gray-600">Urgent</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { 
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  UserIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'
import { cn } from '../../utils/cn'
import toast from 'react-hot-toast'
import { adminAPI } from '../../services/api'
export default function AdminApprovalPage() {
  const [selectedItem, setSelectedItem] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const queryClient = useQueryClient()
  const { user, loading: authLoading } = useAuth()
  const { data: approvals, isLoading, error } = useQuery({
    queryKey: ['pending-approvals', statusFilter, typeFilter],
    queryFn: async () => {
      console.log('Making API call to get pending approvals...')
      console.log('Current token:', localStorage.getItem('token') ? 'Present' : 'Missing')
      console.log('Current user:', user)
      try {
        const result = await adminAPI.getPendingApprovals()
        console.log('API call successful:', result)
        console.log('Raw API response:', result)
        console.log('Result.data:', result.data)
        console.log('Result.data.data:', result.data?.data)
        if (result.data && result.data.success && result.data.data) {
          console.log('Using result.data.data structure')
          return result.data.data
        } else if (result.data && result.data.shelters && result.data.vets) {
          console.log('Using result.data structure')
          return result.data
        } else {
          console.log('Unexpected data structure:', result)
          return result.data || result
        }
      } catch (err) {
        console.error('API call failed:', err)
        console.error('Error details:', {
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data,
          message: err.message
        })
        throw err
      }
    },
    enabled: !!user && user.role === 'admin' && !authLoading, 
    retry: false,
    refetchOnWindowFocus: false,
    onSuccess: (data) => {
      console.log('Approvals data received:', data)
      console.log('Shelters in data:', data?.shelters)
      console.log('Vets in data:', data?.vets)
    },
    onError: (error) => {
      console.error('Error fetching approvals:', error)
      if (error.response?.status === 401) {
        toast.error('Authentication failed. Please login as admin.')
      } else if (error.response?.status === 403) {
        toast.error('Access denied. Admin privileges required.')
      } else {
        toast.error(`Failed to fetch approval applications: ${error.message}`)
      }
    }
  })
  const approveMutation = useMutation({
    mutationFn: ({ id, type, notes }) => {
      if (type === 'shelter') {
        return adminAPI.approveShelter(id, { notes })
      } else {
        return adminAPI.approveVet(id, { notes })
      }
    },
    onSuccess: (_, { type }) => {
      toast.success(`${type === 'shelter' ? 'Shelter' : 'Veterinarian'} approved successfully!`)
      queryClient.invalidateQueries(['pending-approvals'])
      setSelectedItem(null)
    },
    onError: () => {
      toast.error('Failed to approve application')
    }
  })
  const rejectMutation = useMutation({
    mutationFn: ({ id, type, reason }) => {
      if (type === 'shelter') {
        return adminAPI.rejectShelter(id, { reason })
      } else {
        return adminAPI.rejectVet(id, { reason })
      }
    },
    onSuccess: (_, { type }) => {
      toast.success(`${type === 'shelter' ? 'Shelter' : 'Veterinarian'} application rejected`)
      queryClient.invalidateQueries(['pending-approvals'])
      setSelectedItem(null)
    },
    onError: () => {
      toast.error('Failed to reject application')
    }
  })
  const handleApprove = (item) => {
    if (item._id && item._id.startsWith('507f1f77bcf86cd799439')) {
      toast.success(`Mock ${item.type === 'shelter' ? 'Shelter' : 'Veterinarian'} "${item.name}" approved successfully!`)
      queryClient.invalidateQueries(['pending-approvals'])
      return
    }
    const notes = prompt('Add any approval notes (optional):')
    approveMutation.mutate({ 
      id: item._id, 
      type: item.type || (item.capacity ? 'shelter' : 'vet'),
      notes 
    })
  }
  const handleReject = (item) => {
    if (item._id && item._id.startsWith('507f1f77bcf86cd799439')) {
      const reason = prompt('Please provide a reason for rejection:')
      if (reason) {
        toast.success(`Mock ${item.type === 'shelter' ? 'Shelter' : 'Veterinarian'} "${item.name}" rejected successfully!`)
        queryClient.invalidateQueries(['pending-approvals'])
      }
      return
    }
    const reason = prompt('Please provide a reason for rejection:')
    if (reason) {
      rejectMutation.mutate({ 
        id: item._id, 
        type: item.type || (item.capacity ? 'shelter' : 'vet'),
        reason 
      })
    }
  }
  const allItems = React.useMemo(() => {
    console.log('Processing approvals data:', approvals)
    if (!approvals) {
      console.log('No approvals data available')
      return []
    }
    const shelterList = approvals.shelters || []
    const vetList = approvals.vets || []
    console.log('Raw shelter list length:', shelterList.length)
    console.log('Raw vet list length:', vetList.length)
    console.log('First shelter:', shelterList[0])
    console.log('First vet:', vetList[0])
    const shelterItems = shelterList.map(shelter => ({
      ...shelter,
      type: 'shelter'
    }))
    const vetItems = vetList.map(vet => ({
      ...vet,
      type: 'vet'
    }))
    const combined = [...shelterItems, ...vetItems]
    console.log('Combined items length:', combined.length)
    console.log('First combined item:', combined[0])
    return combined
  }, [approvals])
  const typeFilteredItems = React.useMemo(() => {
    if (typeFilter === 'all') return allItems
    return allItems.filter(item => item.type === typeFilter)
  }, [allItems, typeFilter])
  const filteredItems = React.useMemo(() => {
    console.log('Filtering by status. Status filter:', statusFilter)
    console.log('Type filtered items before status filter:', typeFilteredItems.length)
    if (!statusFilter) {
      console.log('No status filter, returning all type filtered items')
      return typeFilteredItems
    }
    const result = typeFilteredItems.filter(item => {
      if (item.type === 'shelter') {
        const isPending = !item.isVerified
        const shouldShow = statusFilter === 'pending' ? isPending : !isPending
        console.log(`Shelter ${item.name}: isVerified=${item.isVerified}, isPending=${isPending}, shouldShow=${shouldShow}`)
        return shouldShow
      } else {
        const isPending = !item.isVetVerified || !item.isEmailVerified
        const shouldShow = statusFilter === 'pending' ? isPending : !isPending
        console.log(`Vet ${item.name}: isVetVerified=${item.isVetVerified}, isEmailVerified=${item.isEmailVerified}, isPending=${isPending}, shouldShow=${shouldShow}`)
        return shouldShow
      }
    })
    console.log('Filtered items after status filter:', result.length)
    return result
  }, [typeFilteredItems, statusFilter])
  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }
  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-red-600 mb-2">Authentication Required</h3>
          <p className="text-gray-600">Please login to access this page.</p>
        </div>
      </div>
    )
  }
  if (user.role !== 'admin') {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-red-600 mb-2">Access Denied</h3>
          <p className="text-gray-600">Admin privileges required to access this page.</p>
        </div>
      </div>
    )
  }
  if (error) {
    console.error('Approval fetch error:', error)
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-red-600 mb-2">Error Loading Applications</h3>
          <p className="text-gray-600">{error.message || 'Failed to load approval applications'}</p>
        </div>
      </div>
    )
  }
  console.log('Approvals response:', approvals)
  console.log('All items:', allItems)
  console.log('Type filtered items:', typeFilteredItems)
  console.log('Final filtered items:', filteredItems)
  console.log('Type filter:', typeFilter)
  console.log('Status filter:', statusFilter)
  return (
    <div className="space-y-6">
      {}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Application Approval</h1>
          <p className="text-gray-600 mt-1">Review and approve shelter and veterinarian applications</p>
        </div>
        <div className="text-sm text-gray-500">
          Pending Applications: {allItems.filter(item => {
            if (item.type === 'shelter') {
              return !item.isVerified
            } else {
              return !item.isVetVerified || !item.isEmailVerified
            }
          }).length}
        </div>
      </div>
      {}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Types</option>
            <option value="shelter">Shelters</option>
            <option value="vet">Veterinarians</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
          </select>
        </div>
      </div>
      {}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <ApplicationCard
            key={item._id}
            item={item}
            onViewDetails={() => setSelectedItem(item)}
            onApprove={() => handleApprove(item)}
            onReject={() => handleReject(item)}
            isApproving={approveMutation.isLoading}
            isRejecting={rejectMutation.isLoading}
          />
        ))}
      </div>
      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
          <p className="text-gray-500">No applications match your current filters.</p>
          <div className="mt-4 text-xs text-gray-400">
            <p>Debug: Total items: {allItems.length}, Filtered: {filteredItems.length}</p>
            <p>Type filter: {typeFilter}, Status filter: {statusFilter}</p>
          </div>
        </div>
      )}
      {}
      {selectedItem && (
        <ApplicationDetailsModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          isApproving={approveMutation.isLoading}
          isRejecting={rejectMutation.isLoading}
        />
      )}
    </div>
  )
}
function ApplicationCard({ item, onViewDetails, onApprove, onReject, isApproving, isRejecting }) {
  const isVet = item.type === 'vet'
  const isPending = isVet ? (!item.isVetVerified || !item.isEmailVerified) : !item.isVerified
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              {isVet ? (
                <UserIcon className="h-10 w-10 text-gray-400" />
              ) : (
                <BuildingOfficeIcon className="h-10 w-10 text-gray-400" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
              <p className="text-sm text-gray-600">
                {isVet ? `${item.profile?.specialization || 'Veterinarian'}` : `Est. ${item.established || 'N/A'}`}
              </p>
            </div>
          </div>
          <span className={cn(
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
            isPending ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
          )}>
            {isPending ? 'pending' : 'approved'}
          </span>
        </div>
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <EnvelopeIcon className="h-4 w-4 mr-2" />
            {item.email}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <PhoneIcon className="h-4 w-4 mr-2" />
            {item.phone}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <MapPinIcon className="h-4 w-4 mr-2" />
            {isVet ? item.address : `${item.address?.city || ''}, ${item.address?.state || ''}`}
          </div>
        </div>
        {isVet ? (
          <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
            <span>Experience: {item.profile?.experience || 0} years</span>
            <span>License: {item.profile?.licenseNumber || 'N/A'}</span>
          </div>
        ) : (
          <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
            <span>Capacity: {item.capacity || 0} animals</span>
            <span>License: {item.license || 'N/A'}</span>
          </div>
        )}
        <div className="flex space-x-2">
          <button
            onClick={onViewDetails}
            className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <EyeIcon className="h-4 w-4 mr-1 inline" />
            View Details
          </button>
          {isPending && (
            <>
              <button
                onClick={onApprove}
                disabled={isApproving}
                className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <CheckCircleIcon className="h-4 w-4 inline" />
              </button>
              <button
                onClick={onReject}
                disabled={isRejecting}
                className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                <XCircleIcon className="h-4 w-4 inline" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
function ApplicationDetailsModal({ item, onClose, onApprove, onReject, isApproving, isRejecting }) {
  const isVet = item.type === 'vet'
  const isPending = isVet ? (!item.isVetVerified || !item.isEmailVerified) : !item.isVerified
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{item.name}</h2>
              <p className="text-gray-600">{isVet ? 'Veterinarian' : 'Shelter'} Application Details</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircleIcon className="h-6 w-6" />
            </button>
          </div>
          <div className="space-y-6">
            {}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">{isVet ? 'Doctor Name' : 'Shelter Name'}</label>
                  <p className="mt-1 text-sm text-gray-900">{item.name}</p>
                </div>
                {isVet ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Specialization</label>
                      <p className="mt-1 text-sm text-gray-900">{item.profile?.specialization || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Experience</label>
                      <p className="mt-1 text-sm text-gray-900">{item.profile?.experience || 0} years</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">License Number</label>
                      <p className="mt-1 text-sm text-gray-900">{item.profile?.licenseNumber || 'N/A'}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Established</label>
                      <p className="mt-1 text-sm text-gray-900">{item.established || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">License Number</label>
                      <p className="mt-1 text-sm text-gray-900">{item.license || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Capacity</label>
                      <p className="mt-1 text-sm text-gray-900">{item.capacity || 0} animals</p>
                    </div>
                  </>
                )}
              </div>
            </div>
            {}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-900">{item.email}</span>
                </div>
                <div className="flex items-center">
                  <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-900">{item.phone}</span>
                </div>
                <div className="flex items-start">
                  <MapPinIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div className="text-sm text-gray-900">
                    {isVet ? (
                      <p>{item.address}</p>
                    ) : (
                      <>
                        <p>{item.address?.street}</p>
                        <p>{item.address?.city}, {item.address?.state} {item.address?.zipCode}</p>
                        <p>{item.address?.country}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{isVet ? 'Bio' : 'Description'}</h3>
              <p className="text-sm text-gray-700">{isVet ? item.profile?.bio : item.description}</p>
            </div>
            {}
            {isVet && item.profile?.location && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Practice Location</h3>
                <p className="text-sm text-gray-700">{item.profile.location}</p>
              </div>
            )}
            {}
            {!isVet && item.documents && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Submitted Documents</h3>
                <div className="space-y-2">
                  {item.documents.map((doc, index) => (
                    <div key={index} className="flex items-center p-2 bg-gray-50 rounded-lg">
                      <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="text-sm text-gray-900">{doc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {}
            {isPending && (
              <div className="flex space-x-4 pt-4 border-t">
                <button
                  onClick={() => onApprove(item)}
                  disabled={isApproving}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {isApproving ? 'Approving...' : `Approve ${isVet ? 'Veterinarian' : 'Shelter'}`}
                </button>
                <button
                  onClick={() => onReject(item)}
                  disabled={isRejecting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isRejecting ? 'Rejecting...' : 'Reject Application'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
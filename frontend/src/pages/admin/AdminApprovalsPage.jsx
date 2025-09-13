import { useState, useEffect } from 'react'
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  BuildingOfficeIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon
} from '@heroicons/react/24/outline'
import { cn } from '../../utils/cn'
const AdminApprovalsPage = () => {
  const [activeTab, setActiveTab] = useState('shelters')
  const [pendingShelters, setPendingShelters] = useState([])
  const [pendingVets, setPendingVets] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    fetchPendingApprovals()
  }, [])
  const fetchPendingApprovals = async () => {
    try {
      setLoading(true)
      const { adminAPI } = await import('../../services/api')
      const response = await adminAPI.getPendingApprovals()
      if (response.data) {
        setPendingShelters(response.data.data.shelters || [])
        setPendingVets(response.data.data.vets || [])
      }
    } catch (error) {
      console.error('Error fetching pending approvals:', error)
    } finally {
      setLoading(false)
    }
  }
  const handleApprove = async (type, id) => {
    try {
      const { adminAPI } = await import('../../services/api')
      const data = { notes: 'Approved by admin' }
      if (type === 'shelter') {
        await adminAPI.approveShelter(id, data)
        setPendingShelters(prev => prev.filter(shelter => shelter._id !== id))
      } else {
        await adminAPI.approveVet(id, data)
        setPendingVets(prev => prev.filter(vet => vet._id !== id))
      }
      alert(`${type === 'shelter' ? 'Shelter' : 'Veterinarian'} approved successfully!`)
    } catch (error) {
      console.error('Error approving:', error)
      alert(`Error: ${error.response?.data?.error || 'Failed to approve'}`)
    }
  }
  const handleReject = async (type, id) => {
    try {
      const reason = prompt('Please provide a reason for rejection:')
      if (!reason) return
      const { adminAPI } = await import('../../services/api')
      const data = { reason }
      if (type === 'shelter') {
        await adminAPI.rejectShelter(id, data)
        setPendingShelters(prev => prev.filter(shelter => shelter._id !== id))
      } else {
        await adminAPI.rejectVet(id, data)
        setPendingVets(prev => prev.filter(vet => vet._id !== id))
      }
      alert(`${type === 'shelter' ? 'Shelter' : 'Veterinarian'} rejected successfully!`)
    } catch (error) {
      console.error('Error rejecting:', error)
      alert(`Error: ${error.response?.data?.error || 'Failed to reject'}`)
    }
  }
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  const ShelterCard = ({ shelter }) => {
    const formatAddress = (address) => {
      if (typeof address === 'string') return address
      if (typeof address === 'object' && address) {
        const parts = [address.street, address.city, address.state, address.country].filter(Boolean)
        return parts.join(', ') || 'Address not provided'
      }
      return 'Address not provided'
    }
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{shelter.name}</h3>
              <p className="text-sm text-gray-500">
                License: {shelter.licenseNumber || 'Not provided'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1 text-sm text-gray-500">
            <ClockIcon className="h-4 w-4" />
            <span>{formatDate(shelter.createdAt)}</span>
          </div>
        </div>
        <div className="space-y-3 mb-6">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <EnvelopeIcon className="h-4 w-4" />
            <span>{shelter.email || 'Email not provided'}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <PhoneIcon className="h-4 w-4" />
            <span>{shelter.phone || 'Phone not provided'}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <MapPinIcon className="h-4 w-4" />
            <span>{formatAddress(shelter.address)}</span>
          </div>
          {shelter.description && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Description:</span>
              <p className="mt-1">{shelter.description}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Capacity:</span>
              <p className="text-gray-600">{shelter.capacity || 'Not specified'}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Services:</span>
              <p className="text-gray-600">
                {shelter.services && shelter.services.length > 0 
                  ? shelter.services.join(', ') 
                  : 'Not specified'}
              </p>
            </div>
          </div>
          {shelter.website && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span className="font-medium">Website:</span>
              <a href={shelter.website} target="_blank" rel="noopener noreferrer" 
                 className="text-blue-600 hover:underline">
                {shelter.website}
              </a>
            </div>
          )}
        </div>
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Documents:</h4>
          <div className="flex flex-wrap gap-2">
            {shelter.documents && shelter.documents.length > 0 ? (
              shelter.documents.map((doc, index) => (
                <span key={index} className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded">
                  {doc.originalName || doc.filename || doc}
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-500">No documents uploaded</span>
            )}
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => handleApprove('shelter', shelter._id)}
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
          >
            <CheckCircleIcon className="h-4 w-4" />
            <span>Approve</span>
          </button>
          <button
            onClick={() => handleReject('shelter', shelter._id)}
            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
          >
            <XCircleIcon className="h-4 w-4" />
            <span>Reject</span>
          </button>
        </div>
      </div>
    )
  }
  const VetCard = ({ vet }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <UserIcon className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{vet.name}</h3>
            <p className="text-sm text-gray-500">
              License: {vet.profile?.licenseNumber || 'Not provided'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-1 text-sm text-gray-500">
          <ClockIcon className="h-4 w-4" />
          <span>{formatDate(vet.createdAt)}</span>
        </div>
      </div>
      <div className="space-y-3 mb-6">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <EnvelopeIcon className="h-4 w-4" />
          <span>{vet.email || 'Email not provided'}</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <PhoneIcon className="h-4 w-4" />
          <span>{vet.phone || 'Phone not provided'}</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <MapPinIcon className="h-4 w-4" />
          <span>{vet.address || 'Address not provided'}</span>
        </div>
        {(vet.bio || vet.profile?.bio) && (
          <div className="text-sm text-gray-600">
            <span className="font-medium">Bio:</span>
            <p className="mt-1">{vet.bio || vet.profile?.bio}</p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Specialization:</span>
            <p className="text-gray-600">{vet.profile?.specialization || 'Not specified'}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Experience:</span>
            <p className="text-gray-600">
              {vet.profile?.experience ? `${vet.profile.experience} years` : 'Not specified'}
            </p>
          </div>
        </div>
        {vet.profile?.website && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span className="font-medium">Website:</span>
            <a href={vet.profile.website} target="_blank" rel="noopener noreferrer" 
               className="text-blue-600 hover:underline">
              {vet.profile.website}
            </a>
          </div>
        )}
        {vet.profile?.location && (
          <div className="text-sm text-gray-600">
            <span className="font-medium">Clinic Location:</span>
            <p className="text-gray-600">{vet.profile.location}</p>
          </div>
        )}
      </div>
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Verification Status:</h4>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs rounded-full ${
            vet.emailVerified 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            Email: {vet.emailVerified ? 'Verified' : 'Pending'}
          </span>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
            Role: {vet.role}
          </span>
        </div>
      </div>
      <div className="flex space-x-3">
        <button
          onClick={() => handleApprove('vet', vet._id)}
          className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
        >
          <CheckCircleIcon className="h-4 w-4" />
          <span>Approve</span>
        </button>
        <button
          onClick={() => handleReject('vet', vet._id)}
          className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
        >
          <XCircleIcon className="h-4 w-4" />
          <span>Reject</span>
        </button>
      </div>
    </div>
  )
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Approvals</h1>
          <p className="text-gray-600">Review and approve shelter and veterinarian applications</p>
        </div>
      </div>
      {}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('shelters')}
            className={cn(
              'py-2 px-1 border-b-2 font-medium text-sm',
              activeTab === 'shelters'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            Shelters ({pendingShelters.length})
          </button>
          <button
            onClick={() => setActiveTab('vets')}
            className={cn(
              'py-2 px-1 border-b-2 font-medium text-sm',
              activeTab === 'vets'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            Veterinarians ({pendingVets.length})
          </button>
        </nav>
      </div>
      {}
      <div className="space-y-6">
        {activeTab === 'shelters' && (
          <div>
            {pendingShelters.length === 0 ? (
              <div className="text-center py-12">
                <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No pending shelters</h3>
                <p className="mt-1 text-sm text-gray-500">All shelter applications have been processed.</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {pendingShelters.map((shelter) => (
                  <ShelterCard key={shelter.id} shelter={shelter} />
                ))}
              </div>
            )}
          </div>
        )}
        {activeTab === 'vets' && (
          <div>
            {pendingVets.length === 0 ? (
              <div className="text-center py-12">
                <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No pending veterinarians</h3>
                <p className="mt-1 text-sm text-gray-500">All veterinarian applications have been processed.</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {pendingVets.map((vet) => (
                  <VetCard key={vet.id} vet={vet} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
export default AdminApprovalsPage
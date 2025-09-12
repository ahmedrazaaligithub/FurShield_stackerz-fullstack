import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import { cn } from '../../utils/cn'
import toast from 'react-hot-toast'

export default function AdminShelterApprovalPage() {
  const [selectedShelter, setSelectedShelter] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const queryClient = useQueryClient()

  // Mock data for now - replace with actual API calls
  const { data: shelters, isLoading } = useQuery({
    queryKey: ['pending-shelters', statusFilter],
    queryFn: () => Promise.resolve({
      data: {
        data: [
          {
            _id: '1',
            name: 'Happy Paws Shelter',
            email: 'contact@happypaws.org',
            phone: '+1-555-0123',
            address: {
              street: '123 Animal Lane',
              city: 'Pet City',
              state: 'CA',
              zipCode: '90210',
              country: 'USA'
            },
            description: 'A loving shelter dedicated to finding homes for abandoned pets.',
            capacity: 50,
            established: '2015',
            license: 'SH-2015-001',
            status: 'pending',
            documents: ['license.pdf', 'insurance.pdf'],
            createdAt: new Date().toISOString()
          },
          {
            _id: '2',
            name: 'Rescue Haven',
            email: 'info@rescuehaven.com',
            phone: '+1-555-0456',
            address: {
              street: '456 Care Street',
              city: 'Animal Town',
              state: 'NY',
              zipCode: '10001',
              country: 'USA'
            },
            description: 'Emergency rescue and rehabilitation center for injured animals.',
            capacity: 75,
            established: '2018',
            license: 'SH-2018-045',
            status: 'pending',
            documents: ['license.pdf', 'certification.pdf'],
            createdAt: new Date().toISOString()
          }
        ]
      }
    })
  })

  const approveShelterMutation = useMutation({
    mutationFn: (shelterId) => {
      // Replace with actual API call
      return Promise.resolve({ success: true })
    },
    onSuccess: () => {
      toast.success('Shelter approved successfully!')
      queryClient.invalidateQueries(['pending-shelters'])
      setSelectedShelter(null)
    },
    onError: () => {
      toast.error('Failed to approve shelter')
    }
  })

  const rejectShelterMutation = useMutation({
    mutationFn: ({ shelterId, reason }) => {
      // Replace with actual API call
      return Promise.resolve({ success: true })
    },
    onSuccess: () => {
      toast.success('Shelter application rejected')
      queryClient.invalidateQueries(['pending-shelters'])
      setSelectedShelter(null)
    },
    onError: () => {
      toast.error('Failed to reject shelter')
    }
  })

  const handleApprove = (shelter) => {
    approveShelterMutation.mutate(shelter._id)
  }

  const handleReject = (shelter) => {
    const reason = prompt('Please provide a reason for rejection:')
    if (reason) {
      rejectShelterMutation.mutate({ shelterId: shelter._id, reason })
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const shelterList = shelters?.data?.data || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Shelter Approval</h1>
          <p className="text-gray-600 mt-1">Review and approve shelter applications</p>
        </div>
        <div className="text-sm text-gray-500">
          Pending Applications: {shelterList.filter(s => s.status === 'pending').length}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Applications</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Shelters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shelterList.map((shelter) => (
          <div key={shelter._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <BuildingOfficeIcon className="h-10 w-10 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{shelter.name}</h3>
                    <p className="text-sm text-gray-600">Est. {shelter.established}</p>
                  </div>
                </div>
                <span className={cn(
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                  shelter.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  shelter.status === 'approved' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                )}>
                  {shelter.status}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <EnvelopeIcon className="h-4 w-4 mr-2" />
                  {shelter.email}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <PhoneIcon className="h-4 w-4 mr-2" />
                  {shelter.phone}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPinIcon className="h-4 w-4 mr-2" />
                  {shelter.address.city}, {shelter.address.state}
                </div>
              </div>

              <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                {shelter.description}
              </p>

              <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                <span>Capacity: {shelter.capacity} animals</span>
                <span>License: {shelter.license}</span>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => setSelectedShelter(shelter)}
                  className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <EyeIcon className="h-4 w-4 mr-1 inline" />
                  View Details
                </button>
                
                {shelter.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleApprove(shelter)}
                      disabled={approveShelterMutation.isLoading}
                      className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      <CheckCircleIcon className="h-4 w-4 inline" />
                    </button>
                    <button
                      onClick={() => handleReject(shelter)}
                      disabled={rejectShelterMutation.isLoading}
                      className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      <XCircleIcon className="h-4 w-4 inline" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {shelterList.length === 0 && (
        <div className="text-center py-12">
          <BuildingOfficeIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No shelter applications</h3>
          <p className="text-gray-500">No shelter applications match your current filters.</p>
        </div>
      )}

      {/* Shelter Details Modal */}
      {selectedShelter && (
        <ShelterDetailsModal
          shelter={selectedShelter}
          onClose={() => setSelectedShelter(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          isApproving={approveShelterMutation.isLoading}
          isRejecting={rejectShelterMutation.isLoading}
        />
      )}
    </div>
  )
}

// Shelter Details Modal Component
function ShelterDetailsModal({ shelter, onClose, onApprove, onReject, isApproving, isRejecting }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{shelter.name}</h2>
              <p className="text-gray-600">Shelter Application Details</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircleIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Shelter Name</label>
                  <p className="mt-1 text-sm text-gray-900">{shelter.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Established</label>
                  <p className="mt-1 text-sm text-gray-900">{shelter.established}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">License Number</label>
                  <p className="mt-1 text-sm text-gray-900">{shelter.license}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Capacity</label>
                  <p className="mt-1 text-sm text-gray-900">{shelter.capacity} animals</p>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-900">{shelter.email}</span>
                </div>
                <div className="flex items-center">
                  <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-900">{shelter.phone}</span>
                </div>
                <div className="flex items-start">
                  <MapPinIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div className="text-sm text-gray-900">
                    <p>{shelter.address.street}</p>
                    <p>{shelter.address.city}, {shelter.address.state} {shelter.address.zipCode}</p>
                    <p>{shelter.address.country}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
              <p className="text-sm text-gray-700">{shelter.description}</p>
            </div>

            {/* Documents */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Submitted Documents</h3>
              <div className="space-y-2">
                {shelter.documents.map((doc, index) => (
                  <div key={index} className="flex items-center p-2 bg-gray-50 rounded-lg">
                    <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-sm text-gray-900">{doc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            {shelter.status === 'pending' && (
              <div className="flex space-x-4 pt-4 border-t">
                <button
                  onClick={() => onApprove(shelter)}
                  disabled={isApproving}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {isApproving ? 'Approving...' : 'Approve Shelter'}
                </button>
                <button
                  onClick={() => onReject(shelter)}
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

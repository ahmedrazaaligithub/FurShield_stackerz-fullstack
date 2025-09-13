import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { adoptionAPI } from '../../services/api'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { 
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  CalendarIcon,
  UserIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { cn } from '../../utils/cn'
import toast from 'react-hot-toast'
const InquiryCard = ({ inquiry, onStatusUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }
  return (
    <div className="card">
      <div className="card-content">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <UserIcon className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{inquiry.user?.name || 'Anonymous'}</h3>
              <p className="text-sm text-gray-600">{inquiry.user?.email}</p>
            </div>
          </div>
          <span className={cn('badge text-xs', getStatusColor(inquiry.status))}>
            {inquiry.status}
          </span>
        </div>
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 mb-2">
            Pet: {inquiry.adoptionListing?.pet?.name || inquiry.adoptionListing?.title}
          </h4>
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <CalendarIcon className="h-4 w-4 mr-1" />
            <span>Submitted {new Date(inquiry.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="mb-4">
          <p className={cn(
            'text-gray-700',
            !isExpanded && inquiry.message?.length > 150 ? 'line-clamp-3' : ''
          )}>
            {inquiry.message}
          </p>
          {inquiry.message?.length > 150 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-primary-600 text-sm mt-1 hover:text-primary-700"
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
        {inquiry.status === 'pending' && (
          <div className="flex space-x-2">
            <button
              onClick={() => onStatusUpdate(inquiry._id, 'approved')}
              className="btn btn-success btn-sm flex-1"
            >
              <CheckIcon className="h-4 w-4 mr-1" />
              Approve
            </button>
            <button
              onClick={() => onStatusUpdate(inquiry._id, 'rejected')}
              className="btn btn-danger btn-sm flex-1"
            >
              <XMarkIcon className="h-4 w-4 mr-1" />
              Reject
            </button>
          </div>
        )}
        {inquiry.status === 'approved' && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm">
              ✅ Approved - Contact the adopter to proceed with the adoption process.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
export default function InquiriesPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('all')
  const { data: inquiries, isLoading, error } = useQuery({
    queryKey: ['adoption-inquiries', user?.id, statusFilter],
    queryFn: () => adoptionAPI.getInquiries({ 
      shelterId: user?.id,
      status: statusFilter !== 'all' ? statusFilter : undefined
    }),
    enabled: !!user?.id && user?.role === 'shelter'
  })
  const updateStatusMutation = useMutation({
    mutationFn: ({ inquiryId, status }) => 
      adoptionAPI.updateInquiryStatus(inquiryId, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['adoption-inquiries'])
      toast.success('Inquiry status updated successfully')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update inquiry status')
    }
  })
  const handleStatusUpdate = (inquiryId, status) => {
    updateStatusMutation.mutate({ inquiryId, status })
  }
  const inquiriesData = inquiries?.data?.data || []
  const filteredInquiries = inquiriesData
  const stats = {
    total: inquiriesData.length,
    pending: inquiriesData.filter(i => i.status === 'pending').length,
    approved: inquiriesData.filter(i => i.status === 'approved').length,
    rejected: inquiriesData.filter(i => i.status === 'rejected').length
  }
  if (user?.role !== 'shelter') {
    return (
      <div className="text-center py-12">
        <ChatBubbleLeftRightIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Shelter Access Only</h2>
        <p className="text-gray-600">This page is only available for shelter representatives.</p>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      {}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Adoption Inquiries</h1>
        <p className="text-gray-600 mt-1">
          Manage and respond to adoption inquiries from potential adopters
        </p>
      </div>
      {}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Inquiries</div>
          </div>
        </div>
        <div className="card p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
        </div>
        <div className="card p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <div className="text-sm text-gray-600">Approved</div>
          </div>
        </div>
        <div className="card p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <div className="text-sm text-gray-600">Rejected</div>
          </div>
        </div>
      </div>
      {}
      <div className="card p-4">
        <div className="flex flex-wrap gap-2">
          {['all', 'pending', 'approved', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                'btn btn-sm',
                statusFilter === status ? 'btn-primary' : 'btn-outline'
              )}
            >
              {status === 'all' ? 'All Inquiries' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>
      {}
      {isLoading ? (
        <div className="flex justify-center items-center min-h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <ChatBubbleLeftRightIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">Failed to load inquiries</p>
          <p className="text-gray-600">Please try again later</p>
        </div>
      ) : filteredInquiries.length === 0 ? (
        <div className="text-center py-12">
          <EnvelopeIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {statusFilter === 'all' ? 'No inquiries yet' : `No ${statusFilter} inquiries`}
          </h3>
          <p className="text-gray-600 mb-6">
            {statusFilter === 'all' 
              ? 'When people inquire about your pets, they will appear here.'
              : `No inquiries with ${statusFilter} status found.`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInquiries.map((inquiry) => (
            <InquiryCard
              key={inquiry._id}
              inquiry={inquiry}
              onStatusUpdate={handleStatusUpdate}
            />
          ))}
        </div>
      )}
    </div>
  )
}
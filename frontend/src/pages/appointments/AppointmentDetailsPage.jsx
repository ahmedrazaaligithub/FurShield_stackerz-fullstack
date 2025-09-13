import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { appointmentAPI } from '../../services/api'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { 
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
  CheckIcon,
  XMarkIcon,
  DocumentTextIcon,
  PlusIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline'
import { cn } from '../../utils/cn'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import VetHealthRecordForm from '../../components/vets/VetHealthRecordForm'
export default function AppointmentDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [showRescheduleModal, setShowRescheduleModal] = useState(false)
  const [showAddRecordModal, setShowAddRecordModal] = useState(false)
  const [completionData, setCompletionData] = useState({
    diagnosis: '',
    treatment: '',
    prescription: '',
    followUpDate: '',
    cost: {
      consultation: '',
      treatment: '',
      medication: '',
      total: ''
    }
  })
  const [rescheduleData, setRescheduleData] = useState({
    proposedDate: '',
    reason: ''
  })
  const { data: appointment, isLoading, error } = useQuery({
    queryKey: ['appointment', id],
    queryFn: () => appointmentAPI.getAppointment(id)
  })
  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }) => appointmentAPI.cancelAppointment(id, { reason }),
    onSuccess: () => {
      toast.success('Appointment cancelled successfully')
      queryClient.invalidateQueries(['appointment', id])
      setShowCancelModal(false)
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to cancel appointment')
    }
  })
  const acceptMutation = useMutation({
    mutationFn: () => appointmentAPI.acceptAppointment(id),
    onSuccess: () => {
      toast.success('Appointment accepted successfully')
      queryClient.invalidateQueries(['appointment', id])
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to accept appointment')
    }
  })
  const completeMutation = useMutation({
    mutationFn: (data) => appointmentAPI.completeAppointment(id, data),
    onSuccess: () => {
      toast.success('Appointment completed successfully')
      queryClient.invalidateQueries(['appointment', id])
      setShowCompleteModal(false)
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to complete appointment')
    }
  })
  const rescheduleMutation = useMutation({
    mutationFn: (data) => appointmentAPI.proposeTimeChange(id, data),
    onSuccess: () => {
      toast.success('Reschedule proposal sent successfully')
      queryClient.invalidateQueries(['appointment', id])
      setShowRescheduleModal(false)
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to propose reschedule')
    }
  })
  const handleCancel = () => {
    if (!cancelReason.trim()) {
      toast.error('Please provide a reason for cancellation')
      return
    }
    cancelMutation.mutate({ id, reason: cancelReason })
  }
  const handleComplete = () => {
    if (!completionData.diagnosis.trim()) {
      toast.error('Please provide a diagnosis')
      return
    }
    if (!completionData.treatment.trim()) {
      toast.error('Please provide treatment details')
      return
    }
    completeMutation.mutate({
      diagnosis: completionData.diagnosis,
      treatment: completionData.treatment,
      followUpDate: completionData.followUpDate,
      prescription: completionData.prescription
        ? { notes: completionData.prescription, medications: [] }
        : undefined
    })
  }
  const handleReschedule = () => {
    if (!rescheduleData.proposedDate) {
      toast.error('Please select a new date and time')
      return
    }
    if (!rescheduleData.reason.trim()) {
      toast.error('Please provide a reason for rescheduling')
      return
    }
    rescheduleMutation.mutate(rescheduleData)
  }
  const isVet = user?.role === 'vet'
  const isAssignedVet = isVet && appointmentData?.vet?._id === user?.id
  const canManageAppointment = isAssignedVet || user?.role === 'admin'
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }
  if (error || !appointment?.data?.data) {
    return (
      <div className="text-center py-12">
        <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Appointment not found</h3>
        <p className="text-gray-600 mb-6">The appointment you're looking for doesn't exist or has been removed.</p>
        <button
          onClick={() => navigate('/appointments')}
          className="btn btn-primary"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Appointments
        </button>
      </div>
    )
  }
  const appointmentData = appointment.data.data
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/appointments')}
            className="btn btn-ghost p-2"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{appointmentData.type}</h1>
            <p className="text-gray-600">
              {appointmentData.pet?.name} • {appointmentData.pet?.species}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span className={cn(
            'badge text-sm px-3 py-1',
            appointmentData.status === 'confirmed' ? 'badge-success' :
            appointmentData.status === 'pending' ? 'badge-warning' :
            appointmentData.status === 'completed' ? 'badge-primary' :
            'badge-secondary'
          )}>
            {appointmentData.status}
          </span>
          {}
          {isAssignedVet && appointmentData.status === 'pending' && (
            <>
              <button
                onClick={() => acceptMutation.mutate()}
                disabled={acceptMutation.isPending}
                className="btn btn-primary"
              >
                <CheckIcon className="h-4 w-4 mr-2" />
                Accept
              </button>
              <button
                onClick={() => setShowCancelModal(true)}
                className="btn btn-outline text-red-600 border-red-300 hover:bg-red-50"
              >
                <XMarkIcon className="h-4 w-4 mr-2" />
                Reject
              </button>
            </>
          )}
          {}
          {appointmentData.status === 'confirmed' && (
            <>
              {isAssignedVet && (
                <button
                  onClick={() => setShowCompleteModal(true)}
                  className="btn btn-primary"
                >
                  <ClipboardDocumentCheckIcon className="h-4 w-4 mr-2" />
                  Complete
                </button>
              )}
              {isAssignedVet && (
                <button
                  onClick={() => setShowAddRecordModal(true)}
                  className="btn btn-secondary"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Health Record
                </button>
              )}
              <button
                onClick={() => setShowCancelModal(true)}
                className="btn btn-outline text-red-600 border-red-300 hover:bg-red-50"
              >
                <XMarkIcon className="h-4 w-4 mr-2" />
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {}
        <div className="lg:col-span-2 space-y-6">
          {}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900">Appointment Details</h2>
            </div>
            <div className="card-content space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium">
                      {new Date(appointmentData.appointmentDate || appointmentData.scheduledDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <ClockIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Time</p>
                    <p className="font-medium">
                      {new Date(appointmentData.appointmentDate || appointmentData.scheduledDate).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      {(appointmentData.estimatedDuration || appointmentData.duration) && (
                        <span className="text-gray-500 ml-2">
                          ({appointmentData.estimatedDuration || appointmentData.duration} min)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Veterinarian</p>
                    <p className="font-medium">
                      {appointmentData.vet ? `Dr. ${appointmentData.vet.name}` : 'Not assigned'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <HeartIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Pet</p>
                    <p className="font-medium">
                      {appointmentData.pet?.name} ({appointmentData.pet?.breed})
                    </p>
                  </div>
                </div>
              </div>
              {appointmentData.reason && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Reason for Visit</p>
                  <p className="text-gray-900">{appointmentData.reason}</p>
                </div>
              )}
              {appointmentData.notes && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Additional Notes</p>
                  <p className="text-gray-900">{appointmentData.notes}</p>
                </div>
              )}
            </div>
          </div>
          {}
          {appointmentData.status === 'confirmed' && (
            <div className="card">
              <div className="card-header">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Communication</h2>
                  <button className="btn btn-primary btn-sm">
                    <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                    Start Chat
                  </button>
                </div>
              </div>
              <div className="card-content">
                <div className="text-center py-8">
                  <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No messages yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Start a conversation with your veterinarian
                  </p>
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
              <h3 className="text-lg font-semibold text-gray-900">Pet Information</h3>
            </div>
            <div className="card-content">
              <div className="flex items-center space-x-4 mb-4">
                {appointmentData.pet?.photos?.[0] ? (
                  <img
                    src={appointmentData.pet.photos[0]}
                    alt={appointmentData.pet.name}
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 bg-gray-200 rounded-lg flex items-center justify-center">
                    <HeartIcon className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                <div>
                  <h4 className="font-medium text-gray-900">{appointmentData.pet?.name}</h4>
                  <p className="text-sm text-gray-600">
                    {appointmentData.pet?.species} • {appointmentData.pet?.breed}
                  </p>
                  <p className="text-sm text-gray-600">
                    {appointmentData.pet?.age} years old
                  </p>
                </div>
              </div>
              {appointmentData.pet?.medicalConditions?.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Medical Conditions</p>
                  <div className="flex flex-wrap gap-1">
                    {appointmentData.pet.medicalConditions.map((condition, index) => (
                      <span key={index} className="badge badge-secondary text-xs">
                        {condition}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          {}
          {appointmentData.vet && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900">Veterinarian</h3>
              </div>
              <div className="card-content">
                <div className="flex items-center space-x-4">
                  {appointmentData.vet.avatar ? (
                    <img
                      src={appointmentData.vet.avatar}
                      alt={appointmentData.vet.name}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <UserIcon className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <h4 className="font-medium text-gray-900">Dr. {appointmentData.vet.name}</h4>
                    <p className="text-sm text-gray-600">
                      {appointmentData.vet.specialization || 'General Practice'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          {}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Actions</h3>
            </div>
            <div className="card-content space-y-3">
              {}
              {isAssignedVet && appointmentData.status === 'pending' && (
                <button
                  onClick={() => acceptMutation.mutate()}
                  disabled={acceptMutation.isPending}
                  className="btn btn-primary w-full"
                >
                  <CheckIcon className="h-4 w-4 mr-2" />
                  Accept Appointment
                </button>
              )}
              {isAssignedVet && appointmentData.status === 'confirmed' && (
                <button
                  onClick={() => setShowCompleteModal(true)}
                  className="btn btn-primary w-full"
                >
                  <ClipboardDocumentCheckIcon className="h-4 w-4 mr-2" />
                  Complete with Diagnosis
                </button>
              )}
              {}
              {(appointmentData.status === 'confirmed' || appointmentData.status === 'pending') && (
                <button 
                  onClick={() => setShowRescheduleModal(true)}
                  className="btn btn-outline w-full"
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Propose Reschedule
                </button>
              )}
              {appointmentData.status === 'completed' && (
                <button className="btn btn-outline w-full">
                  <DocumentTextIcon className="h-4 w-4 mr-2" />
                  Download Report
                </button>
              )}
              <button className="btn btn-outline w-full">
                <DocumentTextIcon className="h-4 w-4 mr-2" />
                Download Receipt
              </button>
            </div>
          </div>
        </div>
      </div>
      {}
      {showCancelModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {appointmentData.status === 'pending' && isAssignedVet ? 'Reject Appointment' : 'Cancel Appointment'}
            </h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for {appointmentData.status === 'pending' && isAssignedVet ? 'rejecting' : 'cancelling'} this appointment:
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              className="textarea w-full mb-4"
              placeholder="Reason for cancellation..."
            />
            <div className="flex space-x-3">
              <button
                onClick={handleCancel}
                disabled={cancelMutation.isPending}
                className="btn btn-primary flex-1"
              >
                {cancelMutation.isPending ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : null}
                {appointmentData.status === 'pending' && isAssignedVet ? 'Confirm Reject' : 'Confirm Cancel'}
              </button>
              <button
                onClick={() => setShowCancelModal(false)}
                className="btn btn-outline flex-1"
              >
                Keep Appointment
              </button>
            </div>
          </div>
        </div>
      )}
      {}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Complete Appointment</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis *</label>
                <textarea
                  value={completionData.diagnosis}
                  onChange={(e) => setCompletionData({...completionData, diagnosis: e.target.value})}
                  rows={3}
                  className="textarea w-full"
                  placeholder="Enter diagnosis..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Treatment *</label>
                <textarea
                  value={completionData.treatment}
                  onChange={(e) => setCompletionData({...completionData, treatment: e.target.value})}
                  rows={3}
                  className="textarea w-full"
                  placeholder="Enter treatment details..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prescription</label>
                <textarea
                  value={completionData.prescription}
                  onChange={(e) => setCompletionData({...completionData, prescription: e.target.value})}
                  rows={2}
                  className="textarea w-full"
                  placeholder="Enter prescription details..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Date</label>
                <input
                  type="date"
                  value={completionData.followUpDate}
                  onChange={(e) => setCompletionData({...completionData, followUpDate: e.target.value})}
                  className="input w-full"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Fee</label>
                  <input
                    type="number"
                    value={completionData.cost.consultation}
                    onChange={(e) => setCompletionData({
                      ...completionData, 
                      cost: {...completionData.cost, consultation: e.target.value}
                    })}
                    className="input w-full"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Treatment Cost</label>
                  <input
                    type="number"
                    value={completionData.cost.treatment}
                    onChange={(e) => setCompletionData({
                      ...completionData, 
                      cost: {...completionData.cost, treatment: e.target.value}
                    })}
                    className="input w-full"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Medication Cost</label>
                  <input
                    type="number"
                    value={completionData.cost.medication}
                    onChange={(e) => setCompletionData({
                      ...completionData, 
                      cost: {...completionData.cost, medication: e.target.value}
                    })}
                    className="input w-full"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Cost</label>
                  <input
                    type="number"
                    value={completionData.cost.total}
                    onChange={(e) => setCompletionData({
                      ...completionData, 
                      cost: {...completionData.cost, total: e.target.value}
                    })}
                    className="input w-full"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleComplete}
                disabled={completeMutation.isPending}
                className="btn btn-primary flex-1"
              >
                {completeMutation.isPending ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : null}
                Complete Appointment
              </button>
              <button
                onClick={() => setShowCompleteModal(false)}
                className="btn btn-outline flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {}
      {showRescheduleModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Propose Reschedule</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Date & Time *</label>
                <input
                  type="datetime-local"
                  value={rescheduleData.proposedDate}
                  onChange={(e) => setRescheduleData({...rescheduleData, proposedDate: e.target.value})}
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                <textarea
                  value={rescheduleData.reason}
                  onChange={(e) => setRescheduleData({...rescheduleData, reason: e.target.value})}
                  rows={3}
                  className="textarea w-full"
                  placeholder="Reason for rescheduling..."
                  required
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleReschedule}
                disabled={rescheduleMutation.isPending}
                className="btn btn-primary flex-1"
              >
                {rescheduleMutation.isPending ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : null}
                Propose Reschedule
              </button>
              <button
                onClick={() => setShowRescheduleModal(false)}
                className="btn btn-outline flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {}
      {showAddRecordModal && (
        <VetHealthRecordForm
          pet={appointmentData.pet}
          appointment={appointmentData}
          onClose={() => setShowAddRecordModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries(['pet-health-records', appointmentData.pet._id])
          }}
        />
      )}
    </div>
  )
}
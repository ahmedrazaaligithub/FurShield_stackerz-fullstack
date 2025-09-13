import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { petAPI } from '../../services/api'
import { 
  PlusIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  TrashIcon,
  PencilIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { uploadImageToCloudinary } from '../../utils/uploadImage'
export default function PetInsurance({ pet, isOwner }) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingInsurance, setEditingInsurance] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [formData, setFormData] = useState({
    provider: '',
    policyNumber: '',
    policyType: 'comprehensive',
    startDate: '',
    endDate: '',
    premium: '',
    coverage: '',
    deductible: '',
    claimLimit: '',
    documents: [],
    notes: ''
  })
  const queryClient = useQueryClient()
  const insuranceData = pet.insurance || {
    policies: [],
    claims: []
  }
  const addInsuranceMutation = useMutation({
    mutationFn: (data) => petAPI.addInsurance(pet._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['pet', pet._id])
      toast.success('Insurance policy added successfully')
      setShowAddModal(false)
      resetForm()
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to add insurance')
    }
  })
  const deleteInsuranceMutation = useMutation({
    mutationFn: (policyId) => petAPI.deleteInsurance(pet._id, policyId),
    onSuccess: () => {
      queryClient.invalidateQueries(['pet', pet._id])
      toast.success('Insurance policy deleted successfully')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete insurance')
    }
  })
  const handleDocumentUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return
    setIsUploading(true)
    try {
      const uploadPromises = files.map(file => uploadImageToCloudinary(file))
      const uploadedUrls = await Promise.all(uploadPromises)
      setFormData(prev => ({
        ...prev,
        documents: [...prev.documents, ...uploadedUrls.map((url, index) => ({
          url,
          name: files[index].name,
          type: files[index].type,
          uploadedAt: new Date().toISOString()
        }))]
      }))
      toast.success('Documents uploaded successfully')
    } catch (error) {
      toast.error('Failed to upload documents')
    } finally {
      setIsUploading(false)
    }
  }
  const handleSubmit = (e) => {
    e.preventDefault()
    const insuranceData = {
      ...formData,
      premium: parseFloat(formData.premium),
      deductible: parseFloat(formData.deductible),
      claimLimit: parseFloat(formData.claimLimit)
    }
    if (editingInsurance) {
      insuranceData.policyId = editingInsurance._id
    } else {
      addInsuranceMutation.mutate(insuranceData)
    }
  }
  const resetForm = () => {
    setFormData({
      provider: '',
      policyNumber: '',
      policyType: 'comprehensive',
      startDate: '',
      endDate: '',
      premium: '',
      coverage: '',
      deductible: '',
      claimLimit: '',
      documents: [],
      notes: ''
    })
    setEditingInsurance(null)
  }
  const calculateDaysRemaining = (endDate) => {
    const today = new Date()
    const end = new Date(endDate)
    const diffTime = end - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }
  return (
    <div className="space-y-6">
      {}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Insurance Information</h2>
          <p className="text-sm text-gray-600 mt-1">Manage pet insurance policies and claims</p>
        </div>
        {isOwner && (
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Policy
          </button>
        )}
      </div>
      {}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Active Policies</h3>
        {insuranceData.policies?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insuranceData.policies.map((policy) => {
              const daysRemaining = calculateDaysRemaining(policy.endDate)
              const isExpiring = daysRemaining <= 30 && daysRemaining > 0
              const isExpired = daysRemaining <= 0
              return (
                <div key={policy._id} className="bg-white border rounded-xl p-6 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        isExpired ? 'bg-red-100' : isExpiring ? 'bg-yellow-100' : 'bg-green-100'
                      }`}>
                        <ShieldCheckIcon className={`h-6 w-6 ${
                          isExpired ? 'text-red-600' : isExpiring ? 'text-yellow-600' : 'text-green-600'
                        }`} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{policy.provider}</h4>
                        <p className="text-sm text-gray-500">Policy #{policy.policyNumber}</p>
                      </div>
                    </div>
                    {isOwner && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setEditingInsurance(policy)
                            setFormData(policy)
                            setShowAddModal(true)
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteInsuranceMutation.mutate(policy._id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium capitalize">{policy.policyType}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Premium:</span>
                      <span className="font-medium">${policy.premium}/month</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Deductible:</span>
                      <span className="font-medium">${policy.deductible}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Coverage Limit:</span>
                      <span className="font-medium">${policy.claimLimit}/year</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Valid Until:</span>
                      <span className={`font-medium ${
                        isExpired ? 'text-red-600' : isExpiring ? 'text-yellow-600' : 'text-gray-900'
                      }`}>
                        {new Date(policy.endDate).toLocaleDateString()}
                        {isExpired && ' (Expired)'}
                        {isExpiring && ` (${daysRemaining} days left)`}
                      </span>
                    </div>
                  </div>
                  {policy.coverage && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-gray-600">Coverage: {policy.coverage}</p>
                    </div>
                  )}
                  {policy.documents?.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-gray-600 mb-2">Documents:</p>
                      <div className="flex flex-wrap gap-2">
                        {policy.documents.map((doc, index) => (
                          <a
                            key={index}
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200"
                          >
                            📄 {doc.name}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  {isExpiring && isOwner && (
                    <div className="mt-3 p-2 bg-yellow-50 rounded-lg">
                      <p className="text-xs text-yellow-800 flex items-center">
                        <CalendarDaysIcon className="h-4 w-4 mr-1" />
                        Policy expires in {daysRemaining} days. Consider renewal.
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl p-8 text-center">
            <ShieldCheckIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-4">No insurance policies added yet</p>
            {isOwner && (
              <button
                onClick={() => setShowAddModal(true)}
                className="btn btn-primary btn-sm"
              >
                Add Your First Policy
              </button>
            )}
          </div>
        )}
      </div>
      {}
      {insuranceData.claims?.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Claims History</h3>
          <div className="bg-white border rounded-xl overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Claim #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {insuranceData.claims.map((claim) => (
                  <tr key={claim._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(claim.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {claim.claimNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${claim.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        claim.status === 'approved' ? 'bg-green-100 text-green-800' :
                        claim.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        claim.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {claim.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {claim.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {editingInsurance ? 'Edit' : 'Add'} Insurance Policy
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Insurance Provider *
                    </label>
                    <input
                      type="text"
                      value={formData.provider}
                      onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Policy Number *
                    </label>
                    <input
                      type="text"
                      value={formData.policyNumber}
                      onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Policy Type *
                  </label>
                  <select
                    value={formData.policyType}
                    onChange={(e) => setFormData({ ...formData, policyType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="comprehensive">Comprehensive</option>
                    <option value="accident">Accident Only</option>
                    <option value="wellness">Wellness</option>
                    <option value="liability">Liability</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date *
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monthly Premium ($) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.premium}
                      onChange={(e) => setFormData({ ...formData, premium: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Deductible ($) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.deductible}
                      onChange={(e) => setFormData({ ...formData, deductible: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Annual Limit ($) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.claimLimit}
                      onChange={(e) => setFormData({ ...formData, claimLimit: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Coverage Details
                  </label>
                  <textarea
                    value={formData.coverage}
                    onChange={(e) => setFormData({ ...formData, coverage: e.target.value })}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="What does this policy cover?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Policy Documents
                  </label>
                  <div className="flex items-center space-x-4">
                    <label className="flex-1 flex items-center justify-center px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 cursor-pointer">
                      <CloudArrowUpIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">
                        {isUploading ? 'Uploading...' : 'Choose files or drag & drop'}
                      </span>
                      <input
                        type="file"
                        multiple
                        accept="image/*,.pdf"
                        onChange={handleDocumentUpload}
                        disabled={isUploading}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {formData.documents.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {formData.documents.map((doc, index) => (
                        <div key={index} className="flex items-center text-sm text-gray-600">
                          <DocumentTextIcon className="h-4 w-4 mr-2 text-gray-400" />
                          {doc.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false)
                      resetForm()
                    }}
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addInsuranceMutation.isPending || isUploading}
                    className="btn btn-primary"
                  >
                    {addInsuranceMutation.isPending ? 'Saving...' : editingInsurance ? 'Update' : 'Add'} Policy
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
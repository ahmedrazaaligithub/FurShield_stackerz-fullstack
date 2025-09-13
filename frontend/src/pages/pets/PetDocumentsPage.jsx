import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { petAPI, documentAPI } from '../../services/api'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { 
  ArrowLeftIcon,
  PlusIcon,
  DocumentTextIcon,
  EyeIcon,
  TrashIcon,
  PencilIcon,
  FolderIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  BeakerIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
const documentTypes = [
  { value: 'vet-certificate', label: 'Vet Certificate', icon: ShieldCheckIcon, color: 'text-green-600' },
  { value: 'lab-report', label: 'Lab Report', icon: BeakerIcon, color: 'text-blue-600' },
  { value: 'insurance-document', label: 'Insurance Document', icon: DocumentTextIcon, color: 'text-purple-600' },
  { value: 'vaccination-record', label: 'Vaccination Record', icon: ShieldCheckIcon, color: 'text-green-600' },
  { value: 'medical-report', label: 'Medical Report', icon: ClipboardDocumentCheckIcon, color: 'text-red-600' },
  { value: 'x-ray', label: 'X-Ray', icon: DocumentTextIcon, color: 'text-gray-600' },
  { value: 'prescription', label: 'Prescription', icon: DocumentTextIcon, color: 'text-orange-600' },
  { value: 'other', label: 'Other', icon: FolderIcon, color: 'text-gray-600' }
]
const categories = [
  { value: 'medical', label: 'Medical' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'legal', label: 'Legal' },
  { value: 'identification', label: 'Identification' },
  { value: 'other', label: 'Other' }
]
export default function PetDocumentsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [uploadData, setUploadData] = useState({
    type: 'vet-certificate',
    category: 'medical',
    title: '',
    description: '',
    issuedDate: '',
    expiryDate: '',
    issuedBy: '',
    tags: '',
    veterinarian: '',
    clinic: '',
    testType: '',
    results: '',
    insuranceProvider: '',
    policyNumber: '',
    claimNumber: ''
  })
  const [filter, setFilter] = useState('all')
  const { data: pet, isLoading: petLoading } = useQuery({
    queryKey: ['pet', id],
    queryFn: () => petAPI.getPet(id),
    enabled: !!id
  })
  const { data: documentsData, isLoading: documentsLoading } = useQuery({
    queryKey: ['pet-documents', id, filter],
    queryFn: () => documentAPI.getPetDocuments(id, { type: filter === 'all' ? undefined : filter }),
    enabled: !!id
  })
  const uploadMutation = useMutation({
    mutationFn: ({ petId, formData }) => documentAPI.uploadDocuments(petId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries(['pet-documents', id])
      toast.success('Documents uploaded successfully!')
      setShowUploadModal(false)
      resetUploadForm()
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to upload documents')
    }
  })
  const deleteMutation = useMutation({
    mutationFn: documentAPI.deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries(['pet-documents', id])
      toast.success('Document deleted successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete document')
    }
  })
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    setSelectedFiles(files)
    if (files.length === 1) {
      setUploadData(prev => ({
        ...prev,
        title: files[0].name.split('.')[0]
      }))
    }
  }
  const handleUpload = async (e) => {
    e.preventDefault()
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one file')
      return
    }
    const formData = new FormData()
    selectedFiles.forEach(file => {
      formData.append('documents', file)
    })
    Object.keys(uploadData).forEach(key => {
      if (uploadData[key]) {
        formData.append(key, uploadData[key])
      }
    })
    uploadMutation.mutate({ petId: id, formData })
  }
  const resetUploadForm = () => {
    setSelectedFiles([])
    setUploadData({
      type: 'vet-certificate',
      category: 'medical',
      title: '',
      description: '',
      issuedDate: '',
      expiryDate: '',
      issuedBy: '',
      tags: '',
      veterinarian: '',
      clinic: '',
      testType: '',
      results: '',
      insuranceProvider: '',
      policyNumber: '',
      claimNumber: ''
    })
  }
  const getDocumentIcon = (type) => {
    const docType = documentTypes.find(dt => dt.value === type)
    return docType ? docType.icon : DocumentTextIcon
  }
  const getDocumentColor = (type) => {
    const docType = documentTypes.find(dt => dt.value === type)
    return docType ? docType.color : 'text-gray-600'
  }
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
  const isExpired = (expiryDate) => {
    return expiryDate && new Date(expiryDate) < new Date()
  }
  if (petLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }
  const documents = documentsData?.data?.data || []
  const filteredDocuments = filter === 'all' ? documents : documents.filter(doc => doc.type === filter)
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(`/pets/${id}`)}
            className="btn btn-ghost p-2"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {pet?.data?.data?.name}'s Documents
            </h1>
            <p className="text-gray-600">Manage medical records, certificates, and reports</p>
          </div>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="btn btn-primary"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Upload Documents
        </button>
      </div>
      {}
      <div className="flex items-center space-x-4 bg-white p-4 rounded-xl border">
        <label className="text-sm font-medium text-gray-700">Filter by type:</label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">All Documents ({documents.length})</option>
          {documentTypes.map(type => {
            const count = documents.filter(doc => doc.type === type.value).length
            return (
              <option key={type.value} value={type.value}>
                {type.label} ({count})
              </option>
            )
          })}
        </select>
      </div>
      {}
      {documentsLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredDocuments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map((document) => {
            const Icon = getDocumentIcon(document.type)
            const colorClass = getDocumentColor(document.type)
            const expired = isExpired(document.expiryDate)
            return (
              <div key={document._id} className="bg-white border rounded-xl p-6 hover:shadow-lg transition-shadow">
                {}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg bg-gray-50 ${colorClass}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{document.title}</h3>
                      <p className="text-sm text-gray-500 capitalize">
                        {document.type.replace('-', ' ')}
                      </p>
                    </div>
                  </div>
                  {expired && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                      Expired
                    </span>
                  )}
                </div>
                {}
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <p>Size: {formatFileSize(document.size)}</p>
                  <p>Uploaded: {new Date(document.createdAt).toLocaleDateString()}</p>
                  {document.issuedDate && (
                    <p>Issued: {new Date(document.issuedDate).toLocaleDateString()}</p>
                  )}
                  {document.expiryDate && (
                    <p className={expired ? 'text-red-600 font-medium' : ''}>
                      Expires: {new Date(document.expiryDate).toLocaleDateString()}
                    </p>
                  )}
                  {document.issuedBy && (
                    <p>Issued by: {document.issuedBy}</p>
                  )}
                </div>
                {}
                {document.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {document.description}
                  </p>
                )}
                {}
                {document.tags && document.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {document.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                {}
                <div className="flex space-x-2">
                  <a
                    href={document.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 btn btn-outline btn-sm"
                  >
                    <EyeIcon className="h-4 w-4 mr-1" />
                    View
                  </a>
                  <button
                    onClick={() => deleteMutation.mutate(document._id)}
                    className="btn btn-danger btn-sm"
                    disabled={deleteMutation.isPending}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <DocumentTextIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Documents</h3>
          <p className="text-gray-500 mb-4">
            {filter === 'all' 
              ? "No documents have been uploaded yet." 
              : `No ${filter.replace('-', ' ')} documents found.`
            }
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn btn-primary"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Upload First Document
          </button>
        </div>
      )}
      {}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Upload Documents</h3>
              <form onSubmit={handleUpload} className="space-y-4">
                {}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Files *
                  </label>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx,.txt"
                    onChange={handleFileSelect}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Supported: PDF, Images, Word, Excel, Text files (Max 10MB each)
                  </p>
                  {selectedFiles.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="text-sm text-gray-600">
                          ✓ {file.name} ({formatFileSize(file.size)})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Document Type *
                    </label>
                    <select
                      value={uploadData.type}
                      onChange={(e) => setUploadData({ ...uploadData, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    >
                      {documentTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={uploadData.category}
                      onChange={(e) => setUploadData({ ...uploadData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {categories.map(category => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={uploadData.title}
                    onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={uploadData.description}
                    onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                {}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Issued Date
                    </label>
                    <input
                      type="date"
                      value={uploadData.issuedDate}
                      onChange={(e) => setUploadData({ ...uploadData, issuedDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      value={uploadData.expiryDate}
                      onChange={(e) => setUploadData({ ...uploadData, expiryDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                {}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Issued By
                  </label>
                  <input
                    type="text"
                    value={uploadData.issuedBy}
                    onChange={(e) => setUploadData({ ...uploadData, issuedBy: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Veterinarian, clinic, or organization name"
                  />
                </div>
                {}
                {(uploadData.type === 'vet-certificate' || uploadData.type === 'medical-report') && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Veterinarian
                      </label>
                      <input
                        type="text"
                        value={uploadData.veterinarian}
                        onChange={(e) => setUploadData({ ...uploadData, veterinarian: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Clinic
                      </label>
                      <input
                        type="text"
                        value={uploadData.clinic}
                        onChange={(e) => setUploadData({ ...uploadData, clinic: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                )}
                {uploadData.type === 'lab-report' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Test Type
                      </label>
                      <input
                        type="text"
                        value={uploadData.testType}
                        onChange={(e) => setUploadData({ ...uploadData, testType: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Results Summary
                      </label>
                      <input
                        type="text"
                        value={uploadData.results}
                        onChange={(e) => setUploadData({ ...uploadData, results: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                )}
                {uploadData.type === 'insurance-document' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Insurance Provider
                      </label>
                      <input
                        type="text"
                        value={uploadData.insuranceProvider}
                        onChange={(e) => setUploadData({ ...uploadData, insuranceProvider: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Policy Number
                      </label>
                      <input
                        type="text"
                        value={uploadData.policyNumber}
                        onChange={(e) => setUploadData({ ...uploadData, policyNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                )}
                {}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <input
                    type="text"
                    value={uploadData.tags}
                    onChange={(e) => setUploadData({ ...uploadData, tags: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Separate tags with commas"
                  />
                </div>
                {}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUploadModal(false)
                      resetUploadForm()
                    }}
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploadMutation.isPending}
                    className="btn btn-primary"
                  >
                    {uploadMutation.isPending ? 'Uploading...' : 'Upload Documents'}
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
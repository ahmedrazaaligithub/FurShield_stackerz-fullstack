import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { petAPI } from '../../services/api'
import { 
  PlusIcon,
  CalendarIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  BeakerIcon,
  ClipboardDocumentCheckIcon,
  TrashIcon,
  PencilIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { uploadImageToCloudinary } from '../../utils/uploadImage'
import HealthTimeline from './HealthTimeline'
export default function PetHealthRecords({ pet, isOwner }) {
  const [activeTab, setActiveTab] = useState('vaccinations')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [formData, setFormData] = useState({
    type: 'vaccination',
    name: '',
    date: '',
    nextDueDate: '',
    veterinarian: '',
    clinic: '',
    notes: '',
    documents: [],
    allergen: '',
    severity: 'mild',
    symptoms: '',
    medication: '',
    dosage: '',
    frequency: '',
    startDate: '',
    endDate: '',
    diagnosis: '',
    treatment: '',
    labResults: ''
  })
  const [isUploading, setIsUploading] = useState(false)
  const queryClient = useQueryClient()
  const healthRecords = pet.healthRecords || {
    vaccinations: [],
    allergies: [],
    medications: [],
    treatments: [],
    documents: []
  }
  const addRecordMutation = useMutation({
    mutationFn: (data) => petAPI.addHealthRecord(pet._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['pet', pet._id])
      toast.success('Health record added successfully')
      setShowAddModal(false)
      resetForm()
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to add health record')
    }
  })
  const deleteRecordMutation = useMutation({
    mutationFn: ({ type, recordId }) => petAPI.deleteHealthRecord(pet._id, type, recordId),
    onSuccess: () => {
      queryClient.invalidateQueries(['pet', pet._id])
      toast.success('Record deleted successfully')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete record')
    }
  })
  const handleFileUpload = async (e) => {
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
    const recordData = {
      type: formData.type,
      data: {}
    }
    switch (formData.type) {
      case 'vaccination':
        recordData.data = {
          name: formData.name,
          date: formData.date,
          nextDueDate: formData.nextDueDate,
          veterinarian: formData.veterinarian,
          clinic: formData.clinic,
          notes: formData.notes,
          documents: formData.documents
        }
        break
      case 'allergy':
        recordData.data = {
          allergen: formData.allergen,
          severity: formData.severity,
          symptoms: formData.symptoms,
          discoveredDate: formData.date,
          notes: formData.notes
        }
        break
      case 'medication':
        recordData.data = {
          name: formData.medication,
          dosage: formData.dosage,
          frequency: formData.frequency,
          startDate: formData.startDate,
          endDate: formData.endDate,
          prescribedBy: formData.veterinarian,
          reason: formData.notes
        }
        break
      case 'treatment':
        recordData.data = {
          diagnosis: formData.diagnosis,
          treatment: formData.treatment,
          date: formData.date,
          veterinarian: formData.veterinarian,
          clinic: formData.clinic,
          labResults: formData.labResults,
          notes: formData.notes,
          documents: formData.documents
        }
        break
    }
    if (editingRecord) {
      recordData.recordId = editingRecord._id
    } else {
      addRecordMutation.mutate(recordData)
    }
  }
  const resetForm = () => {
    setFormData({
      type: 'vaccination',
      name: '',
      date: '',
      nextDueDate: '',
      veterinarian: '',
      clinic: '',
      notes: '',
      documents: [],
      allergen: '',
      severity: 'mild',
      symptoms: '',
      medication: '',
      dosage: '',
      frequency: '',
      startDate: '',
      endDate: '',
      diagnosis: '',
      treatment: '',
      labResults: ''
    })
    setEditingRecord(null)
  }
  const tabs = [
    { id: 'timeline', name: 'Timeline', icon: ClockIcon, count: 0 },
    { id: 'vaccinations', name: 'Vaccinations', icon: ShieldCheckIcon, count: healthRecords.vaccinations?.length || 0 },
    { id: 'allergies', name: 'Allergies', icon: ExclamationTriangleIcon, count: healthRecords.allergies?.length || 0 },
    { id: 'medications', name: 'Medications', icon: BeakerIcon, count: healthRecords.medications?.length || 0 },
    { id: 'treatments', name: 'Treatments', icon: ClipboardDocumentCheckIcon, count: healthRecords.treatments?.length || 0 },
    { id: 'documents', name: 'Documents', icon: DocumentTextIcon, count: healthRecords.documents?.length || 0 }
  ]
  const renderVaccinations = () => (
    <div className="space-y-4">
      {healthRecords.vaccinations?.length > 0 ? (
        healthRecords.vaccinations.map((vaccine) => (
          <div key={vaccine._id} className="bg-white border rounded-xl p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{vaccine.name}</h4>
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  <p>Date: {new Date(vaccine.date).toLocaleDateString()}</p>
                  {vaccine.nextDueDate && (
                    <p className="text-orange-600 font-medium">
                      Next Due: {new Date(vaccine.nextDueDate).toLocaleDateString()}
                    </p>
                  )}
                  {vaccine.veterinarian && <p>Vet: Dr. {vaccine.veterinarian}</p>}
                  {vaccine.clinic && <p>Clinic: {vaccine.clinic}</p>}
                  {vaccine.notes && <p className="text-gray-500 italic">{vaccine.notes}</p>}
                </div>
              </div>
              {isOwner && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setEditingRecord(vaccine)
                      setFormData({ ...formData, ...vaccine, type: 'vaccination' })
                      setShowAddModal(true)
                    }}
                    className="p-2 text-gray-400 hover:text-blue-600"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteRecordMutation.mutate({ type: 'vaccination', recordId: vaccine._id })}
                    className="p-2 text-gray-400 hover:text-red-600"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8 text-gray-500">
          <ShieldCheckIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No vaccination records yet</p>
        </div>
      )}
    </div>
  )
  const renderAllergies = () => (
    <div className="space-y-4">
      {healthRecords.allergies?.length > 0 ? (
        healthRecords.allergies.map((allergy) => (
          <div key={allergy._id} className="bg-white border rounded-xl p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{allergy.allergen}</h4>
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  <p>
                    Severity: 
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                      allergy.severity === 'severe' ? 'bg-red-100 text-red-800' :
                      allergy.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {allergy.severity}
                    </span>
                  </p>
                  {allergy.symptoms && <p>Symptoms: {allergy.symptoms}</p>}
                  {allergy.discoveredDate && (
                    <p>Discovered: {new Date(allergy.discoveredDate).toLocaleDateString()}</p>
                  )}
                  {allergy.notes && <p className="text-gray-500 italic">{allergy.notes}</p>}
                </div>
              </div>
              {isOwner && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => deleteRecordMutation.mutate({ type: 'allergy', recordId: allergy._id })}
                    className="p-2 text-gray-400 hover:text-red-600"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8 text-gray-500">
          <ExclamationTriangleIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No allergy records yet</p>
        </div>
      )}
    </div>
  )
  const renderMedications = () => (
    <div className="space-y-4">
      {healthRecords.medications?.length > 0 ? (
        healthRecords.medications.map((medication) => (
          <div key={medication._id} className="bg-white border rounded-xl p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{medication.name}</h4>
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  <p>Dosage: {medication.dosage}</p>
                  <p>Frequency: {medication.frequency}</p>
                  <p>
                    Duration: {new Date(medication.startDate).toLocaleDateString()} - 
                    {medication.endDate ? new Date(medication.endDate).toLocaleDateString() : 'Ongoing'}
                  </p>
                  {medication.prescribedBy && <p>Prescribed by: Dr. {medication.prescribedBy}</p>}
                  {medication.reason && <p className="text-gray-500 italic">{medication.reason}</p>}
                </div>
              </div>
              {isOwner && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => deleteRecordMutation.mutate({ type: 'medication', recordId: medication._id })}
                    className="p-2 text-gray-400 hover:text-red-600"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8 text-gray-500">
          <BeakerIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No medication records yet</p>
        </div>
      )}
    </div>
  )
  const renderTreatments = () => (
    <div className="space-y-4">
      {healthRecords.treatments?.length > 0 ? (
        healthRecords.treatments.map((treatment) => (
          <div key={treatment._id} className="bg-white border rounded-xl p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{treatment.diagnosis}</h4>
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  <p>Treatment: {treatment.treatment}</p>
                  <p>Date: {new Date(treatment.date).toLocaleDateString()}</p>
                  {treatment.veterinarian && <p>Vet: Dr. {treatment.veterinarian}</p>}
                  {treatment.clinic && <p>Clinic: {treatment.clinic}</p>}
                  {treatment.labResults && <p>Lab Results: {treatment.labResults}</p>}
                  {treatment.notes && <p className="text-gray-500 italic">{treatment.notes}</p>}
                </div>
              </div>
              {isOwner && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => deleteRecordMutation.mutate({ type: 'treatment', recordId: treatment._id })}
                    className="p-2 text-gray-400 hover:text-red-600"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8 text-gray-500">
          <ClipboardDocumentCheckIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No treatment records yet</p>
        </div>
      )}
    </div>
  )
  const renderDocuments = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {healthRecords.documents?.length > 0 ? (
        healthRecords.documents.map((doc, index) => (
          <div key={index} className="bg-white border rounded-xl p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3">
              <DocumentTextIcon className="h-10 w-10 text-blue-500" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{doc.name}</p>
                <p className="text-xs text-gray-500">
                  {new Date(doc.uploadedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="mt-3 flex space-x-2">
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 btn btn-outline btn-sm"
              >
                View
              </a>
              {isOwner && (
                <button
                  onClick={() => deleteRecordMutation.mutate({ type: 'document', recordId: doc._id })}
                  className="btn btn-danger btn-sm"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className="col-span-full text-center py-8 text-gray-500">
          <DocumentTextIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No documents uploaded yet</p>
        </div>
      )}
    </div>
  )
  return (
    <div className="space-y-6">
      {}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Health Records</h2>
        {isOwner && (
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Record
          </button>
        )}
      </div>
      {}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="h-5 w-5 mr-2" />
                {tab.name}
                {tab.count > 0 && (
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id
                      ? 'bg-primary-100 text-primary-600'
                      : 'bg-gray-100 text-gray-600'
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
      <div className="min-h-[400px]">
        {activeTab === 'timeline' && <HealthTimeline pet={pet} />}
        {activeTab === 'vaccinations' && renderVaccinations()}
        {activeTab === 'allergies' && renderAllergies()}
        {activeTab === 'medications' && renderMedications()}
        {activeTab === 'treatments' && renderTreatments()}
        {activeTab === 'documents' && renderDocuments()}
      </div>
      {}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {editingRecord ? 'Edit' : 'Add'} Health Record
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                {}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Record Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    disabled={editingRecord}
                  >
                    <option value="vaccination">Vaccination</option>
                    <option value="allergy">Allergy</option>
                    <option value="medication">Medication</option>
                    <option value="treatment">Treatment/Illness</option>
                  </select>
                </div>
                {}
                {formData.type === 'vaccination' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Vaccine Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date Given *
                        </label>
                        <input
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Next Due Date
                        </label>
                        <input
                          type="date"
                          value={formData.nextDueDate}
                          onChange={(e) => setFormData({ ...formData, nextDueDate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                  </>
                )}
                {formData.type === 'allergy' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Allergen *
                      </label>
                      <input
                        type="text"
                        value={formData.allergen}
                        onChange={(e) => setFormData({ ...formData, allergen: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Severity *
                        </label>
                        <select
                          value={formData.severity}
                          onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="mild">Mild</option>
                          <option value="moderate">Moderate</option>
                          <option value="severe">Severe</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Discovered Date
                        </label>
                        <input
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Symptoms
                      </label>
                      <textarea
                        value={formData.symptoms}
                        onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </>
                )}
                {}
                {(formData.type === 'vaccination' || formData.type === 'treatment') && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Veterinarian
                        </label>
                        <input
                          type="text"
                          value={formData.veterinarian}
                          onChange={(e) => setFormData({ ...formData, veterinarian: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Clinic
                        </label>
                        <input
                          type="text"
                          value={formData.clinic}
                          onChange={(e) => setFormData({ ...formData, clinic: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                    {}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload Documents
                      </label>
                      <input
                        type="file"
                        multiple
                        accept="image}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                {}
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
                    disabled={addRecordMutation.isPending || isUploading}
                    className="btn btn-primary"
                  >
                    {addRecordMutation.isPending ? 'Saving...' : editingRecord ? 'Update' : 'Add'} Record
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
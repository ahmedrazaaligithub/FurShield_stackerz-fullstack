import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { petAPI } from '../../services/api'
import { 
  PlusIcon,
  XMarkIcon,
  DocumentTextIcon,
  BeakerIcon,
  ClipboardDocumentCheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { LoadingSpinner } from '../ui/LoadingSpinner'
export default function VetHealthRecordForm({ pet, appointment, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    type: 'treatment',
    title: '',
    description: '',
    diagnosis: '',
    treatment: '',
    symptoms: [{ name: '', severity: 'mild', duration: '', notes: '' }],
    medications: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
    vitals: {
      temperature: '',
      weight: '',
      heartRate: '',
      respiratoryRate: '',
      bloodPressure: ''
    },
    labResults: [{ testName: '', result: '', normalRange: '', notes: '' }],
    followUpRequired: false,
    followUpDate: '',
    followUpNotes: '',
    tags: []
  })
  const [newTag, setNewTag] = useState('')
  const queryClient = useQueryClient()
  const addHealthRecordMutation = useMutation({
    mutationFn: (data) => petAPI.addHealthRecord(pet._id, data),
    onSuccess: () => {
      toast.success('Health record added successfully')
      queryClient.invalidateQueries(['pet', pet._id])
      queryClient.invalidateQueries(['pet-health-records', pet._id])
      onSuccess?.()
      onClose()
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to add health record')
    }
  })
  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      toast.error('Title is required')
      return
    }
    if (!formData.description.trim()) {
      toast.error('Description is required')
      return
    }
    if (!formData.diagnosis.trim()) {
      toast.error('Diagnosis is required')
      return
    }
    if (!formData.treatment.trim()) {
      toast.error('Treatment is required')
      return
    }
    const cleanedData = {
      ...formData,
      symptoms: formData.symptoms.filter(s => s.name.trim()),
      medications: formData.medications.filter(m => m.name.trim()),
      labResults: formData.labResults.filter(l => l.testName.trim()),
      vitals: Object.fromEntries(
        Object.entries(formData.vitals).filter(([_, value]) => value !== '')
      )
    }
    addHealthRecordMutation.mutate(cleanedData)
  }
  const addSymptom = () => {
    setFormData({
      ...formData,
      symptoms: [...formData.symptoms, { name: '', severity: 'mild', duration: '', notes: '' }]
    })
  }
  const removeSymptom = (index) => {
    setFormData({
      ...formData,
      symptoms: formData.symptoms.filter((_, i) => i !== index)
    })
  }
  const updateSymptom = (index, field, value) => {
    const updatedSymptoms = formData.symptoms.map((symptom, i) => 
      i === index ? { ...symptom, [field]: value } : symptom
    )
    setFormData({ ...formData, symptoms: updatedSymptoms })
  }
  const addMedication = () => {
    setFormData({
      ...formData,
      medications: [...formData.medications, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]
    })
  }
  const removeMedication = (index) => {
    setFormData({
      ...formData,
      medications: formData.medications.filter((_, i) => i !== index)
    })
  }
  const updateMedication = (index, field, value) => {
    const updatedMedications = formData.medications.map((medication, i) => 
      i === index ? { ...medication, [field]: value } : medication
    )
    setFormData({ ...formData, medications: updatedMedications })
  }
  const addLabResult = () => {
    setFormData({
      ...formData,
      labResults: [...formData.labResults, { testName: '', result: '', normalRange: '', notes: '' }]
    })
  }
  const removeLabResult = (index) => {
    setFormData({
      ...formData,
      labResults: formData.labResults.filter((_, i) => i !== index)
    })
  }
  const updateLabResult = (index, field, value) => {
    const updatedLabResults = formData.labResults.map((labResult, i) => 
      i === index ? { ...labResult, [field]: value } : labResult
    )
    setFormData({ ...formData, labResults: updatedLabResults })
  }
  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()]
      })
      setNewTag('')
    }
  }
  const removeTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    })
  }
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Add Health Record</h2>
            <p className="text-sm text-gray-600">
              Patient: {pet.name} | Appointment: {new Date(appointment.scheduledDate).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Record Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="input w-full"
                required
              >
                <option value="treatment">Treatment</option>
                <option value="checkup">Checkup</option>
                <option value="vaccination">Vaccination</option>
                <option value="surgery">Surgery</option>
                <option value="emergency">Emergency</option>
                <option value="lab-result">Lab Result</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input w-full"
                placeholder="e.g., Routine Checkup, Skin Condition Treatment"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="textarea w-full"
              placeholder="Brief description of the visit/treatment"
              required
            />
          </div>
          {}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Diagnosis *
              </label>
              <textarea
                value={formData.diagnosis}
                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                rows={3}
                className="textarea w-full"
                placeholder="Primary diagnosis and findings"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Treatment *
              </label>
              <textarea
                value={formData.treatment}
                onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
                rows={3}
                className="textarea w-full"
                placeholder="Treatment provided and recommendations"
                required
              />
            </div>
          </div>
          {}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                <ExclamationTriangleIcon className="h-4 w-4 inline mr-1" />
                Symptoms Observed
              </label>
              <button
                type="button"
                onClick={addSymptom}
                className="btn btn-outline btn-sm"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Symptom
              </button>
            </div>
            <div className="space-y-3">
              {formData.symptoms.map((symptom, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-700">Symptom {index + 1}</h4>
                    {formData.symptoms.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSymptom(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <input
                        type="text"
                        value={symptom.name}
                        onChange={(e) => updateSymptom(index, 'name', e.target.value)}
                        className="input w-full"
                        placeholder="Symptom name"
                      />
                    </div>
                    <div>
                      <select
                        value={symptom.severity}
                        onChange={(e) => updateSymptom(index, 'severity', e.target.value)}
                        className="input w-full"
                      >
                        <option value="mild">Mild</option>
                        <option value="moderate">Moderate</option>
                        <option value="severe">Severe</option>
                      </select>
                    </div>
                    <div>
                      <input
                        type="text"
                        value={symptom.duration}
                        onChange={(e) => updateSymptom(index, 'duration', e.target.value)}
                        className="input w-full"
                        placeholder="Duration"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={symptom.notes}
                        onChange={(e) => updateSymptom(index, 'notes', e.target.value)}
                        className="input w-full"
                        placeholder="Notes"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                <BeakerIcon className="h-4 w-4 inline mr-1" />
                Medications/Prescriptions
              </label>
              <button
                type="button"
                onClick={addMedication}
                className="btn btn-outline btn-sm"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Medication
              </button>
            </div>
            <div className="space-y-3">
              {formData.medications.map((medication, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-700">Medication {index + 1}</h4>
                    {formData.medications.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMedication(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div>
                      <input
                        type="text"
                        value={medication.name}
                        onChange={(e) => updateMedication(index, 'name', e.target.value)}
                        className="input w-full"
                        placeholder="Medication name"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={medication.dosage}
                        onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                        className="input w-full"
                        placeholder="Dosage (e.g., 10mg)"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={medication.frequency}
                        onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                        className="input w-full"
                        placeholder="Frequency (e.g., twice daily)"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={medication.duration}
                        onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                        className="input w-full"
                        placeholder="Duration (e.g., 7 days)"
                      />
                    </div>
                  </div>
                  <div>
                    <textarea
                      value={medication.instructions}
                      onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                      rows={2}
                      className="textarea w-full"
                      placeholder="Special instructions"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          {}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <ClipboardDocumentCheckIcon className="h-4 w-4 inline mr-1" />
              Vital Signs
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Temperature (°F)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.vitals.temperature}
                  onChange={(e) => setFormData({
                    ...formData,
                    vitals: { ...formData.vitals, temperature: e.target.value }
                  })}
                  className="input w-full"
                  placeholder="101.5"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Weight (lbs)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.vitals.weight}
                  onChange={(e) => setFormData({
                    ...formData,
                    vitals: { ...formData.vitals, weight: e.target.value }
                  })}
                  className="input w-full"
                  placeholder="25.5"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Heart Rate (bpm)</label>
                <input
                  type="number"
                  value={formData.vitals.heartRate}
                  onChange={(e) => setFormData({
                    ...formData,
                    vitals: { ...formData.vitals, heartRate: e.target.value }
                  })}
                  className="input w-full"
                  placeholder="120"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Respiratory Rate</label>
                <input
                  type="number"
                  value={formData.vitals.respiratoryRate}
                  onChange={(e) => setFormData({
                    ...formData,
                    vitals: { ...formData.vitals, respiratoryRate: e.target.value }
                  })}
                  className="input w-full"
                  placeholder="30"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Blood Pressure</label>
                <input
                  type="text"
                  value={formData.vitals.bloodPressure}
                  onChange={(e) => setFormData({
                    ...formData,
                    vitals: { ...formData.vitals, bloodPressure: e.target.value }
                  })}
                  className="input w-full"
                  placeholder="120/80"
                />
              </div>
            </div>
          </div>
          {}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                <BeakerIcon className="h-4 w-4 inline mr-1" />
                Lab Results
              </label>
              <button
                type="button"
                onClick={addLabResult}
                className="btn btn-outline btn-sm"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Lab Result
              </button>
            </div>
            <div className="space-y-3">
              {formData.labResults.map((labResult, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-700">Lab Test {index + 1}</h4>
                    {formData.labResults.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLabResult(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <input
                        type="text"
                        value={labResult.testName}
                        onChange={(e) => updateLabResult(index, 'testName', e.target.value)}
                        className="input w-full"
                        placeholder="Test name"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={labResult.result}
                        onChange={(e) => updateLabResult(index, 'result', e.target.value)}
                        className="input w-full"
                        placeholder="Result"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={labResult.normalRange}
                        onChange={(e) => updateLabResult(index, 'normalRange', e.target.value)}
                        className="input w-full"
                        placeholder="Normal range"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={labResult.notes}
                        onChange={(e) => updateLabResult(index, 'notes', e.target.value)}
                        className="input w-full"
                        placeholder="Notes"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {}
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <input
                type="checkbox"
                id="followUpRequired"
                checked={formData.followUpRequired}
                onChange={(e) => setFormData({ ...formData, followUpRequired: e.target.checked })}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="followUpRequired" className="text-sm font-medium text-gray-700">
                Follow-up Required
              </label>
            </div>
            {formData.followUpRequired && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Follow-up Date
                  </label>
                  <input
                    type="date"
                    value={formData.followUpDate}
                    onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Follow-up Notes
                  </label>
                  <textarea
                    value={formData.followUpNotes}
                    onChange={(e) => setFormData({ ...formData, followUpNotes: e.target.value })}
                    rows={2}
                    className="textarea w-full"
                    placeholder="Follow-up instructions"
                  />
                </div>
              </div>
            )}
          </div>
          {}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 text-primary-600 hover:text-primary-800"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="input flex-1"
                placeholder="Add tag (e.g., chronic, urgent, routine)"
              />
              <button
                type="button"
                onClick={addTag}
                className="btn btn-outline"
              >
                Add
              </button>
            </div>
          </div>
          {}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
              disabled={addHealthRecordMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addHealthRecordMutation.isPending}
              className="btn btn-primary"
            >
              {addHealthRecordMutation.isPending ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Saving...
                </>
              ) : (
                'Save Health Record'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
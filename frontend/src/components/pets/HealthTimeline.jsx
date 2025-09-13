import { useState } from 'react'
import { 
  CalendarIcon,
  ShieldCheckIcon,
  BeakerIcon,
  ClipboardDocumentCheckIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline'
const getRecordIcon = (type) => {
  switch (type) {
    case 'vaccination':
      return ShieldCheckIcon
    case 'allergy':
      return ExclamationTriangleIcon
    case 'medication':
      return BeakerIcon
    case 'treatment':
      return ClipboardDocumentCheckIcon
    default:
      return CalendarIcon
  }
}
const getRecordColor = (type) => {
  switch (type) {
    case 'vaccination':
      return 'bg-green-100 text-green-600 border-green-200'
    case 'allergy':
      return 'bg-red-100 text-red-600 border-red-200'
    case 'medication':
      return 'bg-blue-100 text-blue-600 border-blue-200'
    case 'treatment':
      return 'bg-purple-100 text-purple-600 border-purple-200'
    default:
      return 'bg-gray-100 text-gray-600 border-gray-200'
  }
}
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
const TimelineItem = ({ record, isLast }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const Icon = getRecordIcon(record.type)
  const colorClass = getRecordColor(record.type)
  const getRecordTitle = () => {
    switch (record.type) {
      case 'vaccination':
        return record.data.name || 'Vaccination'
      case 'allergy':
        return record.data.allergen || 'Allergy'
      case 'medication':
        return record.data.name || 'Medication'
      case 'treatment':
        return record.data.diagnosis || 'Treatment'
      default:
        return 'Health Record'
    }
  }
  const getRecordDate = () => {
    switch (record.type) {
      case 'vaccination':
        return record.data.date
      case 'allergy':
        return record.data.discoveredDate
      case 'medication':
        return record.data.startDate
      case 'treatment':
        return record.data.date
      default:
        return record.createdAt
    }
  }
  const renderDetails = () => {
    switch (record.type) {
      case 'vaccination':
        return (
          <div className="space-y-2 text-sm text-gray-600">
            {record.data.nextDueDate && (
              <p><span className="font-medium">Next Due:</span> {formatDate(record.data.nextDueDate)}</p>
            )}
            {record.data.veterinarian && (
              <p><span className="font-medium">Vet:</span> Dr. {record.data.veterinarian}</p>
            )}
            {record.data.clinic && (
              <p><span className="font-medium">Clinic:</span> {record.data.clinic}</p>
            )}
            {record.data.notes && (
              <p><span className="font-medium">Notes:</span> {record.data.notes}</p>
            )}
          </div>
        )
      case 'allergy':
        return (
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              <span className="font-medium">Severity:</span>
              <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                record.data.severity === 'severe' ? 'bg-red-100 text-red-800' :
                record.data.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {record.data.severity}
              </span>
            </p>
            {record.data.symptoms && (
              <p><span className="font-medium">Symptoms:</span> {record.data.symptoms}</p>
            )}
            {record.data.notes && (
              <p><span className="font-medium">Notes:</span> {record.data.notes}</p>
            )}
          </div>
        )
      case 'medication':
        return (
          <div className="space-y-2 text-sm text-gray-600">
            {record.data.dosage && (
              <p><span className="font-medium">Dosage:</span> {record.data.dosage}</p>
            )}
            {record.data.frequency && (
              <p><span className="font-medium">Frequency:</span> {record.data.frequency}</p>
            )}
            {record.data.endDate && (
              <p><span className="font-medium">End Date:</span> {formatDate(record.data.endDate)}</p>
            )}
            {record.data.prescribedBy && (
              <p><span className="font-medium">Prescribed by:</span> Dr. {record.data.prescribedBy}</p>
            )}
            {record.data.reason && (
              <p><span className="font-medium">Reason:</span> {record.data.reason}</p>
            )}
          </div>
        )
      case 'treatment':
        return (
          <div className="space-y-2 text-sm text-gray-600">
            {record.data.treatment && (
              <p><span className="font-medium">Treatment:</span> {record.data.treatment}</p>
            )}
            {record.data.veterinarian && (
              <p><span className="font-medium">Vet:</span> Dr. {record.data.veterinarian}</p>
            )}
            {record.data.clinic && (
              <p><span className="font-medium">Clinic:</span> {record.data.clinic}</p>
            )}
            {record.data.labResults && (
              <p><span className="font-medium">Lab Results:</span> {record.data.labResults}</p>
            )}
            {record.data.notes && (
              <p><span className="font-medium">Notes:</span> {record.data.notes}</p>
            )}
          </div>
        )
      default:
        return null
    }
  }
  return (
    <div className="relative">
      {}
      {!isLast && (
        <div className="absolute left-6 top-12 w-0.5 h-full bg-gray-200"></div>
      )}
      {}
      <div className="flex items-start space-x-4">
        {}
        <div className={`flex-shrink-0 w-12 h-12 rounded-full border-2 flex items-center justify-center ${colorClass}`}>
          <Icon className="h-6 w-6" />
        </div>
        {}
        <div className="flex-1 min-w-0">
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
            {}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{getRecordTitle()}</h4>
                <p className="text-sm text-gray-500 flex items-center mt-1">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  {formatDate(getRecordDate())}
                </p>
              </div>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                {isExpanded ? (
                  <ChevronUpIcon className="h-5 w-5" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5" />
                )}
              </button>
            </div>
            {}
            {isExpanded && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                {renderDetails()}
                {}
                {record.data.documents && record.data.documents.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Documents:</p>
                    <div className="flex flex-wrap gap-2">
                      {record.data.documents.map((doc, index) => (
                        <a
                          key={index}
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md hover:bg-blue-100"
                        >
                          📄 {doc.name}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
export default function HealthTimeline({ pet }) {
  const [filter, setFilter] = useState('all')
  const getAllRecords = () => {
    const records = []
    if (pet.healthRecords?.vaccinations) {
      pet.healthRecords.vaccinations.forEach(vaccination => {
        records.push({
          ...vaccination,
          type: 'vaccination',
          data: vaccination,
          sortDate: new Date(vaccination.date)
        })
      })
    }
    if (pet.healthRecords?.allergies) {
      pet.healthRecords.allergies.forEach(allergy => {
        records.push({
          ...allergy,
          type: 'allergy',
          data: allergy,
          sortDate: new Date(allergy.discoveredDate || allergy.createdAt)
        })
      })
    }
    if (pet.healthRecords?.medications) {
      pet.healthRecords.medications.forEach(medication => {
        records.push({
          ...medication,
          type: 'medication',
          data: medication,
          sortDate: new Date(medication.startDate || medication.createdAt)
        })
      })
    }
    if (pet.healthRecords?.treatments) {
      pet.healthRecords.treatments.forEach(treatment => {
        records.push({
          ...treatment,
          type: 'treatment',
          data: treatment,
          sortDate: new Date(treatment.date || treatment.createdAt)
        })
      })
    }
    return records.sort((a, b) => b.sortDate - a.sortDate)
  }
  const allRecords = getAllRecords()
  const filteredRecords = filter === 'all' 
    ? allRecords 
    : allRecords.filter(record => record.type === filter)
  const filterOptions = [
    { value: 'all', label: 'All Records', count: allRecords.length },
    { value: 'vaccination', label: 'Vaccinations', count: allRecords.filter(r => r.type === 'vaccination').length },
    { value: 'allergy', label: 'Allergies', count: allRecords.filter(r => r.type === 'allergy').length },
    { value: 'medication', label: 'Medications', count: allRecords.filter(r => r.type === 'medication').length },
    { value: 'treatment', label: 'Treatments', count: allRecords.filter(r => r.type === 'treatment').length }
  ]
  return (
    <div className="space-y-6">
      {}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">Health Timeline</h3>
        {}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Filter:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {filterOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label} ({option.count})
              </option>
            ))}
          </select>
        </div>
      </div>
      {}
      <div className="space-y-6">
        {filteredRecords.length > 0 ? (
          filteredRecords.map((record, index) => (
            <TimelineItem
              key={`${record.type}-${record._id || index}`}
              record={record}
              isLast={index === filteredRecords.length - 1}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Health Records</h3>
            <p className="text-gray-500">
              {filter === 'all' 
                ? "No health records have been added yet." 
                : `No ${filter} records found.`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
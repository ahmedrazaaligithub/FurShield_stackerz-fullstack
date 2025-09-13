import { useState, useEffect } from 'react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
const countries = [
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
  { code: 'PK', name: 'Pakistan', dialCode: '+92', flag: '🇵🇰' },
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪' },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
  { code: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸' },
  { code: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', dialCode: '+52', flag: '🇲🇽' },
  { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', dialCode: '+82', flag: '🇰🇷' },
  { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳' },
  { code: 'AE', name: 'UAE', dialCode: '+971', flag: '🇦🇪' },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦' }
]
export default function PhoneInput({ 
  value = '', 
  onChange, 
  error, 
  placeholder = 'Enter phone number',
  required = false,
  className = ''
}) {
  const [selectedCountry, setSelectedCountry] = useState(countries[0])
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  useEffect(() => {
    if (value) {
      const country = countries.find(c => value.startsWith(c.dialCode))
      if (country) {
        setSelectedCountry(country)
        setPhoneNumber(value.substring(country.dialCode.length).trim())
      } else {
        setPhoneNumber(value)
      }
    }
  }, [value])
  const formatPhoneNumber = (number, countryCode) => {
    const digits = number.replace(/\D/g, '')
    if (countryCode === 'US' || countryCode === 'CA') {
      if (digits.length <= 3) return digits
      if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
    } else if (countryCode === 'PK') {
      if (digits.length <= 3) return digits
      if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`
    } else {
      if (digits.length <= 3) return digits
      if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
    }
  }
  const handlePhoneChange = (e) => {
    const inputValue = e.target.value
    const formattedNumber = formatPhoneNumber(inputValue, selectedCountry.code)
    setPhoneNumber(formattedNumber)
    const fullNumber = selectedCountry.dialCode + ' ' + formattedNumber.replace(/\D/g, '')
    onChange?.(fullNumber)
  }
  const handleCountrySelect = (country) => {
    setSelectedCountry(country)
    setIsDropdownOpen(false)
    const digits = phoneNumber.replace(/\D/g, '')
    const fullNumber = country.dialCode + ' ' + digits
    onChange?.(fullNumber)
  }
  return (
    <div className="relative">
      <div className={`flex ${className}`}>
        {}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`flex items-center px-3 py-2 border border-r-0 rounded-l-md bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
              error ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <span className="text-lg mr-1">{selectedCountry.flag}</span>
            <span className="text-sm font-medium text-gray-700 mr-1">
              {selectedCountry.dialCode}
            </span>
            <ChevronDownIcon className="h-4 w-4 text-gray-400" />
          </button>
          {}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
              {countries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleCountrySelect(country)}
                  className="w-full flex items-center px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                >
                  <span className="text-lg mr-2">{country.flag}</span>
                  <span className="flex-1 text-sm">{country.name}</span>
                  <span className="text-sm text-gray-500 ml-2">{country.dialCode}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        {}
        <input
          type="tel"
          value={phoneNumber}
          onChange={handlePhoneChange}
          placeholder={placeholder}
          required={required}
          className={`flex-1 px-3 py-2 border rounded-r-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
            error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
          }`}
        />
      </div>
      {}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  )
}
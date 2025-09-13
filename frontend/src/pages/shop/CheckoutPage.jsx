import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { cartAPI, orderAPI, userAPI } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { 
  ArrowLeftIcon,
  CreditCardIcon,
  TruckIcon,
  ShieldCheckIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
export default function CheckoutPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: '',
    shippingMethod: 'standard',
    saveAddress: false
  })
  const [errors, setErrors] = useState({})
  const { data: cart, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: cartAPI.getCart
  })
  const { data: userProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => userAPI.getProfile(),
    enabled: !!user
  })
  useEffect(() => {
    if (userProfile?.data?.data) {
      const profile = userProfile.data.data
      setFormData(prev => ({
        ...prev,
        firstName: profile.name?.split(' ')[0] || prev.firstName,
        lastName: profile.name?.split(' ').slice(1).join(' ') || prev.lastName,
        email: profile.email || prev.email,
        phone: profile.phone || prev.phone,
        address: profile.address?.street || prev.address,
        city: profile.address?.city || prev.city,
        state: profile.address?.state || prev.state,
        zipCode: profile.address?.zipCode || prev.zipCode,
        country: profile.address?.country || prev.country
      }))
    }
  }, [userProfile])
  const createOrderMutation = useMutation({
    mutationFn: orderAPI.createOrder,
    onSuccess: (data) => {
      toast.success('Order placed successfully!')
      navigate(`/order-success/${data.data.data._id}`)
    },
    onError: (error) => {
      console.error('Order creation error:', error.response?.data)
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to place order')
    }
  })
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }
  const validateForm = () => {
    const newErrors = {}
    const required = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'zipCode', 'cardNumber', 'expiryDate', 'cvv', 'cardName']
    required.forEach(field => {
      if (!formData[field].trim()) {
        newErrors[field] = 'This field is required'
      }
    })
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    if (formData.phone && !/^[0-9]{10,15}$/.test(formData.phone.replace(/[\s\-\(\)]/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number (10-15 digits)'
    }
    if (formData.zipCode && !/^\d{5}(-\d{4})?$/.test(formData.zipCode)) {
      newErrors.zipCode = 'Please enter a valid ZIP code (e.g., 12345 or 12345-6789)'
    }
    const cardNumber = formData.cardNumber.replace(/\s/g, '')
    if (cardNumber && (cardNumber.length < 13 || cardNumber.length > 19 || !/^\d+$/.test(cardNumber))) {
      newErrors.cardNumber = 'Please enter a valid card number (13-19 digits)'
    }
    if (formData.expiryDate && !/^(0[1-9]|1[0-2])\/(\d{2}|\d{4})$/.test(formData.expiryDate)) {
      newErrors.expiryDate = 'Please enter a valid expiry date (MM/YY)'
    }
    if (formData.cvv && !/^\d{3,4}$/.test(formData.cvv)) {
      newErrors.cvv = 'Please enter a valid CVV (3-4 digits)'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    const orderData = {
      shippingAddress: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country
      },
      paymentMethod: {
        type: 'card',
        cardNumber: formData.cardNumber.replace(/\s/g, ''),
        expiryDate: formData.expiryDate,
        cvv: formData.cvv,
        cardName: formData.cardName
      },
      shippingMethod: formData.shippingMethod
    }
    console.log('Submitting order with data:', orderData)
    createOrderMutation.mutate(orderData)
  }
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }
  const cartData = cart?.data?.data
  const items = cartData?.items || []
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-gray-600 mb-4">Your cart is empty</p>
        <button
          onClick={() => navigate('/shop')}
          className="btn btn-primary"
        >
          Continue Shopping
        </button>
      </div>
    )
  }
  const subtotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
  const tax = 0 
  const shipping = formData.shippingMethod === 'express' ? 19.99 : (subtotal > 50 ? 0 : 9.99)
  const total = subtotal + tax + shipping
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/cart')}
          className="btn btn-ghost p-2"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600">Complete your order</p>
        </div>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <TruckIcon className="h-5 w-5 mr-2" />
                  Shipping Address
                </h2>
              </div>
              <div className="card-content space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">First Name *</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={`input ${errors.firstName ? 'border-red-300' : ''}`}
                    />
                    {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
                  </div>
                  <div>
                    <label className="label">Last Name *</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={`input ${errors.lastName ? 'border-red-300' : ''}`}
                    />
                    {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`input ${errors.email ? 'border-red-300' : ''}`}
                    />
                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="label">Phone *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`input ${errors.phone ? 'border-red-300' : ''}`}
                      placeholder="(123) 456-7890"
                      maxLength="15"
                    />
                    {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                  </div>
                </div>
                <div>
                  <label className="label">Address *</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className={`input ${errors.address ? 'border-red-300' : ''}`}
                  />
                  {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="label">City *</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className={`input ${errors.city ? 'border-red-300' : ''}`}
                    />
                    {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
                  </div>
                  <div>
                    <label className="label">State *</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className={`input ${errors.state ? 'border-red-300' : ''}`}
                    />
                    {errors.state && <p className="mt-1 text-sm text-red-600">{errors.state}</p>}
                  </div>
                  <div>
                    <label className="label">ZIP Code *</label>
                    <input
                      type="text"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      className={`input ${errors.zipCode ? 'border-red-300' : ''}`}
                      placeholder="12345"
                      maxLength="10"
                    />
                    {errors.zipCode && <p className="mt-1 text-sm text-red-600">{errors.zipCode}</p>}
                  </div>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-gray-900">Shipping Method</h2>
              </div>
              <div className="card-content space-y-3">
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="shippingMethod"
                    value="standard"
                    checked={formData.shippingMethod === 'standard'}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary-600"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex justify-between">
                      <span className="font-medium">Standard Shipping</span>
                      <span>{subtotal > 50 ? 'Free' : '$9.99'}</span>
                    </div>
                    <p className="text-sm text-gray-600">5-7 business days</p>
                  </div>
                </label>
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="shippingMethod"
                    value="express"
                    checked={formData.shippingMethod === 'express'}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary-600"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex justify-between">
                      <span className="font-medium">Express Shipping</span>
                      <span>$19.99</span>
                    </div>
                    <p className="text-sm text-gray-600">2-3 business days</p>
                  </div>
                </label>
              </div>
            </div>
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <CreditCardIcon className="h-5 w-5 mr-2" />
                  Payment Information
                </h2>
              </div>
              <div className="card-content space-y-4">
                <div>
                  <label className="label">Card Number *</label>
                  <input
                    type="text"
                    name="cardNumber"
                    value={formData.cardNumber}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\s/g, '')
                      let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value
                      setFormData(prev => ({ ...prev, cardNumber: formattedValue }))
                      if (errors.cardNumber) {
                        setErrors(prev => ({ ...prev, cardNumber: '' }))
                      }
                    }}
                    className={`input ${errors.cardNumber ? 'border-red-300' : ''}`}
                    placeholder="1234 5678 9012 3456"
                    maxLength="23"
                  />
                  {errors.cardNumber && <p className="mt-1 text-sm text-red-600">{errors.cardNumber}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Expiry Date *</label>
                    <input
                      type="text"
                      name="expiryDate"
                      value={formData.expiryDate}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, '')
                        if (value.length >= 2) {
                          value = value.slice(0, 2) + '/' + value.slice(2, 4)
                        }
                        setFormData(prev => ({ ...prev, expiryDate: value }))
                        if (errors.expiryDate) {
                          setErrors(prev => ({ ...prev, expiryDate: '' }))
                        }
                      }}
                      className={`input ${errors.expiryDate ? 'border-red-300' : ''}`}
                      placeholder="MM/YY"
                      maxLength="5"
                    />
                    {errors.expiryDate && <p className="mt-1 text-sm text-red-600">{errors.expiryDate}</p>}
                  </div>
                  <div>
                    <label className="label">CVV *</label>
                    <input
                      type="text"
                      name="cvv"
                      value={formData.cvv}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '')
                        setFormData(prev => ({ ...prev, cvv: value }))
                        if (errors.cvv) {
                          setErrors(prev => ({ ...prev, cvv: '' }))
                        }
                      }}
                      className={`input ${errors.cvv ? 'border-red-300' : ''}`}
                      placeholder="123"
                      maxLength="4"
                    />
                    {errors.cvv && <p className="mt-1 text-sm text-red-600">{errors.cvv}</p>}
                  </div>
                </div>
                <div>
                  <label className="label">Name on Card *</label>
                  <input
                    type="text"
                    name="cardName"
                    value={formData.cardName}
                    onChange={handleInputChange}
                    className={`input ${errors.cardName ? 'border-red-300' : ''}`}
                  />
                  {errors.cardName && <p className="mt-1 text-sm text-red-600">{errors.cardName}</p>}
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-gray-900">Order Summary</h2>
              </div>
              <div className="card-content space-y-4">
                {items.map((item) => (
                  <div key={item.product._id} className="flex justify-between">
                    <div>
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium">${(item.product.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
            <button
              type="submit"
              disabled={createOrderMutation.isPending}
              className="btn btn-primary w-full btn-lg"
            >
              {createOrderMutation.isPending ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <ShieldCheckIcon className="h-5 w-5 mr-2" />
              )}
              {createOrderMutation.isPending ? 'Processing...' : 'Place Order'}
            </button>
            <div className="text-center text-sm text-gray-500">
              <ShieldCheckIcon className="h-4 w-4 inline mr-1" />
              Your payment information is secure and encrypted
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
import axios from 'axios'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
})
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.config.url, response.status, response.data)
    return response
  },
  async (error) => {
    console.error('API Error:', error.config?.url, error.response?.status, error.response?.data || error.message)
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      if (originalRequest.url?.includes('/auth/')) {
        if (originalRequest.url?.includes('/auth/me') || originalRequest.url?.includes('/auth/refresh')) {
          localStorage.removeItem('token')
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login'
          }
        }
        return Promise.reject(error)
      }
      try {
        const response = await api.post('/auth/refresh')
        const { accessToken } = response.data.data
        localStorage.setItem('token', accessToken)
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        localStorage.removeItem('token')
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      }
    }
    return Promise.reject(error)
  }
)
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  refresh: () => api.post('/auth/refresh'),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (token, data) => api.post(`/auth/reset-password/${token}`, data),
  verifyEmail: (token) => api.post(`/auth/verify-email/${token}`),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data)
}
export const userAPI = {
  getProfile: () => api.get('/auth/me'),
  getUserProfile: (userId) => api.get(`/users/${userId}`),
  updateProfile: (data) => api.put('/users/profile', data),
  uploadAvatar: (avatarUrl) => api.post('/users/upload-avatar', { avatarUrl }),
  deleteAccount: () => api.delete('/users/profile'),
  getVets: (params = {}) => api.get('/users/vets', { params }),
  getVetById: (id) => api.get(`/users/vets/${id}`),
  getFavoriteVets: () => api.get('/users/favorites'),
  addFavoriteVet: (vetId) => api.post('/users/favorites', { vetId }),
  removeFavoriteVet: (vetId) => api.delete(`/users/favorites/${vetId}`),
  requestVetVerification: (data) => api.post('/users/vet-verification', data),
  approveVetVerification: (userId) => api.put(`/users/${userId}/verify-vet`),
  rejectVetVerification: (userId, data) => api.put(`/users/${userId}/reject-vet`, data)
}
export const petAPI = {
  getPets: (filters = {}) => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value)
    })
    return api.get(`/pets?${params}`)
  },
  getPet: (id) => api.get(`/pets/${id}`),
  createPet: (petData) => api.post('/pets', petData),
  updatePet: (id, petData) => api.put(`/pets/${id}`, petData),
  deletePet: (id) => api.delete(`/pets/${id}`),
  uploadPetPhoto: (id, formData) => api.post(`/pets/${id}/photos`, formData),
  getUserPets: (userId) => api.get(`/pets/user/${userId}`),
  getMyPets: () => api.get('/pets/user'),
  getHealthRecords: (id) => api.get(`/pets/${id}/health-records`),
  addHealthRecord: (id, data) => api.post(`/pets/${id}/health-records`, data),
  addVaccination: (id, data) => api.post(`/health/pets/${id}/vaccinations`, data),
  addAllergy: (id, data) => api.post(`/health/pets/${id}/allergies`, data),
  addMedication: (id, data) => api.post(`/health/pets/${id}/medications`, data),
  addTreatment: (id, data) => api.post(`/health/pets/${id}/treatments`, data),
  deleteHealthRecord: (id, type, recordId) => api.delete(`/health/pets/${id}/records/${type}/${recordId}`),
  getInsurance: (id) => api.get(`/insurance/pets/${id}/policies`),
  addInsurance: (id, data) => api.post(`/insurance/pets/${id}/policies`, data),
  updateInsurance: (id, policyId, data) => api.put(`/insurance/pets/${id}/policies/${policyId}`, data),
  deleteInsurance: (id, policyId) => api.delete(`/insurance/pets/${id}/policies/${policyId}`),
  getFeedback: (id) => api.get(`/pets/${id}/feedback`),
  submitFeedback: (id, data) => api.post(`/pets/${id}/feedback`, data),
  updateFeedback: (feedbackId, data) => api.patch(`/feedback/${feedbackId}`, data),
  deleteFeedback: (feedbackId) => api.delete(`/feedback/${feedbackId}`)
}
export const appointmentAPI = {
  getAppointments: (params = {}) => api.get('/appointments', { params }),
  getAppointment: (id) => api.get(`/appointments/${id}`),
  createAppointment: (data) => api.post('/appointments', data),
  updateAppointment: (id, data) => api.put(`/appointments/${id}`, data),
  cancelAppointment: (id, data) => api.put(`/appointments/${id}/cancel`, data),
  acceptAppointment: (id) => api.put(`/appointments/${id}/accept`),
  proposeTimeChange: (id, data) => api.put(`/appointments/${id}/propose-time`, data),
  completeAppointment: (id, data) => api.put(`/appointments/${id}/complete`, data),
  confirmAppointment: (id) => api.put(`/appointments/${id}/confirm`),
  rescheduleAppointment: (id, data) => api.put(`/appointments/${id}/reschedule`, data),
  getAvailableSlots: (vetId, date) => api.get(`/appointments/slots/${vetId}`, { params: { date } }),
}
export const shelterAPI = {
  getShelters: (params) => api.get('/shelters', { params }),
  getShelter: (id) => api.get(`/shelters/${id}`),
  getMyShelter: () => api.get('/shelters/me'),
  createShelter: (data) => api.post('/shelters', data),
  updateShelter: (id, data) => api.put(`/shelters/${id}`, data),
  deleteShelter: (id) => api.delete(`/shelters/${id}`),
  verifyShelter: (id) => api.post(`/shelters/${id}/verify`)
}
export const adoptionAPI = {
  getListings: (params = {}) => api.get('/adoptions', { params }),
  getAdoptions: (params = {}) => api.get('/adoptions', { params }),
  getAdoption: (id) => api.get(`/adoptions/${id}`),
  createAdoption: (data) => api.post('/adoptions', data),
  createListing: (data) => api.post('/adoptions', data),
  updateAdoption: (id, data) => api.put(`/adoptions/${id}`, data),
  deleteAdoption: (id) => api.delete(`/adoptions/${id}`),
  submitApplication: (id, data) => api.post(`/adoptions/${id}/apply`, data),
  updateApplicationStatus: (applicationId, status) => 
    api.patch(`/adoptions/applications/${applicationId}/status`, { status }),
  getShelterListings: (shelterId) => api.get(`/adoptions/shelter/${shelterId}`),
  completeAdoption: (id, inquiryId, data) => api.put(`/adoptions/${id}/complete/${inquiryId}`, data),
  createInquiry: (id, data) => api.post(`/adoptions/${id}/inquiries`, data),
  getInquiries: (params = {}) => api.get('/adoptions/inquiries', { params }),
  updateInquiryStatus: (id, inquiryId, data) => api.put(`/adoptions/${id}/inquiries/${inquiryId}`, data)
}
export const productAPI = {
  getProducts: (params) => api.get('/products', { params }),
  getProduct: (id) => api.get(`/products/${id}`),
  createProduct: (data) => api.post('/products', data),
  updateProduct: (id, data) => api.put(`/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  getCategories: () => api.get('/products/categories')
}
export const cartAPI = {
  getCart: () => api.get('/cart'),
  addToCart: (productId, quantity) => api.post('/cart/add', { productId, quantity }),
  updateQuantity: (productId, quantity) => api.put('/cart/update', { productId, quantity }),
  removeFromCart: (productId) => api.delete(`/cart/remove/${productId}`),
  clearCart: () => api.delete('/cart/clear'),
  applyCoupon: (code) => api.post('/cart/coupon', { code }),
  removeCoupon: () => api.delete('/cart/coupon')
}
export const orderAPI = {
  createOrder: (orderData) => api.post('/orders', orderData),
  getOrders: (params = {}) => api.get('/orders', { params }),
  getOrder: (id) => api.get(`/orders/${id}`),
  updateOrder: (id, data) => api.put(`/orders/${id}`, data),
  cancelOrder: (id, data) => api.post(`/orders/${id}/cancel`, data),
  processPayment: (id, paymentData) => api.post(`/orders/${id}/payment`, paymentData),
  refundOrder: (id, data) => api.post(`/orders/${id}/refund`, data)
}
export const reviewAPI = {
  getProductReviews: (productId, params = {}) => 
    api.get(`/reviews/product/${productId}`, { params }),
  createReview: (productId, data) => 
    api.post('/reviews', { ...data, productId }),
  updateReview: (reviewId, data) => 
    api.put(`/reviews/${reviewId}`, data),
  deleteReview: (reviewId) => 
    api.delete(`/reviews/${reviewId}`),
};
export const favoritesAPI = {
  getFavorites: (params = {}) => 
    api.get('/favorites', { params }),
  getFavoritesCount: () => 
    api.get('/favorites/count'),
  checkFavoriteStatus: (productId) => 
    api.get(`/favorites/check/${productId}`),
  addToFavorites: (productId) => 
    api.post(`/favorites/${productId}`),
  removeFromFavorites: (productId) => 
    api.delete(`/favorites/${productId}`),
  toggleFavorite: (productId) => 
    api.patch(`/favorites/${productId}/toggle`, {})
};
export const ratingAPI = {
  getRatings: (params) => api.get('/ratings', { params }),
  getUserRatings: (userId) => api.get(`/ratings/user/${userId}`),
  createRating: (data) => api.post('/ratings', data),
  updateRating: (id, data) => api.put(`/ratings/${id}`, data),
  deleteRating: (id) => api.delete(`/ratings/${id}`),
  markHelpful: (id) => api.put(`/ratings/${id}/helpful`),
  reportRating: (id, data) => api.post(`/ratings/${id}/report`, data),
  moderateRating: (id, data) => api.put(`/ratings/${id}/moderate`, data)
}
export const chatAPI = {
  getChatHistory: (params) => api.get('/chat/history', { params }),
  sendMessage: (data) => api.post('/chat/send', data),
  editMessage: (id, data) => api.put(`/chat/${id}`, data),
  deleteMessage: (id) => api.delete(`/chat/${id}`),
  markAsRead: (data) => api.put('/chat/read', data),
  getUnreadCount: (params) => api.get('/chat/unread-count', { params }),
  getChatRooms: (params) => api.get('/chat/rooms', { params })
}
export const aiAPI = {
  askQuestion: (data) => api.post('/ai/ask', data),
  askGeneral: (data) => api.post('/ai/ask', data),
  askPetAdvice: (data) => api.post('/ai/pet-advice', data),
  getHealthRecommendations: (data) => api.post('/ai/health-recommendations', data),
  getStatus: () => api.get('/ai/status')
}
export const adminAPI = {
  getDashboardStats: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getPayments: (params) => api.get('/admin/payments', { params }),
  getPaymentStats: () => api.get('/admin/payment-stats'),
  updatePaymentStatus: (id, status) => api.put(`/admin/payments/${id}/status`, { status }),
  getPaymentProviders: () => api.get('/admin/payment-providers'),
  addPaymentProvider: (data) => api.post('/admin/payment-providers', data),
  updatePaymentProvider: (id, data) => api.put(`/admin/payment-providers/${id}`, data),
  deletePaymentProvider: (id) => api.delete(`/admin/payment-providers/${id}`),
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),
  getAuditStats: () => api.get('/admin/audit-stats'),
  broadcastNotification: (data) => api.post('/admin/broadcast', data),
  getSystemHealth: () => api.get('/admin/system-health'),
  getPendingApprovals: () => {
    console.log('adminAPI.getPendingApprovals called')
    return api.get('/admin/approvals')
  },
  approveVet: (id, data) => api.post(`/admin/vets/${id}/approve`, data),
  rejectVet: (id, data) => api.post(`/admin/vets/${id}/reject`, data),
  approveShelter: (id, data) => api.post(`/admin/shelters/${id}/approve`, data),
  rejectShelter: (id, data) => api.post(`/admin/shelters/${id}/reject`, data)
}
export const documentAPI = {
  getPetDocuments: (petId, params = {}) => api.get(`/documents/pet/${petId}`, { params }),
  getUserDocuments: (params = {}) => api.get('/documents', { params }),
  getDocument: (id) => api.get(`/documents/${id}`),
  uploadDocuments: (petId, formData) => api.post(`/documents/pet/${petId}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateDocument: (id, data) => api.put(`/documents/${id}`, data),
  deleteDocument: (id) => api.delete(`/documents/${id}`),
  downloadDocument: (id) => api.get(`/documents/${id}/download`, { responseType: 'blob' })
}
export const uploadAPI = {
  uploadSingle: (formData) => api.post('/uploads/single', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  uploadMultiple: (formData) => api.post('/uploads/multiple', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteFile: (filename) => api.delete(`/uploads/${filename}`)
}
export default api
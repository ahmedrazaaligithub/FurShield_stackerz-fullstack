import { Routes, Route } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { LoadingSpinner } from './components/ui/LoadingSpinner'

import HomePage from './pages/HomePage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import VerifyEmailPage from './pages/auth/VerifyEmailPage'

import DashboardPage from './pages/dashboard/DashboardPage'
import ProfilePage from './pages/profile/ProfilePage'

import PetsPage from './pages/pets/PetsPage'
import PetDetailsPage from './pages/pets/PetDetailsPage'
import AddPetPage from './pages/pets/AddPetPage'

import AppointmentsPage from './pages/appointments/AppointmentsPage'
import BookAppointmentPage from './pages/appointments/BookAppointmentPage'
import AppointmentDetailsPage from './pages/appointments/AppointmentDetailsPage'

import AdoptionPage from './pages/adoption/AdoptionPage'
import AdoptionDetailsPage from './pages/adoption/AdoptionDetailsPage'
import CreateListingPage from './pages/adoption/CreateListingPage'

import ShopPage from './pages/shop/ShopPage'
import ProductDetailsPage from './pages/shop/ProductDetailsPage'
import CartPage from './pages/shop/CartPage'
import CheckoutPage from './pages/shop/CheckoutPage'
import OrdersPage from './pages/shop/OrdersPage'

import ChatPage from './pages/chat/ChatPage'
import AIAssistantPage from './pages/ai/AIAssistantPage'

import AdminLayout from './components/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminPaymentsPage from './pages/admin/AdminPaymentsPage'
import AdminAuditPage from './pages/admin/AdminAuditPage'
import AdminLoginPage from './pages/admin/AdminLoginPage'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
      
      <Route path="/adoption" element={<AdoptionPage />} />
      <Route path="/adoption/:id" element={<AdoptionDetailsPage />} />
      <Route path="/shop" element={<ShopPage />} />
      <Route path="/shop/product/:id" element={<ProductDetailsPage />} />
      
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        
        <Route path="/pets" element={<PetsPage />} />
        <Route path="/pets/add" element={<AddPetPage />} />
        <Route path="/pets/:id" element={<PetDetailsPage />} />
        <Route path="/pets/:id/edit" element={<AddPetPage />} />
        
        <Route path="/appointments" element={<AppointmentsPage />} />
        <Route path="/appointments/book" element={<BookAppointmentPage />} />
        <Route path="/appointments/:id" element={<AppointmentDetailsPage />} />
        
        <Route path="/adoption/create" element={<CreateListingPage />} />
        
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/chat/:roomId" element={<ChatPage />} />
        <Route path="/ai-assistant" element={<AIAssistantPage />} />
      </Route>
      
      {/* Admin Routes - Outside of protected route */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={
        <ProtectedRoute requiredRole="admin">
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="payments" element={<AdminPaymentsPage />} />
        <Route path="audit" element={<AdminAuditPage />} />
      </Route>
      
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App

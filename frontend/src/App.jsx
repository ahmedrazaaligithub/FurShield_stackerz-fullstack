import { Routes, Route } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { LoadingSpinner } from './components/ui/LoadingSpinner'
import ErrorBoundary from './components/common/ErrorBoundary'
import HomePage from './pages/HomePage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import VerifyEmailPage from './pages/auth/VerifyEmailPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import ProfilePage from './pages/profile/ProfilePage'
import UserProfilePage from './pages/profile/UserProfilePage'
import PetsPage from './pages/pets/PetsPage'
import PetDetailsPage from './pages/pets/PetDetailsPage'
import AddPetPage from './pages/pets/AddPetPage'
import AppointmentsPage from './pages/appointments/AppointmentsPage'
import BookAppointmentPage from './pages/appointments/BookAppointmentPage'
import AppointmentDetailsPage from './pages/appointments/AppointmentDetailsPage'
import AdoptionPage from './pages/adoption/AdoptionPage'
import AdoptionDetailsPage from './pages/adoption/AdoptionDetailsPage'
import CreateListingPage from './pages/adoption/CreateListingPage'
import InquiriesPage from './pages/inquiries/InquiriesPage'
import ShelterOrdersPage from './pages/shelter/ShelterOrdersPage'
import ShopPage from './pages/shop/ShopPage'
import ProductDetailsPage from './pages/shop/ProductDetailsPage'
import VetDirectoryPage from './pages/vets/VetDirectoryPage'
import VetProfilePage from './pages/vets/VetProfilePage'
import FavoritesPage from './pages/shop/FavoritesPage'
import CartPage from './pages/shop/CartPage'
import CheckoutPage from './pages/shop/CheckoutPage'
import OrderSuccessPage from './pages/shop/OrderSuccessPage'
import OrderDetailsPage from './pages/shop/OrderDetailsPage'
import OrdersPage from './pages/shop/OrdersPage'
import ChatPage from './pages/chat/ChatPage'
import AIAssistantPage from './pages/ai/AIAssistantPage'
import AdminLayout from './components/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminOrdersPage from './pages/admin/AdminOrdersPage'
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage'
import AdminProductsPage from './pages/admin/AdminProductsPage'
import AdminShelterApprovalPage from './pages/admin/AdminShelterApprovalPage'
import AdminPaymentsPage from './pages/admin/AdminPaymentsPage'
import AdminAuditLogsPage from './pages/admin/AdminAuditLogsPage'
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
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
        <Route path="/adoption/:id" element={<AdoptionDetailsPage />} />
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/:userId" element={<UserProfilePage />} />
        <Route path="/pets" element={<PetsPage />} />
        <Route path="/pets/add" element={<AddPetPage />} />
        <Route path="/pets/:id" element={<PetDetailsPage />} />
        <Route path="/pets/:id/edit" element={<AddPetPage />} />
        <Route path="/appointments" element={<AppointmentsPage />} />
        <Route path="/appointments/book" element={<BookAppointmentPage />} />
        <Route path="/appointments/:id" element={<AppointmentDetailsPage />} />
        <Route path="/adoption" element={<AdoptionPage />} />
        <Route path="/adoption/create" element={<CreateListingPage />} />
        <Route path="/inquiries" element={<InquiriesPage />} />
        <Route path="/shelter/orders" element={<ShelterOrdersPage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/shop/product/:id" element={<ProductDetailsPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order-success/:orderId?" element={<OrderSuccessPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/:id" element={<OrderDetailsPage />} />
        <Route path="/vets" element={<VetDirectoryPage />} />
        <Route path="/vets/:id" element={<VetProfilePage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/chat/:roomId" element={<ChatPage />} />
        <Route path="/ai-assistant" element={<AIAssistantPage />} />
      </Route>
      {}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="categories" element={<AdminCategoriesPage />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="shelter-approval" element={<AdminShelterApprovalPage />} />
        <Route path="payments" element={<AdminPaymentsPage />} />
        <Route path="audit-logs" element={<AdminAuditLogsPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </ErrorBoundary>
  )
}
export default App
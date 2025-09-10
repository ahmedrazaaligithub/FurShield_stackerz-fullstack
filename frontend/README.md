# PetCare Frontend

React frontend for the PetCare pet management platform built with Vite.

## 🚀 Quick Start

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start development server:
```bash
npm run dev
```

## 📋 Environment Variables

Create a `.env` file with the following variables:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000

# Feature Flags
VITE_AI_ENABLED=true
```

## 🏗️ Architecture

### Directory Structure
```
src/
├── components/      # Reusable UI components
│   ├── layout/     # Layout components (Header, Sidebar, etc.)
│   └── ui/         # Base UI components (Button, Input, etc.)
├── contexts/        # React contexts for global state
├── pages/           # Page components
│   ├── auth/       # Authentication pages
│   ├── dashboard/  # Dashboard pages
│   ├── pets/       # Pet management pages
│   ├── appointments/ # Appointment pages
│   ├── adoption/   # Adoption pages
│   ├── shop/       # E-commerce pages
│   ├── chat/       # Chat pages
│   ├── ai/         # AI assistant pages
│   ├── admin/      # Admin pages
│   └── profile/    # User profile pages
├── services/        # API service functions
├── hooks/           # Custom React hooks
├── utils/           # Utility functions
├── styles/          # Global styles and CSS
└── assets/          # Static assets
```

### Key Technologies

#### Core Framework
- **React 18** - Latest React with concurrent features
- **Vite** - Fast build tool and dev server
- **React Router v6** - Client-side routing

#### State Management
- **TanStack Query** - Server state management and caching
- **React Context** - Global client state (auth, socket)
- **React Hook Form** - Form state management

#### UI & Styling
- **TailwindCSS** - Utility-first CSS framework
- **Headless UI** - Unstyled, accessible UI components
- **Heroicons** - Beautiful SVG icons
- **React Hot Toast** - Toast notifications

#### Real-time Features
- **Socket.IO Client** - Real-time communication
- **React Query** - Optimistic updates and cache invalidation

#### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixes

## 🎨 Design System

### Color Palette
```css
/* Primary Colors */
--primary-50: #eff6ff
--primary-100: #dbeafe
--primary-600: #2563eb
--primary-700: #1d4ed8

/* Secondary Colors */
--secondary-50: #f0fdf4
--secondary-100: #dcfce7
--secondary-600: #16a34a
--secondary-700: #15803d

/* Accent Colors */
--accent-50: #fef3c7
--accent-100: #fde68a
--accent-600: #d97706
--accent-700: #b45309
```

### Typography
- **Primary Font**: Poppins (headings)
- **Secondary Font**: Nunito (body text)
- **Font Sizes**: Tailwind's default scale
- **Font Weights**: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

### Component Classes
```css
/* Buttons */
.btn - Base button styles
.btn-primary - Primary button
.btn-secondary - Secondary button
.btn-outline - Outlined button
.btn-ghost - Ghost button
.btn-sm, .btn-md, .btn-lg - Size variants

/* Cards */
.card - Base card container
.card-header - Card header section
.card-content - Card content section

/* Form Elements */
.input - Text input styles
.textarea - Textarea styles
.label - Form label styles

/* Badges */
.badge - Base badge styles
.badge-primary, .badge-secondary, etc. - Color variants
```

## 📱 Pages & Features

### Authentication Pages
- **Login** (`/login`) - User authentication
- **Register** (`/register`) - User registration with role selection
- **Forgot Password** (`/forgot-password`) - Password reset request
- **Reset Password** (`/reset-password/:token`) - Password reset form
- **Verify Email** (`/verify-email/:token`) - Email verification

### Main Application Pages
- **Dashboard** (`/dashboard`) - Overview of user's pets and activities
- **Profile** (`/profile`) - User profile management
- **Pets** (`/pets`) - Pet management and listing
- **Add Pet** (`/pets/add`) - Register new pet
- **Pet Details** (`/pets/:id`) - Individual pet information
- **Appointments** (`/appointments`) - Appointment management
- **Book Appointment** (`/appointments/book`) - Schedule new appointment
- **Adoption** (`/adoption`) - Browse pets for adoption
- **Shop** (`/shop`) - Pet products and supplies
- **Chat** (`/chat`) - Real-time messaging with vets
- **AI Assistant** (`/ai-assistant`) - AI-powered pet care advice

### Admin Pages (Admin Role Only)
- **Admin Dashboard** (`/admin`) - System overview and statistics
- **User Management** (`/admin/users`) - Manage platform users
- **Payment Providers** (`/admin/payments`) - Configure payment options
- **Audit Logs** (`/admin/audit`) - System activity logs

## 🔌 API Integration

### API Service Structure
```javascript
// services/api.js
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true
})

// Automatic token refresh
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Refresh token logic
    }
    return Promise.reject(error)
  }
)
```

### Service Modules
- `authAPI` - Authentication endpoints
- `userAPI` - User management
- `petAPI` - Pet operations
- `appointmentAPI` - Appointment management
- `shelterAPI` - Shelter operations
- `adoptionAPI` - Adoption listings
- `productAPI` - Product catalog
- `orderAPI` - Order management
- `ratingAPI` - Reviews and ratings
- `chatAPI` - Messaging
- `aiAPI` - AI assistant
- `adminAPI` - Administrative functions
- `uploadAPI` - File uploads

## 🔄 State Management

### React Query Setup
```javascript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})
```

### Context Providers
- **AuthContext** - User authentication state
- **SocketContext** - Real-time connection and notifications

### Custom Hooks
- `useAuth()` - Authentication state and methods
- `useSocket()` - Socket connection and real-time features
- `usePets()` - Pet data management
- `useAppointments()` - Appointment data
- `useNotifications()` - Notification management

## 🔔 Real-time Features

### Socket.IO Integration
```javascript
// Real-time notifications
socket.on('new_notification', (notification) => {
  toast.success(notification.title)
  updateNotifications(notification)
})

// Chat messages
socket.on('new_message', (message) => {
  updateChatHistory(message)
})

// Appointment updates
socket.on('appointment_confirmed', ({ appointment }) => {
  toast.success('Your appointment has been confirmed!')
  queryClient.invalidateQueries(['appointments'])
})
```

### Notification System
- Toast notifications for immediate feedback
- In-app notification panel with unread count
- Real-time updates for appointments, messages, and system events
- Socket connection status indicator

## 🎯 Performance Optimizations

### Code Splitting
```javascript
// Lazy load pages
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'))
const PetsPage = lazy(() => import('./pages/pets/PetsPage'))
```

### Image Optimization
- Lazy loading for pet photos and avatars
- Responsive image sizing
- Placeholder images during loading

### Caching Strategy
- React Query for server state caching
- Optimistic updates for better UX
- Background refetching for fresh data

## 🧪 Testing

### Test Setup
```bash
npm run test        # Run tests
npm run test:watch  # Watch mode
npm run test:coverage # Coverage report
```

### Testing Libraries
- **Vitest** - Test runner
- **React Testing Library** - Component testing
- **MSW** - API mocking

## 📱 Responsive Design

### Breakpoints
- `sm`: 640px and up
- `md`: 768px and up
- `lg`: 1024px and up
- `xl`: 1280px and up

### Mobile-First Approach
- All components designed mobile-first
- Touch-friendly interface elements
- Optimized navigation for mobile devices
- Responsive grid layouts

## 🔒 Security

### Client-Side Security
- JWT token storage in localStorage
- Automatic token refresh
- Route protection based on authentication
- Role-based component rendering
- Input validation and sanitization

### CORS Configuration
- Configured to work with backend API
- Credentials included in requests
- Proper error handling for network issues

## 🚀 Build & Deployment

### Development
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run lint:fix     # Fix linting issues
```

### Production Build
```bash
npm run build
```

Output directory: `dist/`

### Environment-Specific Builds
- Development: Hot module replacement, source maps
- Production: Minified, optimized, tree-shaken

### Deployment Options
- **Static Hosting**: Netlify, Vercel, GitHub Pages
- **CDN**: CloudFront, CloudFlare
- **Traditional Hosting**: Apache, Nginx

### Build Optimization
- Vite's built-in optimizations
- Tree shaking for smaller bundles
- Asset optimization and compression
- Chunk splitting for better caching

## 🎨 Customization

### Tailwind Configuration
```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { /* custom colors */ },
        secondary: { /* custom colors */ }
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        body: ['Nunito', 'sans-serif']
      }
    }
  }
}
```

### Component Customization
- Extend base components in `components/ui/`
- Use CSS modules for component-specific styles
- Leverage Tailwind's utility classes for rapid development

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Follow coding standards and conventions
4. Write tests for new components
5. Update documentation
6. Submit pull request

### Code Standards
- Use TypeScript for type safety (if migrating)
- Follow React best practices
- Use meaningful component and variable names
- Write comprehensive JSDoc comments
- Maintain consistent file structure

## 📄 License

MIT License - see LICENSE file for details.

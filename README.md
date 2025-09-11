# FurShield - Pet Care Platform

A comprehensive MERN stack application for pet care management, connecting pet owners with veterinarians, shelters, and pet care services.

## 🐾 Features

- **User Management**: Registration, authentication, and profile management
- **Pet Profiles**: Comprehensive pet information and health records
- **Veterinarian Services**: Appointment booking and consultation
- **Shelter Integration**: Pet adoption listings and management
- **E-commerce**: Pet supplies and accessories marketplace
- **AI Assistant**: Pet care advice and recommendations
- **Real-time Chat**: Communication between users, vets, and shelters
- **Admin Panel**: Complete platform management and analytics

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Socket.io** for real-time features
- **Multer** for file uploads
- **Nodemailer** for email services

### Frontend
- **React 18** with Vite
- **React Router** for navigation
- **TanStack Query** for data fetching
- **Tailwind CSS** for styling
- **Socket.io Client** for real-time features

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd FurShield
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```

### Environment Variables

Create `.env` files in both backend and frontend directories:

#### Backend (.env)
```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/furshield
JWT_SECRET=your_jwt_secret_key_here_make_it_long_and_secure
JWT_EXPIRE=30d
CLIENT_URL=http://localhost:5173

# Admin Credentials (Auto-seeded on startup)
ADMIN_EMAIL=admin@gmail.com
ADMIN_PASSWORD=admin123

# Email Configuration
EMAIL_FROM=noreply@furshield.com
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

#### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

### Running the Application

1. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod
   
   # Or make sure MongoDB Atlas connection is configured
   ```

2. **Start Backend Server**
   ```bash
   cd backend
   npm run dev
   ```
   
   **Important**: The admin user will be automatically created on first startup using the credentials from `.env`

3. **Start Frontend Development Server**
   ```bash
   cd frontend
   npm run dev
   ```

4. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000
   - Admin Panel: http://localhost:5173/admin

## 🔐 Admin Panel Access

### Automatic Admin Seeding
The system automatically creates an admin user when the backend starts for the first time. The credentials are taken from your `.env` file:

- **Email**: `admin@gmail.com` (or value from `ADMIN_EMAIL`)
- **Password**: `admin123` (or value from `ADMIN_PASSWORD`)

### Admin Login Process
1. **Start both servers** (backend and frontend)
2. **Navigate to**: http://localhost:5173/admin/login
3. **Login with admin credentials**:
   - Email: `admin@gmail.com`
   - Password: `admin123`
4. **Automatic redirect**: You'll be redirected to `/admin` dashboard

**Note**: Admin login is separate from regular user login and uses a dedicated admin login page.

### Admin Panel Features
- **Dashboard**: Platform statistics and overview
- **User Management**: View, edit, activate/deactivate users
- **Payment Management**: Monitor transactions and payment status
- **Audit Logs**: Security events and system activity monitoring
- **System Health**: Real-time platform status

### Admin Panel URLs
- Dashboard: http://localhost:5173/admin
- Users: http://localhost:5173/admin/users
- Payments: http://localhost:5173/admin/payments
- Audit Logs: http://localhost:5173/admin/audit

### Security Features
- Role-based authentication (admin role required)
- Session management with JWT tokens
- Comprehensive audit logging
- IP address tracking for admin actions
- Account verification requirements

## 🛠️ Troubleshooting

### Backend Connection Issues
If you see `ERR_CONNECTION_REFUSED`:
1. Make sure MongoDB is running
2. Check if backend server started successfully
3. Verify `.env` configuration
4. Check console for error messages

### Admin Access Issues
1. Ensure both servers are running
2. Check server logs for admin user creation
3. Verify admin credentials in `.env`
4. Clear browser cache/localStorage if needed

### Database Issues
1. Make sure MongoDB is installed and running
2. Check `MONGO_URI` in `.env` file
3. Verify database permissions
4. Check MongoDB logs for errors

## API Documentation

The API follows RESTful conventions with the following base structure:
- Base URL: `http://localhost:5000/api/v1`
- Authentication: JWT Bearer tokens
- Response Format: JSON

### Main Endpoints
- `/auth` - Authentication and user management
- `/users` - User profiles and settings
- `/pets` - Pet management
- `/appointments` - Veterinary appointments
- `/adoptions` - Pet adoption listings
- `/products` - E-commerce functionality
- `/admin` - Administrative functions (admin role required)

### Admin Endpoints
- `GET /admin/dashboard` - Dashboard statistics
- `GET /admin/users` - User management
- `GET /admin/payments` - Payment monitoring
- `GET /admin/audit-logs` - Security audit logs
- `GET /admin/system-health` - System status

## Project Structure

```
FurShield/
├── backend/
│   ├── src/
│   │   ├── config/          # Database and app configuration
│   │   ├── controllers/     # Route handlers
│   │   ├── middlewares/     # Custom middleware
│   │   ├── models/          # MongoDB schemas
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Utility functions
│   │   │   └── seedAdmin.js # Admin user seeding
│   │   └── server.js        # App entry point
│   └── uploads/             # File uploads
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   │   └── admin/       # Admin-specific components
│   │   ├── contexts/        # React contexts
│   │   ├── pages/           # Page components
│   │   │   └── admin/       # Admin panel pages
│   │   ├── services/        # API services
│   │   ├── styles/          # CSS files
│   │   └── utils/           # Utility functions
│   └── public/              # Static assets
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

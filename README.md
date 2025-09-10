# PetCare - Complete Pet Management Platform

A comprehensive MERN stack application for pet care management, connecting pet owners with veterinarians, adoption centers, and premium pet products.

## 🐾 Features

### For Pet Owners
- **Pet Management**: Register and track multiple pets with health records, photos, and medical history
- **Vet Appointments**: Book and manage appointments with verified veterinarians
- **Health Tracking**: Monitor vaccinations, medications, and medical conditions
- **AI Assistant**: Get instant pet care advice and health recommendations
- **Real-time Chat**: Communicate with veterinarians during appointments
- **Pet Adoption**: Browse and inquire about pets available for adoption
- **Pet Store**: Shop for premium pet supplies, food, and accessories

### For Veterinarians
- **Professional Profile**: Verified veterinarian accounts with credentials
- **Appointment Management**: Accept, schedule, and manage patient appointments
- **Health Records**: Create and update pet health records
- **Real-time Communication**: Chat with pet owners during consultations
- **AI-Powered Insights**: Access AI recommendations for pet health

### For Shelters & Rescues
- **Adoption Listings**: Create and manage pet adoption listings
- **Inquiry Management**: Handle adoption inquiries and applications
- **Shelter Profile**: Showcase services, location, and available pets
- **Priority System**: Mark urgent adoption cases

### For Administrators
- **User Management**: Manage users, verify veterinarians, and moderate content
- **Payment Providers**: Configure and manage payment processing options
- **System Monitoring**: Dashboard with analytics and system health
- **Audit Logs**: Track all administrative actions and system events

## 🚀 Technology Stack

### Backend
- **Node.js** with Express.js framework
- **MongoDB** with Mongoose ODM
- **Socket.IO** for real-time communication
- **JWT** authentication with refresh tokens
- **bcryptjs** for password hashing
- **Joi** for request validation
- **Winston** for logging
- **Nodemailer** for email notifications
- **Multer** for file uploads
- **Helmet** for security headers

### Frontend
- **React 18** with Vite build tool
- **React Router** for navigation
- **TanStack Query** for server state management
- **TailwindCSS** for styling
- **Headless UI** for accessible components
- **React Hook Form** for form handling
- **Socket.IO Client** for real-time features
- **React Hot Toast** for notifications

### Security Features
- **CORS** protection with whitelist
- **Rate limiting** on sensitive endpoints
- **XSS protection** with sanitization
- **MongoDB injection** prevention
- **Secure HTTP headers** with Helmet
- **Input validation** with Joi schemas
- **Account lockout** after failed login attempts
- **Encrypted sensitive data** storage

## 📁 Project Structure

```
PetCare/
├── backend/                 # Node.js/Express backend
│   ├── src/
│   │   ├── config/         # Database and configuration
│   │   ├── controllers/    # Route handlers
│   │   ├── middlewares/    # Custom middleware
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic services
│   │   ├── sockets/        # Socket.IO handlers
│   │   ├── utils/          # Utility functions
│   │   └── server.js       # Entry point
│   ├── package.json
│   └── .env.example
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── styles/         # CSS styles
│   │   └── utils/          # Utility functions
│   ├── package.json
│   └── .env.example
└── README.md
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (v5 or higher)
- npm or yarn package manager
- Git

### Installation & Setup

#### Backend Setup
```bash
cd backend
npm install
# Copy .env.example to .env and fill in your values
cp .env.example .env
# Edit .env with your configuration
npm run dev   # Development with nodemon
npm start     # Production
```

#### Frontend Setup
```bash
# Create Vite React app (if not already created)
npm create vite@latest frontend -- --template react
cd frontend
npm install
# Add required dependencies
npm i react-router-dom @tanstack/react-query socket.io-client gsap lottie-web react-lottie
# Copy .env.example to .env and configure
cp .env.example .env
npm run dev   # Development server
npm run build # Production build
npm run preview # Preview production build
```

## Features

- **Authentication**: JWT with refresh tokens, secure password hashing
- **Real-time**: Socket.IO for notifications and chat
- **AI Integration**: Configurable AI provider for pet care assistance
- **Admin Panel**: Payment provider management, user verification
- **File Uploads**: Local filesystem or MongoDB GridFS
- **Email Notifications**: Nodemailer with SMTP configuration
- **Security**: OWASP protection, rate limiting, input validation
- **Responsive UI**: Modern design with animations and accessibility

## API Documentation

OpenAPI specification available at `/backend/openapi.yaml`

## Development

Both servers can run concurrently:
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend  
cd frontend && npm run dev
```

## Production Deployment

See individual README files in `backend/` and `frontend/` folders for detailed deployment instructions.

## License

MIT

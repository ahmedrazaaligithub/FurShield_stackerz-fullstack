# PetCare Backend

Node.js/Express backend for the PetCare pet management platform.

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
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/petcare

# JWT Secrets
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Client Configuration
CLIENT_URL=http://localhost:5173

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# AI Integration
AI_API_KEY=your-openai-api-key
AI_PROVIDER=openai

# File Upload
UPLOAD_DIR=uploads

# Security
ENCRYPTION_KEY=your-32-character-encryption-key-here
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Optional: Redis for session storage
REDIS_URL=redis://localhost:6379
```

## 🏗️ Architecture

### Directory Structure
```
src/
├── config/          # Configuration files
│   └── database.js  # MongoDB connection
├── controllers/     # Route handlers
├── middlewares/     # Custom middleware
├── models/          # Mongoose schemas
├── routes/          # API routes
├── services/        # Business logic
├── sockets/         # Socket.IO handlers
├── utils/           # Utility functions
└── server.js        # Application entry point
```

### Key Components

#### Models
- **User**: User accounts with role-based access
- **Pet**: Pet profiles with health records
- **Appointment**: Vet appointment scheduling
- **HealthRecord**: Medical history tracking
- **Shelter**: Animal shelter profiles
- **AdoptionListing**: Pet adoption listings
- **Product**: Pet store products
- **Order**: E-commerce orders
- **Rating**: Review and rating system
- **PaymentProvider**: Payment gateway configuration
- **ChatMessage**: Real-time messaging
- **Notification**: System notifications
- **AuditLog**: Administrative action tracking

#### Services
- **Email Service**: Transactional email notifications
- **AI Service**: Pet care AI assistant integration
- **Payment Service**: Payment processing abstraction
- **Upload Service**: File upload handling

#### Security Features
- JWT authentication with refresh tokens
- Role-based access control (RBAC)
- Rate limiting on sensitive endpoints
- Input validation with Joi schemas
- Password hashing with bcryptjs
- Account lockout after failed attempts
- Audit logging for admin actions
- Encrypted storage of sensitive data

## 🔌 API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - User registration
- `POST /login` - User login
- `POST /logout` - User logout
- `POST /refresh` - Refresh access token
- `POST /forgot-password` - Request password reset
- `POST /reset-password/:token` - Reset password
- `POST /verify-email/:token` - Verify email address
- `GET /me` - Get current user profile

### Users (`/api/users`)
- `GET /profile` - Get user profile
- `PUT /profile` - Update user profile
- `POST /avatar` - Upload user avatar
- `DELETE /profile` - Delete user account
- `GET /vets` - Get verified veterinarians
- `POST /vet-verification` - Request vet verification
- `PUT /:id/verify-vet` - Approve vet verification (admin)
- `PUT /:id/reject-vet` - Reject vet verification (admin)

### Pets (`/api/pets`)
- `GET /` - Get user's pets
- `POST /` - Create new pet
- `GET /:id` - Get pet details
- `PUT /:id` - Update pet information
- `DELETE /:id` - Delete pet
- `POST /:id/photos` - Upload pet photos
- `GET /:id/health-records` - Get pet health records
- `POST /:id/health-records` - Create health record

### Appointments (`/api/appointments`)
- `GET /` - Get appointments
- `POST /` - Book new appointment
- `GET /:id` - Get appointment details
- `PUT /:id` - Update appointment
- `DELETE /:id` - Cancel appointment
- `PUT /:id/accept` - Accept appointment (vet)
- `PUT /:id/propose-time` - Propose time change
- `PUT /:id/complete` - Complete appointment
- `PUT /:id/cancel` - Cancel appointment

### Shelters (`/api/shelters`)
- `GET /` - Get shelters
- `POST /` - Create shelter profile
- `GET /:id` - Get shelter details
- `PUT /:id` - Update shelter
- `DELETE /:id` - Delete shelter
- `PUT /:id/verify` - Verify shelter (admin)
- `PUT /:id/reject` - Reject shelter verification

### Adoption (`/api/adoption`)
- `GET /` - Get adoption listings
- `POST /` - Create adoption listing
- `GET /:id` - Get listing details
- `PUT /:id` - Update listing
- `DELETE /:id` - Delete listing
- `POST /:id/inquire` - Submit adoption inquiry
- `PUT /:id/inquiries/:inquiryId` - Update inquiry status
- `PUT /:id/complete/:inquiryId` - Complete adoption

### Products (`/api/products`)
- `GET /` - Get products
- `POST /` - Create product (admin/vendor)
- `GET /:id` - Get product details
- `PUT /:id` - Update product
- `DELETE /:id` - Delete product
- `GET /categories` - Get product categories

### Orders (`/api/orders`)
- `GET /` - Get orders
- `POST /` - Create order
- `GET /:id` - Get order details
- `PUT /:id` - Update order
- `PUT /:id/cancel` - Cancel order
- `POST /:id/payment` - Process payment
- `POST /:id/refund` - Process refund

### Ratings (`/api/ratings`)
- `GET /` - Get ratings
- `POST /` - Create rating
- `PUT /:id` - Update rating
- `DELETE /:id` - Delete rating
- `PUT /:id/helpful` - Mark as helpful
- `POST /:id/report` - Report rating
- `PUT /:id/moderate` - Moderate rating (admin)

### Chat (`/api/chat`)
- `GET /history` - Get chat history
- `POST /send` - Send message
- `PUT /:id` - Edit message
- `DELETE /:id` - Delete message
- `PUT /read` - Mark messages as read
- `GET /unread-count` - Get unread count
- `GET /rooms` - Get chat rooms

### AI Assistant (`/api/ai`)
- `POST /ask` - General AI query
- `POST /pet-advice` - Pet-specific advice
- `POST /health-recommendations` - Health recommendations
- `GET /status` - AI service status

### Admin (`/api/admin`)
- `GET /dashboard` - Dashboard statistics
- `GET /payment-providers` - Get payment providers
- `POST /payment-providers` - Add payment provider
- `PUT /payment-providers/:id` - Update provider
- `DELETE /payment-providers/:id` - Delete provider
- `GET /audit-logs` - Get audit logs
- `POST /broadcast` - Broadcast notification
- `GET /health` - System health check
- `GET /users` - Get all users
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user

### File Upload (`/api/uploads`)
- `POST /single` - Upload single file
- `POST /multiple` - Upload multiple files
- `DELETE /:filename` - Delete file

## 🔄 Real-time Features

Socket.IO events for real-time communication:

### Client Events
- `join_chat` - Join chat room
- `send_message` - Send chat message
- `mark_messages_read` - Mark messages as read
- `request_chat` - Request chat with vet
- `accept_chat_request` - Accept chat request
- `typing_start` - Start typing indicator
- `typing_stop` - Stop typing indicator
- `admin_broadcast` - Admin broadcast message
- `payment_completed` - Payment completion notification

### Server Events
- `new_notification` - New notification received
- `new_message` - New chat message
- `appointment_confirmed` - Appointment confirmed
- `appointment_cancelled` - Appointment cancelled
- `payment_confirmed` - Payment confirmed
- `admin_broadcast` - Admin broadcast message
- `chat_request` - New chat request
- `chat_request_accepted` - Chat request accepted
- `adoption_status_update` - Adoption status change
- `payment_provider_added` - New payment provider

## 🧪 Testing

Run tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## 📝 Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues

## 🔒 Security

### Authentication & Authorization
- JWT tokens with short expiration (15 minutes)
- Refresh tokens with longer expiration (7 days)
- Role-based access control (owner, vet, shelter, admin)
- Account lockout after 5 failed login attempts

### Data Protection
- Password hashing with bcryptjs (12 salt rounds)
- Sensitive data encryption (AES-256-CBC)
- Input validation and sanitization
- MongoDB injection prevention
- XSS protection

### Rate Limiting
- Global rate limiting: 100 requests per 15 minutes
- Auth endpoints: 5 requests per 15 minutes
- AI endpoints: 20 requests per hour

## 🚀 Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Configure production database URL
3. Set secure JWT secrets
4. Configure SMTP settings
5. Set up file storage (local or S3)

### Production Considerations
- Use PM2 for process management
- Set up MongoDB replica set
- Configure reverse proxy (nginx)
- Enable SSL/TLS certificates
- Set up monitoring and logging
- Configure backup strategy

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Follow the existing code style
2. Write tests for new features
3. Update documentation
4. Submit pull requests to develop branch

## 📄 License

MIT License - see LICENSE file for details.

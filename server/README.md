# GolBot Backend Server

A comprehensive backend API for the GolBot vending machine system with enhanced logging, error handling, and code quality improvements.

## 🚀 Features

- **Enhanced Logging**: Comprehensive logging system with file output and console formatting
- **Robust Error Handling**: Custom error classes with proper HTTP status codes
- **Input Validation**: Comprehensive validation utilities for all inputs
- **Rate Limiting**: Protect APIs from abuse with configurable rate limits
- **Database Utilities**: Enhanced MongoDB operations with error handling
- **Security**: Helmet, CORS, input sanitization, and JWT authentication
- **Health Checks**: Built-in health monitoring endpoints
- **Graceful Shutdown**: Proper cleanup on server termination

## 📋 Prerequisites

- Node.js (v16+ recommended)
- MongoDB (v4.4+ recommended)
- npm or yarn package manager

## 🛠️ Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd golbot.in/server
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the development server:
```bash
npm run dev
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `EXPAPP_MONGO_URL` | MongoDB connection string | - | ✅ |
| `EXPAPP_PORT` | Server port | 5000 | ❌ |
| `NODE_ENV` | Environment mode | development | ❌ |
| `EXPAPP_JWT_SECRET` | JWT signing secret | - | ✅ |
| `SMS_SECRET_KEY` | 2Factor SMS API key | - | ✅ |
| `LOG_TO_FILE` | Enable file logging | false | ❌ |
| `FRONTEND_URL` | Frontend application URL | - | ❌ |

### Logging Configuration

The logging system provides multiple levels:
- `error`: Error conditions
- `warn`: Warning conditions  
- `info`: Informational messages
- `debug`: Debug information (development only)

Logs are output to:
- Console (with colors)
- Files (when `LOG_TO_FILE=true` or in production)
- Stored in `logs/` directory with daily rotation

## 📚 API Documentation

### Authentication Endpoints

#### POST `/api/v1/auth/send-otp`
Send OTP to phone number for authentication.

**Request Body:**
```json
{
  "phone": "9876543210"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "user": { "phone": "9876543210" },
    "expiresIn": 600
  }
}
```

#### POST `/api/v1/auth/verify-otp`
Verify OTP and get authentication token.

**Request Body:**
```json
{
  "phone": "9876543210",
  "otp": "1234"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "user": { "uid": "...", "phone": "9876543210" },
    "token": "jwt-token-here"
  }
}
```

### Order Endpoints

#### POST `/api/v1/order`
Create a new order.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "machineId": "MACHINE001",
  "items": [
    { "id": "item-id", "quantity": 2 }
  ]
}
```

#### GET `/api/v1/order/latest`
Get user's latest order.

#### GET `/api/v1/order/otp`
Get OTP for ready order pickup.

### Health Check

#### GET `/health`
Server health status.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-01-19T...",
  "environment": "development",
  "version": "1.0.0"
}
```

## 🗄️ Database Models

### User Model
- `phone`: String (required, unique)
- `verified`: Boolean
- `OTP`: String (temporary)
- `otpExpiry`: Date
- `lastLoginAt`: Date

### Order Model
- `uid`: ObjectId (ref: User)
- `machineId`: ObjectId (ref: Machine)
- `amount`: Object (price, gst, total)
- `orderStatus`: Enum (PENDING, PAID, PREPARING, READY, COMPLETED, CANCELLED)
- `orderCompleted`: Boolean
- `orderOtp`: String

### Machine Model
- `mid`: String (unique machine identifier)
- `name`: String
- `location`: String
- `isActive`: Boolean

## 🔒 Security Features

### Authentication
- JWT-based authentication
- Token expiration handling
- Secure password-less login via OTP

### Rate Limiting
- Global rate limits
- Endpoint-specific limits
- IP-based and user-based tracking

### Input Validation
- Comprehensive validation utilities
- XSS protection
- MongoDB injection prevention
- Phone number validation
- Email validation (where applicable)

### Security Headers
- Helmet.js security headers
- CORS configuration
- CSP policies

## 📊 Monitoring & Debugging

### Logging
```bash
# View today's logs
npm run logs

# View error logs
npm run logs:error

# Debug mode
npm run dev:debug
```

### Health Monitoring
The server includes built-in health checks and monitoring:
- Database connection status
- Memory usage
- Response times
- Error rates

## 🧪 Development

### Scripts
```bash
# Development with hot reload
npm run dev

# Production start
npm start

# Debug mode
npm run dev:debug

# Clean install
npm run clean
```

### Code Quality

The codebase follows these principles:
- **Separation of Concerns**: Controllers, utilities, and middleware are separated
- **Error Handling**: Comprehensive error handling with custom error classes
- **Logging**: Structured logging for debugging and monitoring
- **Validation**: Input validation at multiple levels
- **Security**: Multiple layers of security protection

### File Structure
```
server/
├── controllers/          # Request handlers
├── middlewares/         # Express middlewares
├── models/             # Database models
├── routes/             # Route definitions
├── utils/              # Utility functions
│   ├── logger.js       # Logging utility
│   ├── errors.js       # Custom error classes
│   ├── validation.js   # Input validation
│   ├── database.js     # Database utilities
│   ├── response.js     # API response helpers
│   └── rateLimiter.js  # Rate limiting
├── logs/               # Log files (auto-created)
├── server.js           # Main server file
└── package.json        # Dependencies and scripts
```

## 🚀 Deployment

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Configure production MongoDB URL
- [ ] Set strong JWT secret
- [ ] Configure proper CORS origins
- [ ] Enable file logging
- [ ] Set up log rotation
- [ ] Configure health checks
- [ ] Set up monitoring

### Environment-specific Configuration
```bash
# Production
NODE_ENV=production
LOG_TO_FILE=true
CORS_ORIGIN=https://yourdomain.com

# Development
NODE_ENV=development
LOG_TO_FILE=false
CORS_ORIGIN=*
```

## 🤝 Contributing

1. Follow the existing code structure
2. Add appropriate logging for new features
3. Include input validation
4. Handle errors properly
5. Update documentation

## 📄 License

[Add your license information here]

## 🐛 Troubleshooting

### Common Issues

**MongoDB Connection Failed**
- Check MongoDB is running
- Verify connection string in `.env`
- Check network connectivity

**JWT Token Issues**
- Verify `EXPAPP_JWT_SECRET` is set
- Check token expiration
- Ensure proper Bearer token format

**Rate Limit Errors**
- Check rate limit configuration
- Clear rate limit cache if needed
- Adjust limits for your use case

### Debug Mode
```bash
# Enable debug logging
DEBUG=golbot:* npm run dev

# Check health status
curl http://localhost:5000/health
```

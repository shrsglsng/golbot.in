import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import "express-async-errors";
import morgan from "morgan";
import mongoSanitize from "express-mongo-sanitize";
import helmet from "helmet";

// Import utilities
import logger from "./utils/logger.js";
import { responseMiddleware } from "./utils/response.js";

// routes
import AuthRoute from "./routes/authRoute.js";
import AdminRoute from "./routes/adminRoute.js";
import OrderRoute from "./routes/orderRoute.js";
import MachineRoute from "./routes/machineRoutes.js";
import PaymentRoute from "./routes/paymentRoutes.js";
import paymentWebhook from "./routes/paymentWebhook.js";

import { getAllItems } from "./controllers/utilController.js";

//middlewares
import notFoundMiddleware from "./middlewares/notFound.js";
import errorHandlerMiddleware from "./middlewares/errorHandler.js";

// constants
const BASE_URL_PATH = "/api/v1/";
const CONNECTION_URL = process.env.EXPAPP_MONGO_URL || process.env.EXPAPP_MONGO_LOCAL_URL;
const PORT = process.env.PORT || process.env.EXPAPP_PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const app = express();

// Enhanced startup logging
logger.info('🚀 Starting GolBot Server', {
  nodeEnv: NODE_ENV,
  port: PORT,
  mongoUrl: CONNECTION_URL ? 'configured' : 'missing'
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: NODE_ENV === 'production',
  crossOriginEmbedderPolicy: false
}));

// Request logging middleware (before routes)
if (NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}
app.use(logger.requestMiddleware());

// Response helper middleware
app.use(responseMiddleware);

// Webhook routes (before body parser to handle raw body)
app.use("/api/webhook", paymentWebhook);

// Body parsing middleware
app.use(bodyParser.json({ 
  limit: "30mb", 
  extended: true,
  verify: (req, res, buf) => {
    // Store raw body for webhook verification if needed
    if (req.originalUrl.includes('/webhook')) {
      req.rawBody = buf;
    }
  }
}));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGIN?.split(",").map(o => o.trim()).filter(Boolean);

console.log("🔧 CORS Configuration:");
console.log("📋 Allowed Origins:", allowedOrigins);
console.log("🌍 NODE_ENV:", NODE_ENV);

const corsOptions = {
  origin: function (origin, callback) {
    console.log("🌍 Incoming request from origin:", origin);
    
    // Allow requests with no origin (e.g., mobile apps, Postman)
    if (!origin) {
      console.log("✅ Allowing request with no origin");
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins && allowedOrigins.includes(origin)) {
      console.log("✅ Origin allowed:", origin);
      return callback(null, true);
    } else {
      console.error("❌ CORS Blocked - Origin not in allowed list:", origin);
      console.error("📋 Allowed origins:", allowedOrigins);
      return callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
};

app.use(cors(corsOptions));


// MongoDB injection protection
app.use(
  mongoSanitize({
    replaceWith: "_",
    onSanitize: ({ req, key }) => {
      logger.warn('Request sanitized', { 
        key, 
        originalUrl: req.originalUrl,
        method: req.method,
        ip: req.ip
      });
    },
  })
);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API routes
app.use(`${BASE_URL_PATH}auth`, AuthRoute);
app.use(`${BASE_URL_PATH}admin`, AdminRoute);
app.use(`${BASE_URL_PATH}order`, OrderRoute);
app.use(`${BASE_URL_PATH}machine`, MachineRoute);
app.use(`${BASE_URL_PATH}payment`, PaymentRoute);

// Utility routes
app.get(`${BASE_URL_PATH}getAllItems`, getAllItems);

// Error handling middleware (must be last)
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

// Enhanced MongoDB connection with retry logic
mongoose.set("strictQuery", true);

const connectDB = async (retries = 5) => {
  try {
    logger.info('🗄️  Attempting MongoDB connection...', { 
      retries: retries,
      url: CONNECTION_URL?.substring(0, 20) + '...' 
    });

    await mongoose.connect(CONNECTION_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false
    });

    logger.info('✅ MongoDB connected successfully');
    
    // Start server after successful DB connection
    const server = app.listen(PORT, () => {
      logger.info(`⚡️ Server running successfully`, {
        port: PORT,
        environment: NODE_ENV,
        mongoConnected: mongoose.connection.readyState === 1
      });
    });

    // Graceful shutdown handling
    const gracefulShutdown = (signal) => {
      logger.info(`🛑 ${signal} received. Starting graceful shutdown...`);
      
      server.close(() => {
        logger.info('💤 HTTP server closed.');
        
        mongoose.connection.close(false, () => {
          logger.info('💤 MongoDB connection closed.');
          process.exit(0);
        });
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('❌ MongoDB connection failed', {
      error: error.message,
      retries
    });

    if (retries > 0) {
      logger.info(`🔄 Retrying connection in 5 seconds... (${retries} attempts left)`);
      setTimeout(() => connectDB(retries - 1), 5000);
    } else {
      logger.error('💀 Max retries exceeded. Exiting...');
      process.exit(1);
    }
  }
};

// MongoDB event listeners
mongoose.connection.on('error', (err) => {
  logger.error('MongoDB connection error', { error: err.message });
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  logger.error('Unhandled Promise Rejection', {
    error: err.message,
    stack: err.stack
  });
  
  // Close server & exit process
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', {
    error: err.message,
    stack: err.stack
  });
  
  process.exit(1);
});

// Start the connection
connectDB();

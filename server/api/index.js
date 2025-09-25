// Vercel serverless function entry point
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';

import { authRouter } from '../src/routes/auth.js';
import { cookiesRouter } from '../src/routes/cookies.js';
import { websiteCookiesRouter } from '../src/routes/websiteCookies.js';
import { usersRouter } from '../src/routes/users.js';

const app = express();

// CORS configuration - Allow Chrome extensions and localhost
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow Chrome extensions
    if (origin.startsWith('chrome-extension://')) {
      console.log('✅ CORS: Allowing Chrome extension:', origin);
      return callback(null, true);
    }
    
    // Allow localhost and Vercel domains
    if (origin.startsWith('http://localhost:') || 
        origin.startsWith('https://localhost:') ||
        origin.includes('vercel.app') ||
        origin.includes('netlify.app')) {
      console.log('✅ CORS: Allowing origin:', origin);
      return callback(null, true);
    }
    
    // Allow specific origins from environment
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);
    if (allowedOrigins.includes(origin)) {
      console.log('✅ CORS: Allowing configured origin:', origin);
      return callback(null, true);
    }
    
    // For development, allow all origins
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ CORS: Development mode - allowing origin:', origin);
      return callback(null, true);
    }
    
    console.log('❌ CORS blocked for origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 1 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'ChatGPT Cookie Manager API', 
    status: 'running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/cookies', cookiesRouter);
app.use('/api/website-cookies', websiteCookiesRouter);
app.use('/api/users', usersRouter);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Validation error', details: err.message });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid ID format' });
  }
  
  if (err.code === 11000) {
    return res.status(409).json({ error: 'Duplicate entry' });
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// MongoDB connection
let cachedConnection = null;

async function connectToDatabase() {
  if (cachedConnection) {
    return cachedConnection;
  }

  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cookie_admin';
    
    const connection = await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ MongoDB connected successfully');
    cachedConnection = connection;
    return connection;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

// Vercel serverless function handler
export default async function handler(req, res) {
  try {
    // Connect to database
    await connectToDatabase();
    
    // Handle the request with Express app
    return app(req, res);
  } catch (error) {
    console.error('❌ Handler error:', error);
    return res.status(500).json({ 
      error: 'Database connection failed',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}

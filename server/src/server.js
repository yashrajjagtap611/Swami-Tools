import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';

import { authRouter } from './routes/auth.js';
import { cookiesRouter } from './routes/cookies.js';
import { websiteCookiesRouter } from './routes/websiteCookies.js';
import { usersRouter } from './routes/users.js';

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
    
    // Allow localhost
    if (origin.startsWith('http://localhost:') || origin.startsWith('https://localhost:')) {
      console.log('✅ CORS: Allowing localhost:', origin);
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
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept'],
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

// Handle preflight requests explicitly
app.options('*', (req, res) => {
  console.log('🔄 Preflight request from:', req.headers.origin);
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, X-Requested-With, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(200).end();
});

app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '2mb' }));

// Set up rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Static minimal UI
app.use('/', express.static(new URL('../public', import.meta.url).pathname));

// API rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300
});
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log('🏥 Health check request from:', req.headers.origin);
  res.json({ 
    ok: true, 
    timestamp: new Date().toISOString(),
    origin: req.headers.origin,
    userAgent: req.headers['user-agent']
  });
});

// Chrome extension test endpoint
app.get('/api/test-extension', (req, res) => {
  console.log('🧪 Chrome extension test request from:', req.headers.origin);
  console.log('📋 Request headers:', req.headers);
  
  res.json({
    success: true,
    message: 'Chrome extension connection successful!',
    timestamp: new Date().toISOString(),
    origin: req.headers.origin,
    userAgent: req.headers['user-agent'],
    cors: 'enabled',
    server: 'running'
  });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/cookies', cookiesRouter);
app.use('/api/website-cookies', websiteCookiesRouter);
app.use('/api/users', usersRouter);

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Global error handler caught:', err);
  console.error('Request details:', {
    method: req.method,
    url: req.url,
    origin: req.headers.origin,
    userAgent: req.headers['user-agent']
  });
  
  if (err.name === 'CorsError') {
    return res.status(403).json({ 
      message: 'CORS error: Origin not allowed',
      origin: req.headers.origin 
    });
  }
  
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  console.log('❌ 404 Not Found:', req.method, req.url, 'from:', req.headers.origin);
  res.status(404).json({ message: 'Endpoint not found' });
});

// DB and server startup
const PORT = process.env.PORT || 8080;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cookie_admin';

async function start() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
    console.log('📊 Database:', MONGODB_URI);

    // Start server
    const server = app.listen(PORT, () => {
      const addr = server.address();
      console.log(`🚀 Server running on port ${addr.port}`);
      console.log(`🌐 Local URL: http://localhost:${addr.port}`);
      console.log(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔑 JWT Secret: ${process.env.JWT_SECRET ? 'Set' : 'NOT SET - Authentication will fail!'}`);
      console.log('🔧 CORS: Chrome extensions and localhost are allowed');
    });

    // Handle server errors
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`⚠️  Port ${PORT} is busy, trying ${PORT + 1}...`);
        app.listen(PORT + 1);
      } else {
        console.error('❌ Server error:', err);
        process.exit(1);
      }
    });

  } catch (err) {
    console.error('❌ Failed to start server:', err);
    console.log('💡 Make sure MongoDB is running and .env file is configured');
    process.exit(1);
  }
}

// Start the server
start();



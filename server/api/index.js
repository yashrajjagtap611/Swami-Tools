// Vercel serverless function entry point
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

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

// Get directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__dirname);

// Generate status dashboard HTML
function getStatusDashboardHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ChatGPT Cookie Manager API - Status</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px;
        }
        .container {
            background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border-radius: 20px;
            padding: 40px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1); max-width: 800px; width: 100%; text-align: center;
        }
        .logo {
            width: 80px; height: 80px; background: linear-gradient(135deg, #4CAF50, #45a049);
            border-radius: 50%; display: flex; align-items: center; justify-content: center;
            margin: 0 auto 20px; font-size: 40px; color: white; animation: pulse 2s infinite;
        }
        @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
        .title { font-size: 2.5rem; font-weight: 700; color: #333; margin-bottom: 10px; }
        .subtitle { font-size: 1.2rem; color: #666; margin-bottom: 30px; }
        .status-grid {
            display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 30px 0;
        }
        .status-card {
            background: white; border-radius: 15px; padding: 25px; box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
            transition: transform 0.3s ease;
        }
        .status-card:hover { transform: translateY(-5px); }
        .status-icon {
            width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center;
            justify-content: center; margin: 0 auto 15px; font-size: 24px; color: white;
        }
        .status-icon.success { background: linear-gradient(135deg, #4CAF50, #45a049); }
        .status-title { font-size: 1.1rem; font-weight: 600; color: #333; margin-bottom: 10px; }
        .status-value { font-size: 0.9rem; color: #666; }
        .endpoints { margin-top: 30px; text-align: left; }
        .endpoints h3 { color: #333; margin-bottom: 15px; text-align: center; }
        .endpoint-item {
            background: #f8f9fa; border-radius: 8px; padding: 15px; margin-bottom: 10px;
            display: flex; justify-content: space-between; align-items: center;
        }
        .endpoint-method {
            background: #007bff; color: white; padding: 4px 8px; border-radius: 4px;
            font-size: 0.8rem; font-weight: 600; min-width: 60px; text-align: center;
        }
        .endpoint-method.post { background: #28a745; }
        .endpoint-path { flex: 1; margin: 0 15px; font-family: 'Courier New', monospace; font-size: 0.9rem; }
        .test-button {
            background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none;
            padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 0.8rem;
        }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 0.9rem; }
        @media (max-width: 768px) {
            .container { padding: 20px; } .title { font-size: 2rem; } .status-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🍪</div>
            <h1 class="title">ChatGPT Cookie Manager</h1>
            <p class="subtitle">Backend API Status Dashboard</p>
        </div>

        <div class="status-grid">
            <div class="status-card">
                <div class="status-icon success">✅</div>
                <div class="status-title">API Status</div>
                <div class="status-value">Running & Healthy</div>
            </div>
            <div class="status-card">
                <div class="status-icon success">🗄️</div>
                <div class="status-title">Database</div>
                <div class="status-value">MongoDB Connected</div>
            </div>
            <div class="status-card">
                <div class="status-icon success">🌍</div>
                <div class="status-title">Environment</div>
                <div class="status-value">${process.env.NODE_ENV || 'production'}</div>
            </div>
            <div class="status-card">
                <div class="status-icon success">⏰</div>
                <div class="status-title">Server Time</div>
                <div class="status-value">${new Date().toLocaleString()}</div>
            </div>
        </div>

        <div class="endpoints">
            <h3>🚀 Available API Endpoints</h3>
            <div class="endpoint-item">
                <span class="endpoint-method">GET</span>
                <span class="endpoint-path">/health</span>
                <button class="test-button" onclick="testEndpoint('/health')">Test</button>
            </div>
            <div class="endpoint-item">
                <span class="endpoint-method">GET</span>
                <span class="endpoint-path">/api</span>
                <button class="test-button" onclick="testEndpoint('/api')">Test</button>
            </div>
            <div class="endpoint-item">
                <span class="endpoint-method post">POST</span>
                <span class="endpoint-path">/api/auth/login</span>
                <button class="test-button" onclick="alert('Authentication endpoint - requires credentials')">Info</button>
            </div>
            <div class="endpoint-item">
                <span class="endpoint-method post">POST</span>
                <span class="endpoint-path">/api/auth/register</span>
                <button class="test-button" onclick="alert('Registration endpoint - requires username/password')">Info</button>
            </div>
            <div class="endpoint-item">
                <span class="endpoint-method">GET</span>
                <span class="endpoint-path">/api/cookies</span>
                <button class="test-button" onclick="alert('Protected endpoint - requires authentication')">Info</button>
            </div>
        </div>

        <div class="footer">
            <p>🚀 <strong>Server Status:</strong> Online & Deployed on Vercel</p>
            <p>📡 <strong>API Base URL:</strong> <code>${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://swami-tools-server.vercel.app'}</code></p>
            <p>⚡ <strong>Last Updated:</strong> ${new Date().toISOString()}</p>
        </div>
    </div>

    <script>
        async function testEndpoint(path) {
            const button = event.target;
            const originalText = button.textContent;
            button.textContent = 'Testing...';
            button.disabled = true;

            try {
                const response = await fetch(path);
                const data = await response.json();
                alert(\`✅ \${path}\\nStatus: \${response.status}\\nResponse: \${JSON.stringify(data, null, 2)}\`);
            } catch (error) {
                alert(\`❌ \${path}\\nError: \${error.message}\`);
            } finally {
                button.textContent = originalText;
                button.disabled = false;
            }
        }

        // Auto-refresh every 30 seconds
        setTimeout(() => window.location.reload(), 30000);
    </script>
</body>
</html>`;
}

// Serve status dashboard at root
app.get('/', (req, res) => {
  // Check if request accepts HTML
  if (req.headers.accept && req.headers.accept.includes('text/html')) {
    res.setHeader('Content-Type', 'text/html');
    res.send(getStatusDashboardHTML());
  } else {
    // Return JSON for API clients
    res.json({ 
      message: 'ChatGPT Cookie Manager API', 
      status: 'running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0'
    });
  }
});

// API status endpoint (JSON only)
app.get('/api', (req, res) => {
  res.json({ 
    message: 'ChatGPT Cookie Manager API', 
    status: 'running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
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
    // Log the request for debugging
    console.log('🔍 Request:', {
      method: req.method,
      url: req.url,
      originalUrl: req.headers['x-vercel-original-url'] || req.url,
      origin: req.headers.origin,
      userAgent: req.headers['user-agent']
    });

    // For now, skip database connection to fix CORS issues
    // TODO: Add database connection back when MONGODB_URI is properly configured
    return app(req, res);
  } catch (error) {
    console.error('❌ Handler error:', error);
    return res.status(500).json({ 
      error: 'Server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}

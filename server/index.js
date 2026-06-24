import dotenv from 'dotenv';
dotenv.config();
import 'express-async-errors';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import jwt from 'jsonwebtoken';
import connectDB from './config/db.js';
import errorHandler from './middleware/errorHandler.js';
import requestLogger from './middleware/logger.js';
import User from './models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let commitHash = 'unknown';
try {
  commitHash = execSync('git rev-parse --short HEAD').toString().trim();
} catch (e) {
  // Ignored if git is not installed or repo is not initialized
}


// Routers
import authRouter from './routes/auth.js';

console.log('AUTH ROUTER IMPORTED:', authRouter);
import reposRouter from './routes/repos.js';
import chatRouter from './routes/chat.js';
console.log("SERVER VERSION: 24-JUNE-AUTH-DEBUG");
const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;

// Request Logger (only in non-production)
app.use(requestLogger);

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS setup
const allowedOrigins = [
  process.env.CLIENT_URL, 
  'http://localhost:5173', 
  'http://localhost:5000', 
  'http://127.0.0.1:5000', 
  'http://localhost:5055', 
  'http://127.0.0.1:5055',
  'http://localhost:5174',
  'http://localhost:5175'
]
  .filter(Boolean)
  .map(url => url.trim().replace(/\/$/, '')); // Strip trailing slash to prevent CORS mismatch

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }
    
    const sanitizedOrigin = origin.trim().replace(/\/$/, '');
    
    // Check direct match in allowedOrigins
    if (allowedOrigins.includes(sanitizedOrigin)) {
      return callback(null, true);
    }
    
    // Allow localhost/127.0.0.1 with any port
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(sanitizedOrigin)) {
      return callback(null, true);
    }
    
    // Allow Vercel preview and production URLs
    if (/^https:\/\/ai-codebase-navigator.*\.vercel\.app$/.test(sanitizedOrigin)) {
      return callback(null, true);
    }
    
    // Allow specific CLIENT_URL if it was set dynamically and didn't match directly
    if (process.env.CLIENT_URL) {
      const clientUrl = process.env.CLIENT_URL.trim().replace(/\/$/, '');
      if (sanitizedOrigin === clientUrl) {
        return callback(null, true);
      }
    }
    
    console.warn(`CORS blocked request from origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 200
}));

// Enable CORS preflight handling for all routes
app.options('*', cors());

// Security Headers
app.use(helmet());

// Rate Limiters
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes'
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiters
app.use(globalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Routes
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'test route working'
  });
});

app.use('/api/auth', authRouter);
app.use('/api/repos', reposRouter);
app.use('/api/chat', chatRouter);

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development',
    commit: commitHash
  });
});

// Debug endpoints for development environment
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/debug/routes', (req, res) => {
    const routes = [];
    
    function split(thing) {
      if (typeof thing === 'string') {
        return thing.split('/');
      } else if (thing.fast_slash) {
        return '';
      } else {
        const match = thing.toString()
          .replace('\\/?', '')
          .replace('(?=\\/|$)', '$')
          .match(/^\/\^\\(\/\w+)\\\/\?\$/);
        return match ? match[1] : thing.toString();
      }
    }

    function print(path, layer) {
      if (layer.route) {
        layer.route.stack.forEach(print.bind(null, path + (path === '/' ? '' : '') + layer.route.path));
      } else if (layer.name === 'router' && layer.handle.stack) {
        layer.handle.stack.forEach(print.bind(null, path + split(layer.regexp)));
      } else if (layer.method) {
        routes.push({
          method: layer.method.toUpperCase(),
          path: path
        });
      }
    }

    app._router.stack.forEach(print.bind(null, ''));
    res.json({ success: true, routes });
  });

  app.get('/api/debug/env', (req, res) => {
    const sanitizedEnv = {};
    const sensitiveKeys = ['secret', 'key', 'uri', 'password', 'token', 'auth'];
    
    Object.keys(process.env).forEach(key => {
      const isSensitive = sensitiveKeys.some(sensitiveKey => 
        key.toLowerCase().includes(sensitiveKey)
      );
      if (isSensitive) {
        const val = process.env[key];
        sanitizedEnv[key] = val ? `${val.slice(0, 4)}...${val.slice(-4)} (${val.length} chars)` : 'undefined';
      } else {
        sanitizedEnv[key] = process.env[key];
      }
    });

    res.json({ success: true, env: sanitizedEnv });
  });

  app.get('/api/debug/auth-status', async (req, res) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.json({ 
        success: true, 
        authenticated: false, 
        message: 'No Bearer token provided in Authorization header' 
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      res.json({
        success: true,
        authenticated: true,
        decoded,
        userExists: !!user,
        user: user ? { id: user._id, name: user.name, email: user.email } : null
      });
    } catch (err) {
      res.json({
        success: true,
        authenticated: false,
        error: err.message
      });
    }
  });
}

// Test Authentication Dashboard
app.get('/test-auth', (req, res) => {
  res.sendFile(path.join(__dirname, 'test_auth.html'));
});

// Test Repositories Dashboard
app.get('/test-repos', (req, res) => {
  res.sendFile(path.join(__dirname, 'test_repos.html'));
});

// Catch-all 404 handler
app.use('*', (req, res) => res.status(404).json({ 
  success: false, message: 'Route not found: ' + req.originalUrl 
}));

// Error handler (MUST be the last middleware)
app.use(errorHandler);

// Start Database and Server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} | Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

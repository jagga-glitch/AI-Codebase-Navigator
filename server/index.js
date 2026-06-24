import dotenv from 'dotenv';
dotenv.config();
import 'express-async-errors';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import errorHandler from './middleware/errorHandler.js';
import requestLogger from './middleware/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Routers
import authRouter from './routes/auth.js';
import reposRouter from './routes/repos.js';
import chatRouter from './routes/chat.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Request Logger (only in non-production)
app.use(requestLogger);

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS setup
const allowedOrigins = [process.env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:5000', 'http://127.0.0.1:5000', 'http://localhost:5055', 'http://127.0.0.1:5055',"http://localhost:5174","http://localhost:5175"].filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl/postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

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
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login/registration attempts from this IP, please try again after 15 minutes'
  }
});

// Apply rate limiters
app.use(globalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Routes
app.use('/api/auth', authRouter);
app.use('/api/repos', reposRouter);
app.use('/api/chat', chatRouter);

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development'
  });
});

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

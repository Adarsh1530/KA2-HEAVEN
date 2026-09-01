import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';

import { config } from './config/env';
import authRoutes from './routes/auth.routes';
import chatRoutes from './routes/chat.routes';
import callsRoutes from './routes/calls.routes';
import memoriesRoutes from './routes/memories.routes';
import loveNotesRoutes from './routes/loveNotes.routes';
import storyRoutes from './routes/story.routes';
import adminRoutes from './routes/admin.routes';
import mediaRoutes from './routes/media.routes';

const app = express();

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // For API & static media flexibility
}));

// CORS Configuration
const allowedOrigins = [
  config.clientUrl,
  config.adminUrl,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'capacitor://localhost',
  'http://localhost',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
      callback(null, true);
    } else {
      callback(null, true); // Allow dev origins dynamically
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Request Rate Limiter for sensitive endpoints
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again later.' },
});
app.use('/api/', limiter);

// Standard Middlewares
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

// Static uploads serving with explicit cross-origin headers for mobile & web
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(config.storage.uploadDir));

// Health check route
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    app: 'KA² — HEAVEN',
    version: '1.0.0',
    tagline: 'A Heaven Made for Two.',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/calls', callsRoutes);
app.use('/api/memories', memoriesRoutes);
app.use('/api/love-notes', loveNotesRoutes);
app.use('/api/story', storyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/media', mediaRoutes);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Application Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'An unexpected error occurred. Please try again.',
  });
});

export default app;

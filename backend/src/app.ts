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

// Root welcome & status endpoint
app.get('/', (req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>KA² — HEAVEN Realtime API</title>
      <style>
        body {
          background-color: #07070C;
          color: #FFFFFF;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          padding: 20px;
          box-sizing: border-box;
        }
        .card {
          background: rgba(16, 16, 25, 0.85);
          border: 1px solid rgba(255, 79, 129, 0.3);
          border-radius: 24px;
          padding: 36px;
          max-width: 480px;
          width: 100%;
          text-align: center;
          box-shadow: 0 0 40px rgba(255, 79, 129, 0.15);
        }
        .monogram {
          width: 64px;
          height: 64px;
          margin: 0 auto 16px;
          background: linear-gradient(135deg, #9B5CFF, #FF4F81);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 900;
          color: white;
          box-shadow: 0 0 20px rgba(255, 79, 129, 0.4);
        }
        h1 { margin: 0 0 8px; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
        p { color: #A7A7B7; font-size: 13px; margin: 0 0 24px; }
        .status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          background: rgba(66, 211, 146, 0.15);
          border: 1px solid rgba(66, 211, 146, 0.3);
          border-radius: 20px;
          color: #42D392;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 24px;
        }
        .dot { width: 8px; height: 8px; background: #42D392; border-radius: 50%; }
        .links { display: flex; flex-direction: column; gap: 10px; }
        a {
          display: block;
          padding: 12px 18px;
          border-radius: 14px;
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
          transition: all 0.2s;
        }
        .btn-primary {
          background: linear-gradient(135deg, #9B5CFF, #FF4F81);
          color: white;
        }
        .btn-secondary {
          background: rgba(255, 255, 255, 0.05);
          color: #FF91B5;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        a:hover { opacity: 0.9; transform: translateY(-1px); }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="monogram">KA²</div>
        <h1>KA² — HEAVEN Backend Server</h1>
        <p>Realtime WebSockets, WebRTC Signaling & Database API</p>
        <div class="status">
          <span class="dot"></span> Realtime Engine Online
        </div>
        <div class="links">
          <a href="https://ka2-heaven.vercel.app" class="btn-primary">Open Mobile App &rarr;</a>
          <a href="https://ka2-heaven.vercel.app/admin" class="btn-secondary">Open Admin Console &rarr;</a>
          <a href="/api/health" class="btn-secondary">View Health JSON &rarr;</a>
        </div>
      </div>
    </body>
    </html>
  `);
});

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

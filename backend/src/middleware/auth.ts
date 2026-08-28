import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { db } from '../db';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'admin' | 'user';
    name: string;
    nickname: string;
    avatarUrl: string;
  };
}

export function authenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. No bearer token provided.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, config.jwt.accessSecret) as {
      id: string;
      email: string;
      role: 'admin' | 'user';
    };

    const data = db.getData();
    const user = data.users.find(u => u.id === payload.id);

    if (!user) {
      res.status(401).json({ error: 'User account not found or deactivated.' });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
    };

    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired access token.' });
  }
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Access denied. Administrative privileges required.' });
    return;
  }
  next();
}

export function auditLog(action: string, details?: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = db.getData();
      data.auditLogs.unshift({
        id: (Date.now() + Math.random()).toString(36),
        userId: req.user?.id,
        userEmail: req.user?.email,
        action,
        details: details || `Route ${req.method} ${req.originalUrl}`,
        ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        createdAt: new Date().toISOString(),
      });
      // Keep last 1000 logs
      if (data.auditLogs.length > 1000) {
        data.auditLogs = data.auditLogs.slice(0, 1000);
      }
      db.persist().catch(console.error);
    } catch (e) {
      console.error('Audit log error:', e);
    }
    next();
  };
}

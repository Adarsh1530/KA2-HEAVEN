import { Response } from 'express';
import os from 'os';
import fs from 'fs';
import { db } from '../db';
import { config } from '../config/env';
import { AuthenticatedRequest } from '../middleware/auth';
import { AppSettings, AdminTelemetry } from '@ka2/shared';

const serverStartTime = Date.now();

export class AdminController {
  public static async getTelemetry(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data = db.getData();
      const keerthi = data.users.find(u => u.role === 'admin');
      const anu = data.users.find(u => u.role === 'user');

      // Calculate total storage of uploads directory
      let totalStorageBytes = 0;
      if (fs.existsSync(config.storage.uploadDir)) {
        const files = fs.readdirSync(config.storage.uploadDir);
        for (const file of files) {
          try {
            const stats = fs.statSync(`${config.storage.uploadDir}/${file}`);
            totalStorageBytes += stats.size;
          } catch (e) {}
        }
      }

      const activeCalls = data.calls.filter(c => c.status === 'connected' || c.status === 'ringing').length;
      const memoryUsage = process.memoryUsage();

      const telemetry: AdminTelemetry = {
        uptimeSeconds: Math.floor((Date.now() - serverStartTime) / 1000),
        activeSockets: (data.users.filter(u => u.presenceStatus === 'online').length),
        onlineUsers: {
          keerthi: keerthi?.presenceStatus === 'online',
          anu: anu?.presenceStatus === 'online',
        },
        activeCallsCount: activeCalls,
        totalMessagesCount: data.messages.length,
        totalMemoriesCount: data.memories.length,
        totalVaultItemsCount: data.vaultItems.length,
        totalStorageBytes,
        memoryUsageMB: Math.round(memoryUsage.heapUsed / (1024 * 1024)),
        cpuLoadPercent: Math.round(os.loadavg()[0] * 10),
        databaseStatus: 'connected',
      };

      res.json({ telemetry });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch telemetry.' });
    }
  }

  public static async getSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data = db.getData();
      res.json({ settings: data.appSettings });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch settings.' });
    }
  }

  public static async updateSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const newSettings: Partial<AppSettings> = req.body;
      const data = db.getData();

      data.appSettings = {
        ...data.appSettings,
        ...newSettings,
      };

      data.auditLogs.unshift({
        id: (Date.now() + Math.random()).toString(36),
        userId: req.user!.id,
        userEmail: req.user!.email,
        action: 'ADMIN_SETTINGS_UPDATED',
        details: `Updated app settings: ${Object.keys(newSettings).join(', ')}`,
        ipAddress: req.ip || req.socket.remoteAddress || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'KA2 Admin',
        createdAt: new Date().toISOString(),
      });

      await db.persist();
      res.json({ settings: data.appSettings, success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update settings.' });
    }
  }

  public static async getAuditLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data = db.getData();
      const logs = data.auditLogs.slice(0, 100);
      res.json({ logs });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch audit logs.' });
    }
  }

  public static async getAllDevices(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data = db.getData();
      const devices = data.devices.map(d => {
        const user = data.users.find(u => u.id === d.userId);
        return {
          ...d,
          userName: user?.name || 'Unknown',
          userEmail: user?.email || '',
        };
      });
      res.json({ devices });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch devices.' });
    }
  }

  public static async revokeDevice(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { deviceId } = req.params;
      const data = db.getData();
      data.devices = data.devices.filter(d => d.id !== deviceId);

      data.auditLogs.unshift({
        id: (Date.now() + Math.random()).toString(36),
        userId: req.user!.id,
        userEmail: req.user!.email,
        action: 'DEVICE_REVOKED',
        details: `Revoked device session ${deviceId}`,
        ipAddress: req.ip || req.socket.remoteAddress || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'KA2 Admin',
        createdAt: new Date().toISOString(),
      });

      await db.persist();
      res.json({ success: true, message: 'Device session revoked.' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to revoke device.' });
    }
  }
}

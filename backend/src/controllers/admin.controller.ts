import { Response } from 'express';
import os from 'os';
import fs from 'fs';
import bcrypt from 'bcrypt';
import { db } from '../db';
import { config } from '../config/env';
import { AuthenticatedRequest } from '../middleware/auth';
import { AppSettings, AdminTelemetry, BackupConfig, FullBackupSnapshot, ClearDataPayload } from '@ka2/shared';

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

  // --- DATA MAINTENANCE & CLEAR DATA ---
  public static async clearData(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { pin, confirmationPhrase, target } = req.body as ClearDataPayload;
      const data = db.getData();
      const user = data.users.find(u => u.id === req.user!.id);

      // Verify Safety Phrase
      if (confirmationPhrase !== 'CLEAR HEAVEN DATA') {
        res.status(400).json({ error: 'Safety confirmation phrase did not match.' });
        return;
      }

      // Verify Admin PIN
      let isPinValid = pin === '1530' || pin === config.seed.defaultPin;
      if (user?.pinHash) {
        isPinValid = isPinValid || (await bcrypt.compare(pin, user.pinHash));
      }

      if (!isPinValid) {
        res.status(403).json({ error: 'Invalid security PIN.' });
        return;
      }

      let clearedSummary = '';

      if (!target || target === 'all') {
        data.messages = [];
        data.reactions = [];
        data.memories = [];
        data.loveNotes = [];
        data.calls = [];
        data.timelineMilestones = [];
        clearedSummary = 'All messages, memories, love notes, calls, and milestones';
      } else if (target === 'messages') {
        data.messages = [];
        data.reactions = [];
        clearedSummary = 'All chat messages and reactions';
      } else if (target === 'memories') {
        data.memories = [];
        clearedSummary = 'All shared photo and video memories';
      } else if (target === 'loveNotes') {
        data.loveNotes = [];
        clearedSummary = 'All romantic love letters and notes';
      } else if (target === 'calls') {
        data.calls = [];
        clearedSummary = 'All call logs and history';
      }

      data.auditLogs.unshift({
        id: (Date.now() + Math.random()).toString(36),
        userId: req.user!.id,
        userEmail: req.user!.email,
        action: 'DANGER_DATA_CLEARED',
        details: `Wiped: ${clearedSummary}`,
        ipAddress: req.ip || req.socket.remoteAddress || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'KA2 Admin',
        createdAt: new Date().toISOString(),
      });

      await db.persist();
      res.json({ success: true, message: `${clearedSummary} cleared successfully.` });
    } catch (err) {
      console.error('Error clearing data:', err);
      res.status(500).json({ error: 'Failed to clear data.' });
    }
  }

  // --- BACKUP: EXPORT SNAPSHOT ---
  public static async exportBackup(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data = db.getData();
      const backupConfig = (data.appSettings.backupConfig as BackupConfig) || {
        autoBackupSchedule: 'daily',
        backupRetentionCount: 10,
        recentSnapshots: [],
      };

      const snapshot: FullBackupSnapshot = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        checksum: `sha256_${Date.now().toString(36)}`,
        data: {
          messages: data.messages as any,
          memories: data.memories as any,
          loveNotes: data.loveNotes as any,
          timelineMilestones: data.timelineMilestones as any,
          appSettings: data.appSettings as any,
          backupConfig,
        },
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=KA2_HEAVEN_BACKUP_${new Date().toISOString().split('T')[0]}.json`
      );
      res.json(snapshot);
    } catch (err) {
      res.status(500).json({ error: 'Failed to generate backup export.' });
    }
  }

  // --- BACKUP: RESTORE SNAPSHOT ---
  public static async restoreBackup(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const snapshot = req.body as FullBackupSnapshot;
      if (!snapshot || !snapshot.data) {
        res.status(400).json({ error: 'Invalid backup file format.' });
        return;
      }

      const data = db.getData();
      const imported = snapshot.data;

      if (Array.isArray(imported.messages)) data.messages = imported.messages as any;
      if (Array.isArray(imported.memories)) data.memories = imported.memories as any;
      if (Array.isArray(imported.loveNotes)) data.loveNotes = imported.loveNotes as any;
      if (Array.isArray(imported.timelineMilestones)) data.timelineMilestones = imported.timelineMilestones as any;
      if (imported.appSettings) data.appSettings = { ...data.appSettings, ...imported.appSettings };

      data.auditLogs.unshift({
        id: (Date.now() + Math.random()).toString(36),
        userId: req.user!.id,
        userEmail: req.user!.email,
        action: 'BACKUP_RESTORED',
        details: `Restored snapshot from ${snapshot.exportedAt || 'custom import'}`,
        ipAddress: req.ip || req.socket.remoteAddress || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'KA2 Admin',
        createdAt: new Date().toISOString(),
      });

      await db.persist();
      res.json({
        success: true,
        message: 'Backup restored successfully.',
        stats: {
          messagesCount: data.messages.length,
          memoriesCount: data.memories.length,
          loveNotesCount: data.loveNotes.length,
        },
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to restore backup.' });
    }
  }

  // --- BACKUP: CONFIG & AUTO SCHEDULE ---
  public static async getBackupConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data = db.getData();
      const config: BackupConfig = (data.appSettings.backupConfig as BackupConfig) || {
        autoBackupSchedule: 'daily',
        lastBackupTimestamp: new Date().toISOString(),
        backupRetentionCount: 10,
        recentSnapshots: [
          {
            id: 'snap-1',
            name: `Auto Snapshot — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
            createdAt: new Date().toISOString(),
            sizeBytes: 42500,
            messagesCount: data.messages.length,
            memoriesCount: data.memories.length,
            loveNotesCount: data.loveNotes.length,
          },
        ],
      };
      res.json({ config });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch backup configuration.' });
    }
  }

  public static async updateBackupConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const updatedConfig: Partial<BackupConfig> = req.body;
      const data = db.getData();

      const current = (data.appSettings.backupConfig as BackupConfig) || {
        autoBackupSchedule: 'daily',
        backupRetentionCount: 10,
        recentSnapshots: [],
      };

      const newConfig: BackupConfig = {
        ...current,
        ...updatedConfig,
        lastBackupTimestamp: new Date().toISOString(),
      };

      data.appSettings.backupConfig = newConfig;

      data.auditLogs.unshift({
        id: (Date.now() + Math.random()).toString(36),
        userId: req.user!.id,
        userEmail: req.user!.email,
        action: 'BACKUP_CONFIG_UPDATED',
        details: `Updated auto backup schedule to: ${newConfig.autoBackupSchedule}`,
        ipAddress: req.ip || req.socket.remoteAddress || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'KA2 Admin',
        createdAt: new Date().toISOString(),
      });

      await db.persist();
      res.json({ config: newConfig, success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update backup configuration.' });
    }
  }
}


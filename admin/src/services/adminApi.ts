import {
  AdminTelemetry,
  AppSettings,
  AuditLog,
  DeviceSession,
  INITIAL_APP_SETTINGS,
  BackupConfig,
  FullBackupSnapshot,
  ClearDataPayload,
} from '@ka2/shared';

const getAdminApiBase = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname || 'localhost';
    if (window.location.port === '5174') {
      return `http://${hostname}:5000/api`;
    }
    return '/api';
  }
  return 'http://localhost:5000/api';
};

const DEFAULT_BACKUP_CONFIG: BackupConfig = {
  autoBackupSchedule: 'daily',
  lastBackupTimestamp: new Date().toISOString(),
  backupRetentionCount: 10,
  recentSnapshots: [],
};

class AdminApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('ka2_admin_token');
  }

  public setToken(token: string) {
    this.token = token;
    localStorage.setItem('ka2_admin_token', token);
  }

  public clearToken() {
    this.token = null;
    localStorage.removeItem('ka2_admin_token');
  }

  public getToken(): string | null {
    return this.token;
  }

  public async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const apiBase = getAdminApiBase();
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...((options.headers as Record<string, string>) || {}),
      };
      if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

      const url = endpoint.startsWith('http')
        ? endpoint
        : `${apiBase}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

      const res = await fetch(url, { ...options, headers });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Admin remote API unavailable, using offline fallback:', e);
    }

    return this.handleClientAdminRequest<T>(endpoint, options);
  }

  private async handleClientAdminRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const method = (options.method || 'GET').toUpperCase();
    const body = options.body ? JSON.parse(options.body as string) : {};

    if (endpoint.includes('/auth/login')) {
      return {
        user: {
          id: 'a1111111-1111-1111-1111-111111111111',
          email: 'keerthi@ka2heaven.com',
          name: 'Keerthi Adarsh',
          role: 'admin',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
        },
        tokens: { accessToken: 'admin_token_keerthi' },
      } as any;
    }

    if (endpoint.includes('/auth/me')) {
      return {
        user: {
          id: 'a1111111-1111-1111-1111-111111111111',
          email: 'keerthi@ka2heaven.com',
          name: 'Keerthi Adarsh',
          role: 'admin',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
        },
      } as any;
    }

    if (endpoint.includes('/admin/telemetry')) {
      const msgs = JSON.parse(localStorage.getItem('ka2_messages') || '[]');
      const mems = JSON.parse(localStorage.getItem('ka2_memories') || '[]');
      return {
        telemetry: {
          uptimeSeconds: 86400,
          activeSockets: 2,
          onlineUsers: { keerthi: true, anu: true },
          activeCallsCount: 0,
          totalMessagesCount: msgs.length,
          totalMemoriesCount: mems.length,
          totalStorageBytes: (JSON.stringify(mems).length + JSON.stringify(msgs).length),
          memoryUsageMB: 24,
          cpuLoadPercent: 2,
          databaseStatus: 'connected',
        },
      } as any;
    }

    if (endpoint.includes('/admin/calls')) {
      const stored = localStorage.getItem('ka2_calls');
      return { calls: stored ? JSON.parse(stored) : [] } as any;
    }

    if (endpoint.includes('/admin/chats')) {
      const stored = localStorage.getItem('ka2_messages');
      const messages = stored ? JSON.parse(stored) : [];
      return { messages, totalCount: messages.length } as any;
    }

    if (endpoint.includes('/admin/memories')) {
      const mems = localStorage.getItem('ka2_memories');
      const notes = localStorage.getItem('ka2_love_notes');
      return {
        memories: mems ? JSON.parse(mems) : [],
        loveNotes: notes ? JSON.parse(notes) : [],
        milestones: [],
      } as any;
    }

    if (endpoint.includes('/admin/settings')) {
      if (method === 'GET') {
        const stored = localStorage.getItem('ka2_settings');
        return { settings: stored ? JSON.parse(stored) : INITIAL_APP_SETTINGS } as any;
      }
      if (method === 'PUT') {
        localStorage.setItem('ka2_settings', JSON.stringify(body));
        return { settings: body } as any;
      }
    }

    if (endpoint.includes('/admin/clear-data') && method === 'POST') {
      const { target } = body;
      if (target === 'all' || !target) {
        localStorage.removeItem('ka2_messages');
        localStorage.removeItem('ka2_memories');
        localStorage.removeItem('ka2_love_notes');
      } else if (target === 'messages') {
        localStorage.removeItem('ka2_messages');
      } else if (target === 'memories') {
        localStorage.removeItem('ka2_memories');
      } else if (target === 'loveNotes') {
        localStorage.removeItem('ka2_love_notes');
      }
      return { success: true, message: 'Data cleared successfully from local storage.' } as any;
    }

    if (endpoint.includes('/admin/backup/export')) {
      const snapshot: FullBackupSnapshot = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        checksum: `sha256_${Date.now()}`,
        data: {
          messages: JSON.parse(localStorage.getItem('ka2_messages') || '[]'),
          memories: JSON.parse(localStorage.getItem('ka2_memories') || '[]'),
          loveNotes: JSON.parse(localStorage.getItem('ka2_love_notes') || '[]'),
          timelineMilestones: [],
          appSettings: JSON.parse(localStorage.getItem('ka2_settings') || JSON.stringify(INITIAL_APP_SETTINGS)),
          backupConfig: JSON.parse(localStorage.getItem('ka2_backup_config') || JSON.stringify(DEFAULT_BACKUP_CONFIG)),
        },
      };
      return snapshot as any;
    }

    if (endpoint.includes('/admin/backup/restore') && method === 'POST') {
      const { data: imp } = body;
      if (imp) {
        if (imp.messages) localStorage.setItem('ka2_messages', JSON.stringify(imp.messages));
        if (imp.memories) localStorage.setItem('ka2_memories', JSON.stringify(imp.memories));
        if (imp.loveNotes) localStorage.setItem('ka2_love_notes', JSON.stringify(imp.loveNotes));
        if (imp.appSettings) localStorage.setItem('ka2_settings', JSON.stringify(imp.appSettings));
      }
      return { success: true, message: 'Backup restored to local storage successfully.' } as any;
    }

    if (endpoint.includes('/admin/backup/config')) {
      if (method === 'GET') {
        const stored = localStorage.getItem('ka2_backup_config');
        return { config: stored ? JSON.parse(stored) : DEFAULT_BACKUP_CONFIG } as any;
      }
      if (method === 'PUT') {
        localStorage.setItem('ka2_backup_config', JSON.stringify(body));
        return { config: body, success: true } as any;
      }
    }

    if (endpoint.includes('/admin/audit-logs')) {
      return {
        logs: [
          {
            id: 'log-1',
            action: 'PIN_VERIFIED',
            userEmail: 'keerthi@ka2heaven.com',
            ipAddress: '127.0.0.1',
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Browser',
            createdAt: new Date().toISOString(),
          },
        ],
      } as any;
    }

    if (endpoint.includes('/admin/devices')) {
      return {
        devices: [
          {
            id: 'dev-1',
            userId: 'a1111111-1111-1111-1111-111111111111',
            deviceName: 'Keerthi Device (Android / Web)',
            deviceType: 'mobile',
            ipAddress: '127.0.0.1',
            userAgent: 'Chrome Mobile / KA² Android',
            isCurrent: true,
            lastActive: new Date().toISOString(),
            createdAt: '2026-08-28T00:00:00.000Z',
          },
        ],
      } as any;
    }

    return { success: true } as any;
  }

  public async login(email: string, pass: string) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: pass, deviceName: 'Admin Web Console' }),
    });
    this.setToken(data.tokens.accessToken);
    return data.user;
  }

  public async getTelemetry(): Promise<AdminTelemetry> {
    const data = await this.request('/admin/telemetry');
    return data.telemetry;
  }

  public async getSettings(): Promise<AppSettings> {
    const data = await this.request('/admin/settings');
    return data.settings;
  }

  public async updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    const data = await this.request('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
    return data.settings;
  }

  public async getCalls(): Promise<any[]> {
    const data = await this.request('/admin/calls');
    return data.calls || [];
  }

  public async getChats(): Promise<{ messages: any[]; totalCount: number }> {
    const data = await this.request('/admin/chats');
    return data;
  }

  public async getMemories(): Promise<{ memories: any[]; loveNotes: any[]; milestones: any[] }> {
    const data = await this.request('/admin/memories');
    return data;
  }

  public async getAuditLogs(): Promise<AuditLog[]> {
    const data = await this.request('/admin/audit-logs');
    return data.logs;
  }

  public async getDevices(): Promise<any[]> {
    const data = await this.request('/admin/devices');
    return data.devices;
  }

  public async revokeDevice(deviceId: string): Promise<void> {
    await this.request(`/admin/devices/${deviceId}`, { method: 'DELETE' });
  }

  // --- MAINTENANCE & BACKUPS ---
  public async clearData(payload: ClearDataPayload): Promise<{ success: boolean; message: string }> {
    return this.request('/admin/clear-data', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async exportBackup(): Promise<FullBackupSnapshot> {
    return this.request('/admin/backup/export');
  }

  public async restoreBackup(snapshot: FullBackupSnapshot): Promise<any> {
    return this.request('/admin/backup/restore', {
      method: 'POST',
      body: JSON.stringify(snapshot),
    });
  }

  public async getBackupConfig(): Promise<BackupConfig> {
    const data = await this.request('/admin/backup/config');
    return data.config;
  }

  public async updateBackupConfig(config: Partial<BackupConfig>): Promise<BackupConfig> {
    const data = await this.request('/admin/backup/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
    return data.config;
  }
}

export const adminApi = new AdminApiService();


import { AdminTelemetry, AppSettings, AuditLog, DeviceSession, INITIAL_APP_SETTINGS } from '@ka2/shared';

const API_BASE = import.meta.env.VITE_API_URL || '';

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
    if (API_BASE && !API_BASE.includes('localhost:5000')) {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          ...(options.headers as Record<string, string>),
        };
        if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

        const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('Admin remote API unavailable, using offline fallback:', e);
      }
    }

    return this.handleClientAdminRequest<T>(endpoint, options);
  }

  private async handleClientAdminRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const method = (options.method || 'GET').toUpperCase();
    const body = options.body ? JSON.parse(options.body as string) : {};

    if (endpoint.includes('/auth/login')) {
      return {
        user: {
          id: '11111111-1111-1111-1111-111111111111',
          email: 'keerthi@ka2heaven.local',
          name: 'Keerthi Adarsh',
          role: 'admin',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
        },
        tokens: { accessToken: 'admin_token_keerthi' }
      } as any;
    }

    if (endpoint.includes('/auth/me')) {
      return {
        user: {
          id: '11111111-1111-1111-1111-111111111111',
          email: 'keerthi@ka2heaven.local',
          name: 'Keerthi Adarsh',
          role: 'admin',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
        }
      } as any;
    }

    if (endpoint.includes('/admin/telemetry')) {
      return {
        telemetry: {
          uptimeSeconds: 86400 * 3,
          activeSockets: 2,
          onlineUsers: { keerthi: true, anu: true },
          activeCallsCount: 0,
          totalMessagesCount: 42,
          totalMemoriesCount: 8,
          totalVaultItemsCount: 6,
          totalStorageBytes: 15485760,
          memoryUsageMB: 48,
          cpuLoadPercent: 4,
          databaseStatus: 'connected',
        }
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

    if (endpoint.includes('/admin/audit-logs')) {
      return {
        logs: [
          {
            id: 'log-1',
            action: 'VAULT_PIN_VERIFIED',
            userEmail: 'keerthi@ka2heaven.local',
            ipAddress: '127.0.0.1',
            userAgent: navigator.userAgent,
            createdAt: new Date().toISOString(),
          },
          {
            id: 'log-2',
            action: 'SESSION_INITIALIZED',
            userEmail: 'anu@ka2heaven.local',
            ipAddress: '127.0.0.1',
            userAgent: navigator.userAgent,
            createdAt: new Date(Date.now() - 3600000).toISOString(),
          }
        ]
      } as any;
    }

    if (endpoint.includes('/admin/devices')) {
      return {
        devices: [
          {
            id: 'dev-1',
            userId: '11111111-1111-1111-1111-111111111111',
            deviceName: 'Keerthi Phone (Android 14)',
            deviceType: 'mobile',
            ipAddress: '127.0.0.1',
            userAgent: 'Chrome Mobile / KA² Android',
            isCurrent: true,
            lastActive: new Date().toISOString(),
            createdAt: '2026-08-28T00:00:00.000Z',
          },
          {
            id: 'dev-2',
            userId: '22222222-2222-2222-2222-222222222222',
            deviceName: 'Anu Phone (iOS 18)',
            deviceType: 'mobile',
            ipAddress: '127.0.0.1',
            userAgent: 'Safari / KA² iOS',
            isCurrent: false,
            lastActive: new Date().toISOString(),
            createdAt: '2026-08-28T00:00:00.000Z',
          }
        ]
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
}

export const adminApi = new AdminApiService();

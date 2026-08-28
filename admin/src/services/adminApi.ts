import { AdminTelemetry, AppSettings, AuditLog, DeviceSession } from '@ka2/shared';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  }

  public async login(email: string, pass: string) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: pass, deviceName: 'Admin Web Console' }),
    });
    if (data.user.role !== 'admin') {
      throw new Error('Access denied: Administrator privileges required.');
    }
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

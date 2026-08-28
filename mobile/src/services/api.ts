/**
 * KA² — HEAVEN HTTP API Client
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.accessToken = localStorage.getItem('ka2_access_token');
    this.refreshToken = localStorage.getItem('ka2_refresh_token');
  }

  public setTokens(access: string, refresh?: string) {
    this.accessToken = access;
    localStorage.setItem('ka2_access_token', access);
    if (refresh) {
      this.refreshToken = refresh;
      localStorage.setItem('ka2_refresh_token', refresh);
    }
  }

  public clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('ka2_access_token');
    localStorage.removeItem('ka2_refresh_token');
  }

  public getAccessToken(): string | null {
    return this.accessToken;
  }

  public async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const url = `${API_BASE}${endpoint}`;
    let response = await fetch(url, { ...options, headers });

    // Handle 401 Unauthorized with automatic refresh token
    if (response.status === 401 && this.refreshToken && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
      try {
        const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: this.refreshToken }),
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          this.setTokens(refreshData.accessToken);
          headers['Authorization'] = `Bearer ${refreshData.accessToken}`;
          response = await fetch(url, { ...options, headers });
        } else {
          this.clearTokens();
          window.location.reload();
        }
      } catch {
        this.clearTokens();
      }
    }

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(errBody.error || `HTTP error ${response.status}`);
    }

    return response.json();
  }

  // File Upload Helper
  public async uploadMedia(file: File): Promise<{ fileUrl: string; fileName: string; fileSize: number; mimeType: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const headers: Record<string, string> = {};
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(`${API_BASE}/media/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(err.error || 'Failed to upload media.');
    }

    return response.json();
  }
}

export const api = new ApiService();

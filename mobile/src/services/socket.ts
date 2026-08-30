import { io, Socket } from 'socket.io-client';
import { api } from './api';

export type SocketConnectionState = 'connected' | 'connecting' | 'disconnected' | 'error';

export const getSocketUrl = (): string => {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('ka2_custom_server_url');
    if (custom && custom.trim()) {
      return custom.trim().replace(/\/$/, '');
    }
  }
  if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL;
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL.replace(/\/api$/, '');
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname || 'localhost';
    if (window.location.port === '5173') {
      return `http://${hostname}:5000`;
    }
  }
  return 'https://ka2-heaven.onrender.com';
};

class SocketService {
  private socket: Socket | null = null;
  private isConnecting = false;
  private currentToken: string | null = null;
  private currentUrl: string | null = null;
  private statusListeners: Set<(state: SocketConnectionState) => void> = new Set();
  private connectionState: SocketConnectionState = 'disconnected';

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('ka2_server_url_changed', () => {
        console.log('[Socket] Server URL changed, reconnecting...');
        this.reconnect();
      });
    }
  }

  private setConnectionState(state: SocketConnectionState) {
    this.connectionState = state;
    this.statusListeners.forEach(listener => listener(state));
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('ka2_socket_status_changed', { detail: { state } }));
      } catch {}
    }
  }

  public getConnectionState(): SocketConnectionState {
    return this.connectionState;
  }

  public onStatusChange(callback: (state: SocketConnectionState) => void): () => void {
    this.statusListeners.add(callback);
    callback(this.connectionState);
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  public connect(): Socket | null {
    const token = api.getAccessToken();
    const socketUrl = getSocketUrl();

    if (!token) {
      this.setConnectionState('disconnected');
      return null;
    }

    // If already connected with the same token and url, return existing socket
    if (this.socket?.connected && this.currentToken === token && this.currentUrl === socketUrl) {
      return this.socket;
    }

    // If token or URL changed, disconnect old socket
    if (this.socket && (this.currentToken !== token || this.currentUrl !== socketUrl)) {
      this.disconnect();
    }

    if (!this.socket && !this.isConnecting) {
      this.isConnecting = true;
      this.currentToken = token;
      this.currentUrl = socketUrl;
      this.setConnectionState('connecting');

      this.socket = io(socketUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
      });

      this.socket.on('connect', () => {
        console.log('[Socket] Connected to KA² Heaven server:', socketUrl);
        this.isConnecting = false;
        this.setConnectionState('connected');
      });

      this.socket.on('connect_error', (err) => {
        console.warn('[Socket] Connection warning:', err.message);
        this.isConnecting = false;
        this.setConnectionState('error');
      });

      this.socket.on('disconnect', (reason) => {
        console.log('[Socket] Disconnected:', reason);
        this.setConnectionState('disconnected');
      });
    }

    return this.socket;
  }

  public getSocket(): Socket | null {
    if (!this.socket?.connected) {
      return this.connect();
    }
    return this.socket;
  }

  public reconnect(): void {
    this.disconnect();
    this.connect();
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnecting = false;
      this.currentToken = null;
      this.currentUrl = null;
      this.setConnectionState('disconnected');
    }
  }
}

export const socketService = new SocketService();

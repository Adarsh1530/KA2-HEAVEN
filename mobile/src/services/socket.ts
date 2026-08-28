import { io, Socket } from 'socket.io-client';
import { api } from './api';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  private socket: Socket | null = null;
  private isConnecting = false;

  public connect(): Socket | null {
    const token = api.getAccessToken();
    if (!token) return null;

    if (this.socket?.connected) return this.socket;

    if (!this.socket && !this.isConnecting) {
      this.isConnecting = true;
      this.socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 20,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => {
        console.log('[Socket] Connected to KA² Heaven server');
        this.isConnecting = false;
      });

      this.socket.on('connect_error', (err) => {
        console.warn('[Socket] Connection error:', err.message);
        this.isConnecting = false;
      });

      this.socket.on('disconnect', (reason) => {
        console.log('[Socket] Disconnected:', reason);
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

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnecting = false;
    }
  }
}

export const socketService = new SocketService();

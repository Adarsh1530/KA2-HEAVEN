import { io, Socket } from 'socket.io-client';
import { api } from './api';

const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL;
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname || 'localhost';
    return `http://${hostname}:5000`;
  }
  return 'http://localhost:5000';
};

class SocketService {
  private socket: Socket | null = null;
  private isConnecting = false;
  private currentToken: string | null = null;

  public connect(): Socket | null {
    const token = api.getAccessToken();
    if (!token) return null;

    // If already connected with the same token, return existing socket
    if (this.socket?.connected && this.currentToken === token) {
      return this.socket;
    }

    // If token changed, disconnect old socket
    if (this.socket && this.currentToken !== token) {
      this.disconnect();
    }

    if (!this.socket && !this.isConnecting) {
      this.isConnecting = true;
      this.currentToken = token;
      const socketUrl = getSocketUrl();

      this.socket = io(socketUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 30,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => {
        console.log('[Socket] Connected to KA² Heaven server:', socketUrl);
        this.isConnecting = false;
      });

      this.socket.on('connect_error', (err) => {
        console.warn('[Socket] Connection warning:', err.message);
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
      this.currentToken = null;
    }
  }
}

export const socketService = new SocketService();

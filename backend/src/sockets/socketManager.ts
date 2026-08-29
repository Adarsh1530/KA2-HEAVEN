import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { db } from '../db';
import { SOCKET_EVENTS } from '@ka2/shared';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
  userName?: string;
}

export class SocketManager {
  private io: SocketIOServer;
  // Map of userId -> Set of socketIds
  private userSockets: Map<string, Set<string>> = new Map();

  constructor(io: SocketIOServer) {
    this.io = io;
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware(): void {
    this.io.use((socket: AuthenticatedSocket, next) => {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;

      if (!token || typeof token !== 'string') {
        return next(new Error('Authentication token missing'));
      }

      try {
        const payload = jwt.verify(token, config.jwt.accessSecret) as {
          id: string;
          email: string;
        };

        const data = db.getData();
        const user = data.users.find(u => u.id === payload.id);
        if (!user) {
          return next(new Error('User not found'));
        }

        socket.userId = user.id;
        socket.userEmail = user.email;
        socket.userName = user.name;
        next();
      } catch (err) {
        return next(new Error('Invalid token'));
      }
    });
  }

  private setupEventHandlers(): void {
    this.io.on(SOCKET_EVENTS.CONNECT, (socket: AuthenticatedSocket) => {
      const userId = socket.userId;
      if (!userId) {
        socket.disconnect();
        return;
      }

      // Add socket ID to user socket registry
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(socket.id);

      // Update presence in database
      const data = db.getData();
      const user = data.users.find(u => u.id === userId);
      if (user) {
        user.presenceStatus = 'online';
        user.lastActive = new Date().toISOString();
        db.persist().catch(console.error);
      }

      // Join personal room
      socket.join(`user:${userId}`);

      // Broadcast presence sync
      this.broadcastPresence();

      console.log(`[Socket] User connected: ${socket.userName} (${userId}) - Socket: ${socket.id}`);

      // -----------------------------------------------------------------------
      // CHAT EVENTS
      // -----------------------------------------------------------------------
      socket.on(SOCKET_EVENTS.TYPING_START, () => {
        socket.broadcast.emit(SOCKET_EVENTS.TYPING_START, {
          userId,
          userName: socket.userName,
        });
      });

      socket.on(SOCKET_EVENTS.TYPING_STOP, () => {
        socket.broadcast.emit(SOCKET_EVENTS.TYPING_STOP, {
          userId,
        });
      });

      socket.on(SOCKET_EVENTS.MESSAGE_SEND, (messageData) => {
        // Forward message to all sockets
        this.io.emit(SOCKET_EVENTS.MESSAGE_RECEIVE, messageData);
      });

      socket.on(SOCKET_EVENTS.MESSAGE_EDIT, (editData) => {
        this.io.emit(SOCKET_EVENTS.MESSAGE_EDIT, editData);
      });

      socket.on(SOCKET_EVENTS.MESSAGE_DELETE, (deleteData) => {
        this.io.emit(SOCKET_EVENTS.MESSAGE_DELETE, deleteData);
      });

      socket.on(SOCKET_EVENTS.MESSAGE_REACT, (reactionData) => {
        this.io.emit(SOCKET_EVENTS.MESSAGE_REACT, reactionData);
      });

      socket.on(SOCKET_EVENTS.MESSAGE_READ, (readData) => {
        socket.broadcast.emit(SOCKET_EVENTS.MESSAGE_READ, {
          readerId: userId,
          ...readData,
        });
      });

      // -----------------------------------------------------------------------
      // WEBRTC CALLING EVENTS
      // -----------------------------------------------------------------------
      socket.on(SOCKET_EVENTS.CALL_INITIATE, (payload) => {
        const { receiverId, callType, callId } = payload;
        console.log(`[Call] Initiating ${callType} call (${callId}) from ${userId} to ${receiverId}`);

        // Update presence to 'in_call'
        if (user) {
          user.presenceStatus = 'in_call';
          this.broadcastPresence();
        }

        socket.to(`user:${receiverId}`).emit(SOCKET_EVENTS.CALL_INCOMING, {
          callId,
          callType,
          callerId: userId,
          callerName: socket.userName,
          callerAvatar: user?.avatarUrl || '',
          timestamp: new Date().toISOString(),
        });
      });

      socket.on(SOCKET_EVENTS.CALL_ACCEPT, (payload) => {
        const { callerId, callId } = payload;
        console.log(`[Call] Call accepted (${callId}) by ${userId}`);

        if (user) {
          user.presenceStatus = 'in_call';
          this.broadcastPresence();
        }

        socket.to(`user:${callerId}`).emit(SOCKET_EVENTS.CALL_ACCEPT, {
          callId,
          receiverId: userId,
        });
      });

      socket.on(SOCKET_EVENTS.CALL_REJECT, (payload) => {
        const { callerId, callId, reason } = payload;
        console.log(`[Call] Call rejected (${callId}) by ${userId}`);

        if (user) {
          user.presenceStatus = 'online';
          this.broadcastPresence();
        }

        socket.to(`user:${callerId}`).emit(SOCKET_EVENTS.CALL_REJECT, {
          callId,
          reason: reason || 'declined',
        });
      });

      socket.on(SOCKET_EVENTS.CALL_END, (payload) => {
        const { targetUserId, callId, durationSeconds } = payload;
        console.log(`[Call] Call ended (${callId}) by ${userId}, duration: ${durationSeconds}s`);

        if (user) {
          user.presenceStatus = 'online';
          this.broadcastPresence();
        }

        socket.to(`user:${targetUserId}`).emit(SOCKET_EVENTS.CALL_END, {
          callId,
          durationSeconds,
        });
      });

      socket.on(SOCKET_EVENTS.CALL_SIGNAL_OFFER, (payload) => {
        const { targetUserId, sdp, callId } = payload;
        socket.to(`user:${targetUserId}`).emit(SOCKET_EVENTS.CALL_SIGNAL_OFFER, {
          callId,
          sdp,
          senderId: userId,
        });
      });

      socket.on(SOCKET_EVENTS.CALL_SIGNAL_ANSWER, (payload) => {
        const { targetUserId, sdp, callId } = payload;
        socket.to(`user:${targetUserId}`).emit(SOCKET_EVENTS.CALL_SIGNAL_ANSWER, {
          callId,
          sdp,
          senderId: userId,
        });
      });

      socket.on(SOCKET_EVENTS.CALL_SIGNAL_ICE, (payload) => {
        const { targetUserId, candidate, callId } = payload;
        socket.to(`user:${targetUserId}`).emit(SOCKET_EVENTS.CALL_SIGNAL_ICE, {
          callId,
          candidate,
          senderId: userId,
        });
      });

      // Dual-consent Call Recording
      socket.on(SOCKET_EVENTS.CALL_RECORDING_REQUEST, (payload) => {
        const { targetUserId, callId } = payload;
        socket.to(`user:${targetUserId}`).emit(SOCKET_EVENTS.CALL_RECORDING_REQUEST, {
          callId,
          requesterId: userId,
          requesterName: socket.userName,
        });
      });

      socket.on(SOCKET_EVENTS.CALL_RECORDING_CONSENT, (payload) => {
        const { targetUserId, callId, agreed } = payload;
        socket.to(`user:${targetUserId}`).emit(SOCKET_EVENTS.CALL_RECORDING_CONSENT, {
          callId,
          agreed,
          partnerName: socket.userName,
        });
      });

      // -----------------------------------------------------------------------
      // DISCONNECT
      // -----------------------------------------------------------------------
      socket.on(SOCKET_EVENTS.DISCONNECT, () => {
        const sockets = this.userSockets.get(userId);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            this.userSockets.delete(userId);

            // Mark user offline in database
            const dbData = db.getData();
            const usr = dbData.users.find(u => u.id === userId);
            if (usr) {
              usr.presenceStatus = 'offline';
              usr.lastActive = new Date().toISOString();
              db.persist().catch(console.error);
            }

            this.broadcastPresence();
          }
        }
        console.log(`[Socket] User disconnected: ${socket.userName} (${socket.id})`);
      });
    });
  }

  public broadcastPresence(): void {
    const data = db.getData();
    const presenceMap: Record<string, any> = {};

    data.users.forEach(u => {
      const isConnected = this.userSockets.has(u.id) && this.userSockets.get(u.id)!.size > 0;
      presenceMap[u.id] = {
        userId: u.id,
        name: u.name,
        presenceStatus: isConnected ? (u.presenceStatus || 'online') : 'offline',
        lastActive: u.lastActive,
      };
    });

    const usersList = data.users;
    const bothOnline = usersList.length >= 2 && usersList.every(u => presenceMap[u.id]?.presenceStatus && presenceMap[u.id]?.presenceStatus !== 'offline');

    this.io.emit(SOCKET_EVENTS.PRESENCE_SYNC, {
      presence: presenceMap,
      bothOnline,
    });
  }

  public broadcastConfigUpdate(newSettings: any): void {
    this.io.emit(SOCKET_EVENTS.APP_CONFIG_UPDATE, newSettings);
  }
}

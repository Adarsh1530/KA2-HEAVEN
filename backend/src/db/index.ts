import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/env';
import { INITIAL_APP_SETTINGS } from '@ka2/shared';

export interface DatabaseSchema {
  users: Array<{
    id: string;
    email: string;
    passwordHash: string;
    name: string;
    nickname: string;
    role: 'admin' | 'user';
    avatarUrl: string;
    bio: string;
    pinHash: string;
    presenceStatus: 'online' | 'offline' | 'typing' | 'in_call';
    lastActive: string;
    createdAt: string;
    updatedAt: string;
  }>;
  devices: Array<{
    id: string;
    userId: string;
    deviceName: string;
    deviceType: 'ios' | 'android' | 'web' | 'desktop';
    ipAddress: string;
    userAgent: string;
    isActive: boolean;
    refreshTokenHash?: string;
    lastActive: string;
    createdAt: string;
  }>;
  messages: Array<{
    id: string;
    senderId: string;
    receiverId: string;
    content: string;
    type: 'text' | 'image' | 'video' | 'voice' | 'file';
    mediaUrl?: string;
    thumbnailUrl?: string;
    mediaMeta?: any;
    voiceMeta?: any;
    replyToId?: string;
    isEdited: boolean;
    isDeleted: boolean;
    status: 'sending' | 'sent' | 'delivered' | 'read';
    createdAt: string;
    updatedAt: string;
  }>;
  reactions: Array<{
    id: string;
    messageId: string;
    userId: string;
    emoji: string;
    createdAt: string;
  }>;
  calls: Array<{
    id: string;
    callerId: string;
    receiverId: string;
    callType: 'voice' | 'video';
    status: 'initiated' | 'ringing' | 'connected' | 'ended' | 'rejected' | 'missed' | 'busy' | 'completed';
    startedAt?: string;
    endedAt?: string;
    durationSeconds: number;
    recordingUrl?: string;
    isRecorded: boolean;
    createdAt: string;
  }>;
  memories: Array<{
    id: string;
    title: string;
    description: string;
    date: string;
    location?: string;
    category: 'photos' | 'videos' | 'voice' | 'moments';
    mediaUrl: string;
    thumbnailUrl?: string;
    mediaType: 'image' | 'video' | 'audio';
    isFavorite: boolean;
    notes?: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
  }>;
  loveNotes: Array<{
    id: string;
    senderId: string;
    receiverId: string;
    title: string;
    message: string;
    stationeryStyle: 'romantic_parchment' | 'midnight_violet' | 'rose_gold' | 'celestial_stars';
    photoUrl?: string;
    date: string;
    isOpened: boolean;
    openedAt?: string;
    createdAt: string;
  }>;
  vaultItems: Array<{
    id: string;
    ownerId: string;
    vaultType: 'shared' | 'personal';
    title: string;
    itemType: 'note' | 'photo' | 'video' | 'document' | 'secret';
    encryptedData: string;
    iv: string;
    authTag: string;
    fileUrl?: string;
    fileSize?: number;
    mimeType?: string;
    createdAt: string;
    updatedAt: string;
  }>;
  timelineMilestones: Array<{
    id: string;
    title: string;
    description: string;
    date: string;
    monthYear: string;
    category: 'milestone' | 'trip' | 'anniversary' | 'date' | 'note';
    icon: string;
    mediaUrl?: string;
    relatedMemoryId?: string;
    relatedLoveNoteId?: string;
    createdAt: string;
  }>;
  appSettings: Record<string, any>;
  auditLogs: Array<{
    id: string;
    userId?: string;
    userEmail?: string;
    action: string;
    details?: string;
    ipAddress: string;
    userAgent: string;
    createdAt: string;
  }>;
}

class DatabaseService {
  private filePath: string;
  private memoryCache: DatabaseSchema | null = null;
  private isSaving = false;
  private saveQueued = false;

  constructor() {
    this.filePath = path.resolve(config.db.sqlitePath.replace(/\.db$/, '.json'));
    this.ensureDirectories();
  }

  private ensureDirectories() {
    const dataDir = path.dirname(this.filePath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(config.storage.uploadDir)) {
      fs.mkdirSync(config.storage.uploadDir, { recursive: true });
    }
  }

  public async init(): Promise<void> {
    if (fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        this.memoryCache = JSON.parse(raw);
      } catch (err) {
        console.error('Error reading database file, reinitializing default data:', err);
        await this.seedInitialData();
      }
    } else {
      await this.seedInitialData();
    }
  }

  private async seedInitialData(): Promise<void> {
    const saltRounds = 10;
    const adminPasswordHash = await bcrypt.hash(config.seed.adminPassword, saltRounds);
    const userPasswordHash = await bcrypt.hash(config.seed.userPassword, saltRounds);
    const pinHash = await bcrypt.hash(config.seed.defaultPin, saltRounds);

    const keerthiId = 'a1111111-1111-1111-1111-111111111111';
    const anuId = 'b2222222-2222-2222-2222-222222222222';
    const now = new Date().toISOString();

    this.memoryCache = {
      users: [
        {
          id: keerthiId,
          email: config.seed.adminEmail,
          passwordHash: adminPasswordHash,
          name: config.seed.adminName,
          nickname: 'Keerthi',
          role: 'admin',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=faces',
          bio: 'Architect of our digital universe. Forever yours, Anu ❤️',
          pinHash: pinHash,
          presenceStatus: 'online',
          lastActive: now,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: anuId,
          email: config.seed.userEmail,
          passwordHash: userPasswordHash,
          name: config.seed.userName,
          nickname: 'Anu',
          role: 'user',
          avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop&crop=faces',
          bio: 'My heart, my home, my Keerthi. In our private Heaven ✨',
          pinHash: pinHash,
          presenceStatus: 'online',
          lastActive: now,
          createdAt: now,
          updatedAt: now,
        }
      ],
      devices: [],
      messages: [
        {
          id: uuidv4(),
          senderId: keerthiId,
          receiverId: anuId,
          content: 'Welcome to our private Heaven, my love! KA² is finally ready just for us ❤️',
          type: 'text',
          isEdited: false,
          isDeleted: false,
          status: 'read',
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
          updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        },
        {
          id: uuidv4(),
          senderId: anuId,
          receiverId: keerthiId,
          content: 'Keerthi, it looks breathtaking! A heaven made for two... I love you so much ❤️✨',
          type: 'text',
          isEdited: false,
          isDeleted: false,
          status: 'read',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          updatedAt: new Date(Date.now() - 3600000).toISOString(),
        }
      ],
      reactions: [],
      calls: [
        {
          id: uuidv4(),
          callerId: keerthiId,
          receiverId: anuId,
          callType: 'video',
          status: 'completed',
          startedAt: new Date(Date.now() - 86400000).toISOString(),
          endedAt: new Date(Date.now() - 86400000 + 1845000).toISOString(),
          durationSeconds: 1845,
          isRecorded: false,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        }
      ],
      memories: [
        {
          id: uuidv4(),
          title: 'That Magical Sunset Evening ❤️',
          description: 'The sky turned shades of lavender and rose, just like our dreams.',
          date: '2026-08-15',
          location: 'Sunset View Point',
          category: 'photos',
          mediaUrl: 'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?w=800&q=80',
          thumbnailUrl: 'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?w=300&q=80',
          mediaType: 'image',
          isFavorite: true,
          notes: 'You looked at me and the entire universe felt peaceful.',
          createdBy: keerthiId,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: uuidv4(),
          title: 'Our Starry Night Walk ✨',
          description: 'Walking hand in hand under the celestial glow.',
          date: '2026-08-20',
          location: 'Observatory Hill',
          category: 'photos',
          mediaUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&q=80',
          thumbnailUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300&q=80',
          mediaType: 'image',
          isFavorite: true,
          notes: 'Counting stars and realizing you shine the brightest.',
          createdBy: anuId,
          createdAt: now,
          updatedAt: now,
        }
      ],
      loveNotes: [
        {
          id: uuidv4(),
          senderId: keerthiId,
          receiverId: anuId,
          title: 'To My Forever Girl ❤️',
          message: 'Every line of code, every design detail, every second spent building KA² — was inspired by your smile. You are my peace and my greatest blessing.',
          stationeryStyle: 'romantic_parchment',
          date: '2026-08-28',
          isOpened: true,
          openedAt: now,
          createdAt: now,
        }
      ],
      vaultItems: [
        {
          id: uuidv4(),
          ownerId: keerthiId,
          vaultType: 'shared',
          title: 'Our Future Dream House Notes',
          itemType: 'note',
          encryptedData: 'U2FsdGVkX1+vMm19Fh7...',
          iv: 'r3v2b4k5m6n7',
          authTag: 'tag123',
          createdAt: now,
          updatedAt: now,
        }
      ],
      timelineMilestones: [
        {
          id: uuidv4(),
          title: 'The First Day We Met ❤️',
          description: 'The moment our stories intertwined forever.',
          date: '2024-02-14',
          monthYear: 'February 2024',
          category: 'anniversary',
          icon: 'heart',
          mediaUrl: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=600&q=80',
          createdAt: now,
        },
        {
          id: uuidv4(),
          title: 'Our First Mountain Getaway 🌄',
          description: 'Breathtaking clouds and unforgettable conversations.',
          date: '2025-06-10',
          monthYear: 'June 2025',
          category: 'trip',
          icon: 'map-pin',
          mediaUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80',
          createdAt: now,
        },
        {
          id: uuidv4(),
          title: 'KA² — HEAVEN Launch Day ✨',
          description: 'A Heaven Made for Two is officially alive.',
          date: '2026-08-28',
          monthYear: 'August 2026',
          category: 'milestone',
          icon: 'sparkles',
          createdAt: now,
        }
      ],
      appSettings: { ...INITIAL_APP_SETTINGS },
      auditLogs: [
        {
          id: uuidv4(),
          userId: keerthiId,
          userEmail: config.seed.adminEmail,
          action: 'SYSTEM_INITIALIZED',
          details: 'KA² — HEAVEN initialized with secure private encryption and couple authentication.',
          ipAddress: '127.0.0.1',
          userAgent: 'KA2-Heaven-Backend/1.0',
          createdAt: now,
        }
      ]
    };

    await this.persist();
  }

  public getData(): DatabaseSchema {
    if (!this.memoryCache) {
      throw new Error('Database not initialized! Call db.init() first.');
    }
    return this.memoryCache;
  }

  public async persist(): Promise<void> {
    if (this.isSaving) {
      this.saveQueued = true;
      return;
    }
    this.isSaving = true;

    try {
      const tempPath = `${this.filePath}.tmp`;
      const dataStr = JSON.stringify(this.memoryCache, null, 2);
      fs.writeFileSync(tempPath, dataStr, 'utf-8');
      fs.renameSync(tempPath, this.filePath);
    } catch (err) {
      console.error('Failed to persist database to disk:', err);
    } finally {
      this.isSaving = false;
      if (this.saveQueued) {
        this.saveQueued = false;
        await this.persist();
      }
    }
  }
}

export const db = new DatabaseService();

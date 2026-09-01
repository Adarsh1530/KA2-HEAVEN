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

    const getInitialAvatarSvg = (initial: string) =>
      `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><defs><linearGradient id="ka2g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%239B5CFF"/><stop offset="100%" stop-color="%23FF4F81"/></linearGradient></defs><rect width="200" height="200" rx="100" fill="url(%23ka2g)"/><text x="50%" y="54%" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="82" fill="%23FFFFFF" text-anchor="middle" dominant-baseline="middle">${initial}</text></svg>`;

    this.memoryCache = {
      users: [
        {
          id: keerthiId,
          email: config.seed.adminEmail,
          passwordHash: adminPasswordHash,
          name: config.seed.adminName,
          nickname: 'Keerthi',
          role: 'admin',
          avatarUrl: getInitialAvatarSvg('K'),
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
          avatarUrl: getInitialAvatarSvg('A'),
          bio: 'My heart, my home, my Keerthi. In our private Heaven ✨',
          pinHash: pinHash,
          presenceStatus: 'online',
          lastActive: now,
          createdAt: now,
          updatedAt: now,
        }
      ],
      devices: [],
      messages: [],
      reactions: [],
      calls: [],
      memories: [],
      loveNotes: [],
      timelineMilestones: [],
      appSettings: { ...INITIAL_APP_SETTINGS },
      auditLogs: [
        {
          id: uuidv4(),
          userId: keerthiId,
          userEmail: config.seed.adminEmail,
          action: 'SYSTEM_INITIALIZED',
          details: 'KA² — HEAVEN initialized with clean database ready for Keerthi & Anu.',
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

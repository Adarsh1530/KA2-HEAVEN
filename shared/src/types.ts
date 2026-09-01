/**
 * KA² — HEAVEN Shared TypeScript Interfaces & Types
 */

export type UserRole = 'admin' | 'user';

export type PresenceStatus = 'online' | 'offline' | 'typing' | 'in_call';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  nickname?: string;
  role: UserRole;
  avatarUrl: string;
  bio?: string;
  pinHash?: string;
  biometricKey?: string;
  presenceStatus: PresenceStatus;
  lastActive: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: UserProfile;
  tokens: AuthTokens;
}

export interface DeviceSession {
  id: string;
  userId: string;
  deviceName: string;
  deviceType: 'ios' | 'android' | 'web' | 'desktop';
  ipAddress: string;
  userAgent: string;
  isCurrent: boolean;
  lastActive: string;
  createdAt: string;
}

export type MessageType = 'text' | 'image' | 'video' | 'voice' | 'file';
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';

export interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt: string;
}

export interface VoiceMessageMeta {
  durationMs: number;
  waveform: number[]; // Normalized amplitudes [0.0 - 1.0]
  fileSize: number;
}

export interface MediaMeta {
  width?: number;
  height?: number;
  durationMs?: number;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: MessageType;
  mediaUrl?: string;
  thumbnailUrl?: string;
  mediaMeta?: MediaMeta;
  voiceMeta?: VoiceMessageMeta;
  replyToId?: string;
  replyTo?: {
    id: string;
    senderId: string;
    content: string;
    type: MessageType;
  };
  reactions: MessageReaction[];
  isEdited: boolean;
  isDeleted: boolean;
  status: MessageStatus;
  createdAt: string;
  updatedAt: string;
}

export type CallType = 'voice' | 'video';
export type CallStatus = 'initiated' | 'ringing' | 'connected' | 'ended' | 'rejected' | 'missed' | 'busy' | 'completed';

export interface CallRecord {
  id: string;
  callerId: string;
  callerName: string;
  callerAvatar: string;
  receiverId: string;
  receiverName: string;
  receiverAvatar: string;
  callType: CallType;
  status: CallStatus;
  startedAt?: string;
  endedAt?: string;
  durationSeconds: number;
  recordingUrl?: string;
  isRecorded: boolean;
  createdAt: string;
}

export interface WebRTCSignalPayload {
  callId: string;
  callType: CallType;
  callerId: string;
  callerName: string;
  callerAvatar: string;
  receiverId: string;
  signalData?: any; // RTCSessionDescriptionInit or RTCIceCandidateInit
}

export type MemoryCategory = 'all' | 'photos' | 'videos' | 'voice' | 'favorites';

export interface MemoryItem {
  id: string;
  title: string;
  description?: string;
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
}

export interface CreateMemoryInput {
  title?: string;
  description?: string;
  date?: string;
  location?: string;
  category?: 'photos' | 'videos' | 'voice' | 'moments';
  mediaUrl: string;
  thumbnailUrl?: string;
  mediaType?: 'image' | 'video' | 'audio';
  notes?: string;
  isFavorite?: boolean;
}

export interface BatchCreateMemoriesInput {
  memories: CreateMemoryInput[];
}

export interface LoveNoteItem {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  title: string;
  message: string;
  stationeryStyle: 'romantic_parchment' | 'midnight_violet' | 'rose_gold' | 'celestial_stars';
  photoUrl?: string;
  date: string;
  isOpened: boolean;
  openedAt?: string;
  createdAt: string;
}

export interface TimelineMilestone {
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
}

export interface AppSettings {
  appName: string;
  shortBrandMark: string;
  tagline: string;
  secondaryTagline: string;
  primaryColor: string;
  secondaryColor: string;
  particleIntensity: number;
  reduceMotion: boolean;
  soundEffectsEnabled: boolean;
  hapticFeedbackEnabled: boolean;
  autoLockTimeoutSeconds: number;
  biometricsEnabled: boolean;
  e2eeEnabled: boolean;
  callRecordingAllowed: boolean;
  chatWallpaper: string;
  maxUploadSizeMB: number;
}

export interface AuditLog {
  id: string;
  userId?: string;
  userEmail?: string;
  action: string;
  details?: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

export interface AdminTelemetry {
  uptimeSeconds: number;
  activeSockets: number;
  onlineUsers: {
    keerthi: boolean;
    anu: boolean;
  };
  activeCallsCount: number;
  totalMessagesCount: number;
  totalMemoriesCount: number;
  totalStorageBytes: number;
  memoryUsageMB: number;
  cpuLoadPercent: number;
  databaseStatus: 'connected' | 'degraded' | 'error';
}

export type AutoBackupSchedule = 'disabled' | 'hourly' | 'daily' | 'weekly' | 'monthly';

export interface BackupSnapshotMetadata {
  id: string;
  name: string;
  createdAt: string;
  sizeBytes: number;
  messagesCount: number;
  memoriesCount: number;
  loveNotesCount: number;
}

export interface BackupConfig {
  autoBackupSchedule: AutoBackupSchedule;
  lastBackupTimestamp?: string;
  backupRetentionCount: number;
  recentSnapshots: BackupSnapshotMetadata[];
}

export interface ClearDataPayload {
  pin: string;
  confirmationPhrase: string;
  target: 'all' | 'messages' | 'memories' | 'loveNotes' | 'calls';
}

export interface FullBackupSnapshot {
  version: string;
  exportedAt: string;
  checksum?: string;
  data: {
    messages: Message[];
    memories: MemoryItem[];
    loveNotes: LoveNoteItem[];
    timelineMilestones: TimelineMilestone[];
    appSettings: AppSettings;
    backupConfig: BackupConfig;
  };
}


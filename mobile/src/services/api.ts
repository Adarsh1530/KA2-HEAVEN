/**
 * KA² — HEAVEN Universal API Client
 * Supports Live Remote Backend with Automatic Client-Side Offline Fallback
 */

import {
  UserProfile,
  Message,
  MemoryItem,
  LoveNoteItem,
  VaultItem,
  TimelineMilestone,
  AppSettings,
  INITIAL_APP_SETTINGS,
  BatchCreateMemoriesInput,
} from '@ka2/shared';

const getApiBase = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname || 'localhost';
    if (window.location.port === '5173') {
      return `http://${hostname}:5000/api`;
    }
    return '/api';
  }
  return 'http://localhost:5000/api';
};

// Default Pre-seeded Users with unified UUIDs
const KEERTHI_ID = 'a1111111-1111-1111-1111-111111111111';
const ANU_ID = 'b2222222-2222-2222-2222-222222222222';

const INITIAL_USERS: UserProfile[] = [
  {
    id: KEERTHI_ID,
    email: 'keerthi@ka2heaven.local',
    name: 'Keerthi Adarsh',
    nickname: 'Keerthi',
    role: 'admin',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=faces',
    bio: 'Architect of our digital universe. Forever yours, Anu ❤️',
    presenceStatus: 'online',
    lastActive: new Date().toISOString(),
    createdAt: '2026-08-28T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: ANU_ID,
    email: 'anu@ka2heaven.local',
    name: 'Anu Sri',
    nickname: 'Anu',
    role: 'user',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop&crop=faces',
    bio: 'My heart, my home, my Keerthi. In our private Heaven ✨',
    presenceStatus: 'online',
    lastActive: new Date().toISOString(),
    createdAt: '2026-08-28T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  }
];

const INITIAL_MEMORIES: MemoryItem[] = [
  {
    id: 'mem-1',
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
    createdBy: KEERTHI_ID,
    createdAt: '2026-08-28T12:00:00.000Z',
    updatedAt: '2026-08-28T12:00:00.000Z',
  },
  {
    id: 'mem-2',
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
    createdBy: ANU_ID,
    createdAt: '2026-08-28T13:00:00.000Z',
    updatedAt: '2026-08-28T13:00:00.000Z',
  }
];

const INITIAL_LOVE_NOTES: LoveNoteItem[] = [
  {
    id: 'note-1',
    senderId: KEERTHI_ID,
    senderName: 'Keerthi Adarsh',
    receiverId: ANU_ID,
    title: 'To My Forever Girl ❤️',
    message: 'Every line of code, every design detail, every second spent building KA² — was inspired by your smile. You are my peace and my greatest blessing.',
    stationeryStyle: 'romantic_parchment',
    date: '2026-08-28',
    isOpened: true,
    openedAt: '2026-08-28T14:00:00.000Z',
    createdAt: '2026-08-28T14:00:00.000Z',
  }
];

class ClientEngine {
  private getStorage<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(`ka2_${key}`);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  private setStorage(key: string, val: any) {
    try {
      localStorage.setItem(`ka2_${key}`, JSON.stringify(val));
    } catch (e) {
      console.error('Storage error:', e);
    }
  }

  public getUsers(): UserProfile[] {
    return this.getStorage('users', INITIAL_USERS);
  }

  public saveUsers(users: UserProfile[]) {
    this.setStorage('users', users);
  }

  public getMessages(): Message[] {
    const isWiped = typeof localStorage !== 'undefined' && localStorage.getItem('ka2_data_cleared') === 'true';
    return this.getStorage('messages', isWiped ? [] : []);
  }

  public saveMessages(msgs: Message[]) {
    this.setStorage('messages', msgs);
  }

  public getMemories(): MemoryItem[] {
    const isWiped = typeof localStorage !== 'undefined' && localStorage.getItem('ka2_data_cleared') === 'true';
    return this.getStorage('memories', isWiped ? [] : []);
  }

  public saveMemories(mems: MemoryItem[]) {
    this.setStorage('memories', mems);
  }

  public getLoveNotes(): LoveNoteItem[] {
    const isWiped = typeof localStorage !== 'undefined' && localStorage.getItem('ka2_data_cleared') === 'true';
    return this.getStorage('love_notes', isWiped ? [] : []);
  }

  public saveLoveNotes(notes: LoveNoteItem[]) {
    this.setStorage('love_notes', notes);
  }

  public getVaultItems(vaultType: string, userId: string): VaultItem[] {
    const all = this.getStorage<VaultItem[]>('vault_items', []);
    if (vaultType === 'personal') {
      return all.filter(item => item.vaultType === 'personal' && item.ownerId === userId);
    }
    return all.filter(item => item.vaultType === 'shared');
  }

  public addVaultItem(item: VaultItem) {
    const all = this.getStorage<VaultItem[]>('vault_items', []);
    this.setStorage('vault_items', [item, ...all]);
  }

  public addVaultItems(items: VaultItem[]) {
    const all = this.getStorage<VaultItem[]>('vault_items', []);
    this.setStorage('vault_items', [...items, ...all]);
  }

  public deleteVaultItem(itemId: string) {
    const all = this.getStorage<VaultItem[]>('vault_items', []);
    this.setStorage('vault_items', all.filter(i => i.id !== itemId));
  }

  public clearAllData(target = 'all') {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('ka2_data_cleared', 'true');
      if (target === 'all' || !target) {
        localStorage.setItem('ka2_messages', '[]');
        localStorage.setItem('ka2_memories', '[]');
        localStorage.setItem('ka2_vault_items', '[]');
        localStorage.setItem('ka2_love_notes', '[]');
      } else if (target === 'messages') {
        localStorage.setItem('ka2_messages', '[]');
      } else if (target === 'memories') {
        localStorage.setItem('ka2_memories', '[]');
      } else if (target === 'vault') {
        localStorage.setItem('ka2_vault_items', '[]');
      } else if (target === 'loveNotes') {
        localStorage.setItem('ka2_love_notes', '[]');
      }
    }
    if (typeof sessionStorage !== 'undefined') {
      if (target === 'all' || !target) {
        sessionStorage.setItem('ka2_messages', '[]');
        sessionStorage.setItem('ka2_memories', '[]');
        sessionStorage.setItem('ka2_vault_items', '[]');
        sessionStorage.setItem('ka2_love_notes', '[]');
      }
    }
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new Event('ka2_data_cleared'));
        localStorage.setItem('ka2_last_wipe', Date.now().toString());
      } catch {}
    }
  }

  public getSettings(): AppSettings {
    return this.getStorage('settings', INITIAL_APP_SETTINGS);
  }

  public saveSettings(s: AppSettings) {
    this.setStorage('settings', s);
  }
}

const clientEngine = new ClientEngine();

class ApiService {
  private accessToken: string | null = null;
  private currentUserId: string | null = null;

  constructor() {
    this.initSession();
  }

  private initSession() {
    if (typeof window !== 'undefined') {
      try {
        this.accessToken = sessionStorage.getItem('ka2_access_token') || localStorage.getItem('ka2_access_token');
        this.currentUserId = sessionStorage.getItem('ka2_current_user_id') || localStorage.getItem('ka2_current_user_id');
      } catch (e) {
        console.warn('Storage read error:', e);
      }
    }
  }

  public setTokens(access: string, refresh?: string, userId?: string) {
    this.accessToken = access;
    if (userId) {
      this.currentUserId = userId;
    }
    if (typeof window !== 'undefined') {
      try {
        // Isolate per-tab in sessionStorage
        sessionStorage.setItem('ka2_access_token', access);
        if (refresh) sessionStorage.setItem('ka2_refresh_token', refresh);
        if (userId) sessionStorage.setItem('ka2_current_user_id', userId);

        // Also save to localStorage for single-tab persistence
        localStorage.setItem('ka2_access_token', access);
        if (refresh) localStorage.setItem('ka2_refresh_token', refresh);
        if (userId) localStorage.setItem('ka2_current_user_id', userId);
      } catch (e) {
        console.warn('Storage write error:', e);
      }
    }
  }

  public clearTokens() {
    this.accessToken = null;
    this.currentUserId = null;
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem('ka2_access_token');
        sessionStorage.removeItem('ka2_refresh_token');
        sessionStorage.removeItem('ka2_current_user_id');
        localStorage.removeItem('ka2_access_token');
        localStorage.removeItem('ka2_refresh_token');
        localStorage.removeItem('ka2_current_user_id');
      } catch (e) {
        console.warn('Storage clear error:', e);
      }
    }
  }

  public getAccessToken(): string | null {
    if (this.accessToken) return this.accessToken;
    if (typeof window !== 'undefined') {
      try {
        const sess = sessionStorage.getItem('ka2_access_token');
        if (sess) {
          this.accessToken = sess;
          return sess;
        }
        const loc = localStorage.getItem('ka2_access_token');
        if (loc) {
          this.accessToken = loc;
          return loc;
        }
      } catch {}
    }
    return null;
  }

  public getCurrentUserId(): string | null {
    if (this.currentUserId) return this.currentUserId;
    if (typeof window !== 'undefined') {
      try {
        const sess = sessionStorage.getItem('ka2_current_user_id');
        if (sess) {
          this.currentUserId = sess;
          return sess;
        }
        const loc = localStorage.getItem('ka2_current_user_id');
        if (loc) {
          this.currentUserId = loc;
          return loc;
        }
      } catch {}
    }
    return null;
  }

  public async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const apiBase = getApiBase();
    const token = this.getAccessToken();
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...((options.headers as Record<string, string>) || {}),
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const url = endpoint.startsWith('http')
        ? endpoint
        : `${apiBase}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

      const res = await fetch(url, { ...options, headers });
      if (res.ok) {
        return await res.json();
      }

      const errData = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(errData.error || 'Authentication error');
      }
      throw new Error(errData.error || `HTTP error ${res.status}`);
    } catch (e: any) {
      if (
        e.message &&
        (e.message.includes('Authentication') ||
          e.message.includes('Invalid') ||
          e.message.includes('Incorrect') ||
          e.message.includes('PIN'))
      ) {
        throw e;
      }
      console.warn('Remote API unavailable, using offline fallback engine:', e.message);
      return this.handleClientRequest<T>(endpoint, options);
    }
  }

  private async handleClientRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const method = (options.method || 'GET').toUpperCase();
    const body = options.body ? JSON.parse(options.body as string) : {};

    // 1. Auth: Login
    if (endpoint.includes('/auth/login') && method === 'POST') {
      const { email } = body;
      const users = clientEngine.getUsers();
      const user =
        users.find(u => u.email.toLowerCase() === (email || '').trim().toLowerCase()) ||
        users[0];

      this.setTokens(`token_${user.id}`, `refresh_${user.id}`, user.id);
      return {
        user,
        tokens: {
          accessToken: `token_${user.id}`,
          refreshToken: `refresh_${user.id}`,
          expiresIn: 86400 * 30,
        },
      } as any;
    }

    // 2. Auth: Me
    if (endpoint.includes('/auth/me')) {
      const users = clientEngine.getUsers();
      const user = users.find(u => u.id === this.currentUserId) || users[0];
      const partner = users.find(u => u.id !== user.id) || (user.id === KEERTHI_ID ? users[1] : users[0]);
      return {
        user,
        partner,
        appSettings: clientEngine.getSettings(),
      } as any;
    }

    // 3. Auth: Profile Update
    if (endpoint.includes('/auth/profile') && method === 'PUT') {
      const users = clientEngine.getUsers();
      const updated = users.map(u =>
        u.id === this.currentUserId ? { ...u, ...body, updatedAt: new Date().toISOString() } : u
      );
      clientEngine.saveUsers(updated);
      const user = updated.find(u => u.id === this.currentUserId);
      return { user } as any;
    }

    // 4. Auth: PIN Verify
    if (endpoint.includes('/auth/pin/verify')) {
      const { pin } = body;
      return { verified: pin === '2808' || pin === localStorage.getItem('ka2_custom_pin') } as any;
    }

    // 5. Auth: PIN Change
    if (endpoint.includes('/auth/pin/change')) {
      const { newPin } = body;
      localStorage.setItem('ka2_custom_pin', newPin);
      return { success: true } as any;
    }

    // 6. Auth: Sessions
    if (endpoint.includes('/auth/sessions')) {
      return {
        sessions: [
          {
            id: 'sess-current',
            userId: this.currentUserId || KEERTHI_ID,
            deviceName: typeof navigator !== 'undefined' && navigator.userAgent.includes('Mobile') ? 'Mobile Phone' : 'Web Browser',
            deviceType: 'mobile',
            ipAddress: '127.0.0.1',
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Browser',
            isCurrent: true,
            lastActive: new Date().toISOString(),
            createdAt: '2026-08-28T00:00:00.000Z',
          },
        ],
      } as any;
    }

    // 7. Chat: Messages
    if (endpoint.startsWith('/chat/messages') || endpoint === '/chat/messages') {
      if (method === 'GET') {
        const msgs = clientEngine.getMessages();
        return { messages: msgs } as any;
      }
      if (method === 'POST') {
        const msgs = clientEngine.getMessages();
        const users = clientEngine.getUsers();
        const me = users.find(u => u.id === this.currentUserId) || users[0];
        const partner = users.find(u => u.id !== me.id) || users[1];

        const newMsg: Message = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          senderId: me.id,
          receiverId: partner.id,
          content: body.content || '',
          type: body.type || 'text',
          mediaUrl: body.mediaUrl,
          thumbnailUrl: body.thumbnailUrl,
          mediaMeta: body.mediaMeta,
          voiceMeta: body.voiceMeta,
          replyToId: body.replyToId,
          reactions: [],
          isEdited: false,
          isDeleted: false,
          status: 'sent',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        clientEngine.saveMessages([...msgs, newMsg]);
        return { message: newMsg } as any;
      }
    }

    // 8. Chat: React
    if (endpoint.includes('/react') && method === 'POST') {
      const msgId = endpoint.split('/')[3];
      const msgs = clientEngine.getMessages();
      const updated = msgs.map(m => {
        if (m.id === msgId) {
          const existing = m.reactions.find(
            r => r.userId === this.currentUserId && r.emoji === body.emoji
          );
          const newReactions = existing
            ? m.reactions.filter(r => r.id !== existing.id)
            : [
                ...m.reactions,
                {
                  id: `r-${Date.now()}`,
                  messageId: msgId,
                  userId: this.currentUserId || KEERTHI_ID,
                  emoji: body.emoji,
                  createdAt: new Date().toISOString(),
                },
              ];
          return { ...m, reactions: newReactions };
        }
        return m;
      });
      clientEngine.saveMessages(updated);
      return { success: true } as any;
    }

    // 9. Memories: Batch
    if (endpoint.includes('/memories/batch') && method === 'POST') {
      const { memories: items } = body as BatchCreateMemoriesInput;
      const memories = clientEngine.getMemories();
      const now = new Date().toISOString();
      const created: MemoryItem[] = (items || []).map((item, idx) => {
        const memDate = item.date || now.split('T')[0];
        const defaultTitle = `Memory — ${new Date(memDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        return {
          id: `mem-${Date.now()}-${idx}`,
          title: item.title?.trim() || defaultTitle,
          description: item.description || '',
          date: memDate,
          location: item.location || 'Our Heaven',
          category: item.category || 'photos',
          mediaUrl: item.mediaUrl,
          thumbnailUrl: item.thumbnailUrl || item.mediaUrl,
          mediaType: item.mediaType || 'image',
          isFavorite: Boolean(item.isFavorite),
          notes: item.notes || '',
          createdBy: this.currentUserId || KEERTHI_ID,
          createdAt: now,
          updatedAt: now,
        };
      });

      clientEngine.saveMemories([...created, ...memories]);
      return { memories: created, success: true } as any;
    }

    // 9. Memories: Single
    if (endpoint.startsWith('/memories') || endpoint === '/memories') {
      if (method === 'GET') {
        const memories = clientEngine.getMemories();
        return { memories } as any;
      }
      if (method === 'POST') {
        const memories = clientEngine.getMemories();
        const memDate = body.date || new Date().toISOString().split('T')[0];
        const defaultTitle = `Memory — ${new Date(memDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

        const newMem: MemoryItem = {
          id: `mem-${Date.now()}`,
          title: body.title?.trim() || defaultTitle,
          description: body.description || '',
          date: memDate,
          location: body.location || 'Our Heaven',
          category: body.category || 'photos',
          mediaUrl: body.mediaUrl || 'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?w=800',
          mediaType: body.mediaType || 'image',
          isFavorite: Boolean(body.isFavorite),
          notes: body.notes || '',
          createdBy: this.currentUserId || KEERTHI_ID,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        clientEngine.saveMemories([newMem, ...memories]);
        return { memory: newMem } as any;
      }
    }

    // 10. Love Notes
    if (endpoint.startsWith('/love-notes') || endpoint === '/love-notes') {
      if (method === 'GET') {
        const notes = clientEngine.getLoveNotes();
        return { loveNotes: notes } as any;
      }
      if (method === 'POST') {
        const notes = clientEngine.getLoveNotes();
        const users = clientEngine.getUsers();
        const me = users.find(u => u.id === this.currentUserId) || users[0];
        const partner = users.find(u => u.id !== me.id) || users[1];

        const newNote: LoveNoteItem = {
          id: `note-${Date.now()}`,
          senderId: me.id,
          senderName: me.name,
          receiverId: partner.id,
          title: body.title || 'Love Note',
          message: body.message || '',
          stationeryStyle: body.stationeryStyle || 'rose_gold',
          photoUrl: body.photoUrl,
          date: new Date().toISOString().split('T')[0],
          isOpened: false,
          createdAt: new Date().toISOString(),
        };
        clientEngine.saveLoveNotes([newNote, ...notes]);
        return { loveNote: newNote } as any;
      }
    }

    // 11. Vault: Batch
    if (endpoint.includes('/vault/batch') && method === 'POST') {
      const { items } = body;
      const now = new Date().toISOString();
      const created: VaultItem[] = (items || []).map((item: any, idx: number) => ({
        id: `vault-${Date.now()}-${idx}`,
        ownerId: this.currentUserId || KEERTHI_ID,
        vaultType: item.vaultType || 'shared',
        title: item.title || `Secret Photo — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
        itemType: item.itemType || 'photo',
        encryptedData: item.encryptedData,
        iv: item.iv,
        authTag: item.authTag || '',
        fileUrl: item.fileUrl,
        fileSize: item.fileSize,
        mimeType: item.mimeType,
        createdAt: now,
        updatedAt: now,
      }));
      clientEngine.addVaultItems(created);
      return { items: created, success: true } as any;
    }

    // 11. Vault: Single
    if (endpoint.startsWith('/vault')) {
      const urlParams = new URLSearchParams(endpoint.split('?')[1] || '');
      const vaultType = urlParams.get('vaultType') || 'shared';

      if (method === 'GET') {
        const items = clientEngine.getVaultItems(
          vaultType,
          this.currentUserId || KEERTHI_ID
        );
        return { items } as any;
      }
      if (method === 'POST') {
        const newItem: VaultItem = {
          id: `vault-${Date.now()}`,
          ownerId: this.currentUserId || KEERTHI_ID,
          vaultType: body.vaultType || 'shared',
          title: body.title || `Secret Item — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
          itemType: body.itemType || 'note',
          encryptedData: body.encryptedData,
          iv: body.iv,
          authTag: body.authTag || '',
          fileUrl: body.fileUrl,
          fileSize: body.fileSize,
          mimeType: body.mimeType,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        clientEngine.addVaultItem(newItem);
        return { item: newItem } as any;
      }
      if (method === 'DELETE') {
        const id = endpoint.split('/')[2];
        clientEngine.deleteVaultItem(id);
        return { success: true } as any;
      }
    }

    // 12. Admin Telemetry & Settings
    if (endpoint.includes('/admin/telemetry')) {
      return {
        uptimeSeconds: 86400,
        activeSockets: 2,
        onlineUsers: { keerthi: true, anu: true },
        activeCallsCount: 0,
        totalMessagesCount: clientEngine.getMessages().length,
        totalMemoriesCount: clientEngine.getMemories().length,
        totalVaultItemsCount: 4,
        totalStorageBytes: 10485760,
        memoryUsageMB: 48,
        cpuLoadPercent: 5,
        databaseStatus: 'connected',
      } as any;
    }

    if (endpoint.includes('/admin/clear-data') && method === 'POST') {
      clientEngine.clearAllData(body.target || 'all');
      return { success: true, message: 'All couple data wiped cleanly from storage.' } as any;
    }

    if (endpoint.includes('/admin/settings')) {
      if (method === 'GET') {
        return { settings: clientEngine.getSettings() } as any;
      }
      if (method === 'PUT') {
        clientEngine.saveSettings(body);
        return { settings: body } as any;
      }
    }

    return { success: true } as any;
  }

  // Upload Single Media File
  public async uploadMedia(
    file: File
  ): Promise<{ fileUrl: string; fileName: string; fileSize: number; mimeType: string }> {
    try {
      const apiBase = getApiBase();
      const formData = new FormData();
      formData.append('file', file);
      const headers: Record<string, string> = {};
      const token = this.getAccessToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${apiBase}/media/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Remote media upload failed, fallback to local data URL:', e);
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          fileUrl: reader.result as string,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Upload Multiple Media Files
  public async uploadMultipleMedia(
    files: File[]
  ): Promise<Array<{ fileUrl: string; fileName: string; fileSize: number; mimeType: string }>> {
    if (files.length === 0) return [];

    try {
      const apiBase = getApiBase();
      const formData = new FormData();
      files.forEach(f => formData.append('files', f));
      const headers: Record<string, string> = {};
      const token = this.getAccessToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${apiBase}/media/upload-multiple`, {
        method: 'POST',
        headers,
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        return data.files;
      }
    } catch (e) {
      console.warn('Remote multi-upload failed, fallback to sequential uploads:', e);
    }

    return Promise.all(files.map(f => this.uploadMedia(f)));
  }
}

export const api = new ApiService();

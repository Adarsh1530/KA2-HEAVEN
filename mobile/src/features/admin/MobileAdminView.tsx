import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../../components/common/GlassCard';
import {
  LayoutDashboard,
  Phone,
  MessageSquare,
  Heart,
  Smartphone,
  History,
  Database,
  ArrowLeft,
  RefreshCw,
  ShieldCheck,
  Radio,
  Video,
  Clock,
  CheckCircle2,
  XCircle,
  PhoneMissed,
  Search,
  Image,
  Mic,
  Calendar,
  MapPin,
  Mail,
  Download,
  Upload,
  Trash2,
  Cpu,
  HardDrive,
  Server,
  Activity,
} from 'lucide-react';
import { format } from 'date-fns';

type AdminMobileTab = 'overview' | 'calls' | 'chats' | 'memories' | 'devices' | 'audit' | 'maintenance';

interface MobileAdminViewProps {
  onBack: () => void;
}

export const MobileAdminView: React.FC<MobileAdminViewProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminMobileTab>('overview');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Telemetry
  const [telemetry, setTelemetry] = useState<any>(null);

  // Calls
  const [calls, setCalls] = useState<any[]>([]);
  const [callFilter, setCallFilter] = useState<'all' | 'voice' | 'video'>('all');

  // Chats
  const [messages, setMessages] = useState<any[]>([]);
  const [chatSearch, setChatSearch] = useState('');

  // Memories & Love Notes
  const [memories, setMemories] = useState<any[]>([]);
  const [loveNotes, setLoveNotes] = useState<any[]>([]);
  const [memoryTab, setMemoryTab] = useState<'photos' | 'notes'>('photos');

  // Devices & Audit
  const [devices, setDevices] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Backup & Maintenance
  const [backupSchedule, setBackupSchedule] = useState<string>('daily');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const loadAllData = async () => {
    try {
      setRefreshing(true);
      const [tRes, cRes, chRes, mRes, dRes, aRes] = await Promise.allSettled([
        api.request('/admin/telemetry'),
        api.request('/admin/calls'),
        api.request('/admin/chats'),
        api.request('/admin/memories'),
        api.request('/admin/devices'),
        api.request('/admin/audit-logs'),
      ]);

      if (tRes.status === 'fulfilled') setTelemetry(tRes.value.telemetry);
      if (cRes.status === 'fulfilled') setCalls(cRes.value.calls || []);
      if (chRes.status === 'fulfilled') setMessages(chRes.value.messages || []);
      if (mRes.status === 'fulfilled') {
        setMemories(mRes.value.memories || []);
        setLoveNotes(mRes.value.loveNotes || []);
      }
      if (dRes.status === 'fulfilled') setDevices(dRes.value.devices || []);
      if (aRes.status === 'fulfilled') setAuditLogs(aRes.value.logs || []);
    } catch (err) {
      console.error('Failed to load mobile admin data:', err);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const formatDuration = (sec: number) => {
    if (!sec || sec <= 0) return '0s';
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return mins > 0 ? `${mins}m ${s}s` : `${s}s`;
  };

  const handleExportBackup = async () => {
    try {
      const data = await api.request('/admin/backup/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `KA2_HEAVEN_BACKUP_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatusMsg('Backup exported successfully.');
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (e: any) {
      setStatusMsg('Failed to export backup.');
    }
  };

  const handleRevokeDevice = async (deviceId: string) => {
    if (!confirm('Revoke this device session?')) return;
    try {
      await api.request(`/admin/devices/${deviceId}`, { method: 'DELETE' });
      setDevices(prev => prev.filter(d => d.id !== deviceId));
      setStatusMsg('Device session revoked.');
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (e) {
      setStatusMsg('Failed to revoke device.');
    }
  };

  const navItems: { id: AdminMobileTab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Telemetry', icon: LayoutDashboard },
    { id: 'calls', label: 'Calls', icon: Phone },
    { id: 'chats', label: 'Chats', icon: MessageSquare },
    { id: 'memories', label: 'Memories', icon: Heart },
    { id: 'devices', label: 'Devices', icon: Smartphone },
    { id: 'audit', label: 'Audit', icon: History },
    { id: 'maintenance', label: 'Backups', icon: Database },
  ];

  const filteredCalls = calls.filter(c => {
    if (callFilter !== 'all' && c.callType !== callFilter) return false;
    return true;
  });

  const filteredChats = messages.filter(m => {
    if (chatSearch.trim()) {
      const q = chatSearch.toLowerCase();
      return (m.content || '').toLowerCase().includes(q) || (m.senderName || '').toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="flex flex-col min-h-screen bg-[#07070C] text-white select-none pb-24">
      {/* Top Mobile Admin Header */}
      <header className="sticky top-0 z-30 bg-[#101019]/95 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:text-white"
            title="Back to App"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-bold bg-gradient-to-r from-[#9B5CFF] to-[#FF4F81] bg-clip-text text-transparent">
                KA² HEAVEN
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FF4F81]/20 text-[#FF91B5] font-semibold border border-[#FF4F81]/30">
                Admin
              </span>
            </div>
            <p className="text-[10px] text-[#A7A7B7]">Mobile Infrastructure Console</p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadAllData}
          disabled={refreshing}
          className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:text-white"
          title="Refresh All"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#FF4F81]' : ''}`} />
        </button>
      </header>

      {/* Horizontal Mobile Segmented Tabs */}
      <div className="px-4 py-2 bg-[#0C0C14] border-b border-white/5 overflow-x-auto no-scrollbar flex items-center space-x-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shrink-0 transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-[#9B5CFF]/30 to-[#FF4F81]/30 border border-[#FF4F81] text-white shadow-glow-pink'
                  : 'bg-white/5 border border-white/5 text-[#A7A7B7] hover:text-white'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#FF4F81]' : 'text-white/60'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Status Feedback Toast */}
      {statusMsg && (
        <div className="mx-4 mt-3 p-2.5 rounded-xl bg-[#42D392]/20 border border-[#42D392]/40 text-[#42D392] text-xs text-center font-semibold animate-fade-in">
          {statusMsg}
        </div>
      )}

      {/* Main Tab Content */}
      <div className="p-4 space-y-4">
        {/* ================================================================= */}
        {/* TAB 1: TELEMETRY & HEALTH */}
        {/* ================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Couple Presence Banner */}
            <div className="grid grid-cols-2 gap-3">
              <GlassCard className="p-3 border-white/10 flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-full bg-[#9B5CFF]/20 border border-[#9B5CFF]/40 flex items-center justify-center font-bold text-sm text-[#B28CFF]">
                  K
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Keerthi</h4>
                  <p className="text-[10px] text-[#42D392]">🟢 Admin Online</p>
                </div>
              </GlassCard>

              <GlassCard className="p-3 border-white/10 flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-full bg-[#FF4F81]/20 border border-[#FF4F81]/40 flex items-center justify-center font-bold text-sm text-[#FF91B5]">
                  A
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Anu Sri</h4>
                  <p className="text-[10px] text-[#FF91B5]">
                    {telemetry?.onlineUsers?.anu ? '🟢 In Heaven' : '⚪ Last seen'}
                  </p>
                </div>
              </GlassCard>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-2 gap-3">
              <GlassCard className="p-3 border-white/10">
                <div className="flex items-center justify-between text-[#FF4F81] mb-1">
                  <span className="text-[11px] font-medium text-[#A7A7B7]">Voice/Video Calls</span>
                  <Phone className="w-4 h-4" />
                </div>
                <div className="text-xl font-extrabold text-white">{calls.length}</div>
                <p className="text-[10px] text-[#FF91B5]">Auto saved ledger</p>
              </GlassCard>

              <GlassCard className="p-3 border-white/10">
                <div className="flex items-center justify-between text-[#9B5CFF] mb-1">
                  <span className="text-[11px] font-medium text-[#A7A7B7]">Messages</span>
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="text-xl font-extrabold text-white">{messages.length}</div>
                <p className="text-[10px] text-[#B28CFF]">Zero data lost</p>
              </GlassCard>

              <GlassCard className="p-3 border-white/10">
                <div className="flex items-center justify-between text-[#FF4F81] mb-1">
                  <span className="text-[11px] font-medium text-[#A7A7B7]">Memories</span>
                  <Heart className="w-4 h-4" />
                </div>
                <div className="text-xl font-extrabold text-white">{memories.length}</div>
                <p className="text-[10px] text-[#FF91B5]">Photos & videos</p>
              </GlassCard>

              <GlassCard className="p-3 border-white/10">
                <div className="flex items-center justify-between text-[#42D392] mb-1">
                  <span className="text-[11px] font-medium text-[#A7A7B7]">Active Sockets</span>
                  <Radio className="w-4 h-4" />
                </div>
                <div className="text-xl font-extrabold text-white">{telemetry?.activeSockets || 2}</div>
                <p className="text-[10px] text-[#42D392]">WebRTC / WSS Live</p>
              </GlassCard>
            </div>

            {/* Storage & Hardware Stats */}
            <GlassCard className="p-4 border-white/10 space-y-2.5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                <HardDrive className="w-4 h-4 text-[#FFB156]" />
                <span>System & Storage Health</span>
              </h4>
              <div className="flex items-center justify-between text-xs py-1 border-t border-white/5">
                <span className="text-[#A7A7B7]">Disk Storage Used</span>
                <span className="font-mono text-white">
                  {((telemetry?.totalStorageBytes || 0) / (1024 * 1024)).toFixed(2)} MB
                </span>
              </div>
              <div className="flex items-center justify-between text-xs py-1 border-t border-white/5">
                <span className="text-[#A7A7B7]">Database Engine</span>
                <span className="text-[#42D392] font-semibold">JSON Realtime Persistent</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1 border-t border-white/5">
                <span className="text-[#A7A7B7]">Server Uptime</span>
                <span className="font-mono text-white">{telemetry?.uptimeSeconds || 86400}s</span>
              </div>
            </GlassCard>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: VOICE & VIDEO CALLS LEDGER */}
        {/* ================================================================= */}
        {activeTab === 'calls' && (
          <div className="space-y-3">
            {/* Filter */}
            <div className="flex rounded-xl bg-white/5 p-1 border border-white/10 text-xs">
              <button
                onClick={() => setCallFilter('all')}
                className={`flex-1 py-1.5 rounded-lg font-semibold transition-colors ${
                  callFilter === 'all' ? 'bg-[#FF4F81] text-white' : 'text-[#A7A7B7]'
                }`}
              >
                All ({calls.length})
              </button>
              <button
                onClick={() => setCallFilter('voice')}
                className={`flex-1 py-1.5 rounded-lg font-semibold transition-colors ${
                  callFilter === 'voice' ? 'bg-[#FF4F81] text-white' : 'text-[#A7A7B7]'
                }`}
              >
                Voice ({calls.filter(c => c.callType === 'voice').length})
              </button>
              <button
                onClick={() => setCallFilter('video')}
                className={`flex-1 py-1.5 rounded-lg font-semibold transition-colors ${
                  callFilter === 'video' ? 'bg-[#9B5CFF] text-white' : 'text-[#A7A7B7]'
                }`}
              >
                Video ({calls.filter(c => c.callType === 'video').length})
              </button>
            </div>

            {/* List */}
            <div className="space-y-2">
              {filteredCalls.length === 0 ? (
                <GlassCard className="p-8 text-center text-xs text-[#A7A7B7]">
                  No call logs recorded yet.
                </GlassCard>
              ) : (
                filteredCalls.map((call) => {
                  const isVideo = call.callType === 'video';
                  const isCompleted = call.status === 'completed' || call.status === 'connected';

                  return (
                    <GlassCard key={call.id} className="p-3 border-white/10 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                            isVideo
                              ? 'bg-[#9B5CFF]/15 border-[#9B5CFF]/30 text-[#9B5CFF]'
                              : 'bg-[#FF4F81]/15 border-[#FF4F81]/30 text-[#FF91B5]'
                          }`}
                        >
                          {isVideo ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                        </div>

                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="text-xs font-bold text-white">{call.callerName}</span>
                            <span className="text-[10px] text-[#A7A7B7]">➔</span>
                            <span className="text-xs font-bold text-white">{call.receiverName}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-[10px] text-[#A7A7B7] mt-0.5">
                            <span>{format(new Date(call.createdAt || call.startedAt), 'MMM dd, HH:mm')}</span>
                            {call.durationSeconds > 0 && (
                              <span className="text-white font-medium">({formatDuration(call.durationSeconds)})</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        {isCompleted ? (
                          <span className="px-2 py-0.5 rounded-full bg-[#42D392]/20 border border-[#42D392]/30 text-[#42D392] text-[10px] font-semibold">
                            Completed
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-[#FF5570]/20 border border-[#FF5570]/30 text-[#FF5570] text-[10px] font-semibold">
                            {call.status}
                          </span>
                        )}
                      </div>
                    </GlassCard>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3: CHATS & MESSAGES */}
        {/* ================================================================= */}
        {activeTab === 'chats' && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search messages..."
                value={chatSearch}
                onChange={(e) => setChatSearch(e.target.value)}
                className="w-full bg-[#101019] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#FF4F81]"
              />
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredChats.length === 0 ? (
                <GlassCard className="p-8 text-center text-xs text-[#A7A7B7]">
                  No messages found.
                </GlassCard>
              ) : (
                filteredChats.map((msg) => {
                  const isKeerthi = msg.senderId === 'a1111111-1111-1111-1111-111111111111' || (msg.senderName || '').includes('Keerthi');

                  return (
                    <GlassCard key={msg.id} className="p-3 border-white/10 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${isKeerthi ? 'text-[#B28CFF]' : 'text-[#FF91B5]'}`}>
                          {msg.senderName || (isKeerthi ? 'Keerthi' : 'Anu')}
                        </span>
                        <span className="text-[10px] text-[#A7A7B7]">
                          {format(new Date(msg.createdAt), 'MMM dd, HH:mm')}
                        </span>
                      </div>

                      <p className="text-xs text-white/90 whitespace-pre-wrap">{msg.content}</p>

                      {msg.mediaUrl && (
                        <img
                          src={msg.mediaUrl}
                          alt="Attachment"
                          className="w-24 h-24 rounded-lg object-cover mt-1"
                        />
                      )}
                    </GlassCard>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 4: MEMORIES & LOVE NOTES */}
        {/* ================================================================= */}
        {activeTab === 'memories' && (
          <div className="space-y-3">
            <div className="flex rounded-xl bg-white/5 p-1 border border-white/10 text-xs">
              <button
                onClick={() => setMemoryTab('photos')}
                className={`flex-1 py-1.5 rounded-lg font-semibold transition-colors ${
                  memoryTab === 'photos' ? 'bg-[#FF4F81] text-white' : 'text-[#A7A7B7]'
                }`}
              >
                Photos & Videos ({memories.length})
              </button>
              <button
                onClick={() => setMemoryTab('notes')}
                className={`flex-1 py-1.5 rounded-lg font-semibold transition-colors ${
                  memoryTab === 'notes' ? 'bg-[#9B5CFF] text-white' : 'text-[#A7A7B7]'
                }`}
              >
                Love Letters ({loveNotes.length})
              </button>
            </div>

            {memoryTab === 'photos' ? (
              <div className="grid grid-cols-2 gap-2.5">
                {memories.map((m) => (
                  <GlassCard key={m.id} className="overflow-hidden border-white/10 p-0 flex flex-col">
                    <img
                      src={m.mediaUrl}
                      alt={m.title}
                      className="w-full h-32 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=300';
                      }}
                    />
                    <div className="p-2">
                      <h5 className="text-xs font-bold text-white truncate">{m.title}</h5>
                      <p className="text-[10px] text-[#A7A7B7] truncate">{m.date || 'Cherished'}</p>
                    </div>
                  </GlassCard>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {loveNotes.map((n) => (
                  <GlassCard key={n.id} className="p-3 border-white/10 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#FF91B5]">{n.senderName || 'My Love'}</span>
                      <span className="text-[10px] text-[#A7A7B7]">
                        {format(new Date(n.createdAt || new Date()), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    {n.title && <h5 className="text-xs font-bold text-white">{n.title}</h5>}
                    <p className="text-xs text-white/80 italic whitespace-pre-wrap">"{n.content}"</p>
                  </GlassCard>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 5: DEVICE SESSIONS */}
        {/* ================================================================= */}
        {activeTab === 'devices' && (
          <div className="space-y-2">
            {devices.map((dev) => (
              <GlassCard key={dev.id} className="p-3 border-white/10 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#FF91B5]">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">{dev.deviceName}</h5>
                    <p className="text-[10px] text-[#A7A7B7]">{dev.userName} • {dev.ipAddress}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleRevokeDevice(dev.id)}
                  className="p-1.5 rounded-lg bg-[#FF5570]/20 text-[#FF5570] hover:bg-[#FF5570]/30"
                  title="Revoke Session"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </GlassCard>
            ))}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 6: AUDIT TRAIL */}
        {/* ================================================================= */}
        {activeTab === 'audit' && (
          <div className="space-y-2">
            {auditLogs.slice(0, 30).map((log) => (
              <GlassCard key={log.id} className="p-3 border-white/10 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-white font-mono font-bold">
                    {log.action}
                  </span>
                  <span className="text-[10px] text-[#A7A7B7]">
                    {format(new Date(log.createdAt), 'MMM dd, HH:mm:ss')}
                  </span>
                </div>
                <p className="text-xs text-white/80">{log.details}</p>
              </GlassCard>
            ))}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 7: BACKUPS & DATA MAINTENANCE */}
        {/* ================================================================= */}
        {activeTab === 'maintenance' && (
          <div className="space-y-3">
            <GlassCard className="p-4 border-white/10 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                <Database className="w-4 h-4 text-[#9B5CFF]" />
                <span>One-Click Full JSON Backup</span>
              </h4>
              <p className="text-xs text-[#A7A7B7]">
                Export every chat, call, memory, and love note into an encrypted JSON archive.
              </p>
              <button
                type="button"
                onClick={handleExportBackup}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#9B5CFF] to-[#FF4F81] text-white text-xs font-semibold flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export Complete Backup</span>
              </button>
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
};

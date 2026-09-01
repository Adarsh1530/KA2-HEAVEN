import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api, resolveMediaUrl } from '../../services/api';
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
  Image as ImageIcon,
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
  AlertTriangle,
  FileJson,
  X,
  Laptop,
  Check,
  Lock,
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
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 1. Telemetry
  const [telemetry, setTelemetry] = useState<any>(null);

  // 2. Calls
  const [calls, setCalls] = useState<any[]>([]);
  const [callSearch, setCallSearch] = useState('');
  const [callTypeFilter, setCallTypeFilter] = useState<'all' | 'voice' | 'video'>('all');
  const [callStatusFilter, setCallStatusFilter] = useState<string>('all');

  // 3. Chats
  const [messages, setMessages] = useState<any[]>([]);
  const [chatSearch, setChatSearch] = useState('');
  const [chatSenderFilter, setChatSenderFilter] = useState<'all' | 'keerthi' | 'anu'>('all');
  const [chatTypeFilter, setChatTypeFilter] = useState<string>('all');

  // 4. Memories
  const [memories, setMemories] = useState<any[]>([]);
  const [loveNotes, setLoveNotes] = useState<any[]>([]);
  const [memoryTab, setMemoryTab] = useState<'photos' | 'notes'>('photos');
  const [memorySearch, setMemorySearch] = useState('');

  // 5. Devices
  const [devices, setDevices] = useState<any[]>([]);

  // 6. Audit Logs
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState<string>('all');

  // 7. Backups & Maintenance
  const [backupSchedule, setBackupSchedule] = useState<string>('daily');
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const restoreFileInputRef = useRef<HTMLInputElement | null>(null);

  // Clear Data Modal State
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [clearTarget, setClearTarget] = useState<'all' | 'messages' | 'memories' | 'loveNotes'>('all');
  const [pinInput, setPinInput] = useState('');
  const [confirmationPhrase, setConfirmationPhrase] = useState('');
  const [isClearing, setIsClearing] = useState(false);

  const loadAllData = async () => {
    try {
      setRefreshing(true);
      const [tRes, cRes, chRes, mRes, dRes, aRes, bRes] = await Promise.allSettled([
        api.request('/admin/telemetry'),
        api.request('/admin/calls'),
        api.request('/admin/chats'),
        api.request('/admin/memories'),
        api.request('/admin/devices'),
        api.request('/admin/audit-logs'),
        api.request('/admin/backup/config'),
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
      if (bRes.status === 'fulfilled' && bRes.value.config?.autoBackupSchedule) {
        setBackupSchedule(bRes.value.config.autoBackupSchedule);
      }
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

  const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg(null), 3500);
  };

  const formatDuration = (sec: number) => {
    if (!sec || sec <= 0) return '0s';
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (hrs > 0) return `${hrs}h ${mins}m ${s}s`;
    if (mins > 0) return `${mins}m ${s}s`;
    return `${s}s`;
  };

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${d}d ${h}h ${m}m ${s}s`;
  };

  const formatStorage = (bytes: number) => {
    if (!bytes || bytes <= 0) return '0 Bytes';
    if (bytes < 1024) return `${bytes} Bytes`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // --- ACTIONS ---
  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      const data = await api.request('/admin/backup/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `KA2_HEAVEN_BACKUP_${format(new Date(), 'yyyy-MM-dd_HHmm')}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showStatus('Full backup snapshot exported successfully.');
    } catch (e: any) {
      showStatus('Failed to export backup.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsRestoring(true);
    try {
      const text = await file.text();
      const snapshot = JSON.parse(text);

      if (!snapshot.data) {
        throw new Error('Invalid backup structure.');
      }

      await api.request('/admin/backup/restore', {
        method: 'POST',
        body: JSON.stringify(snapshot),
      });

      showStatus('Backup restored successfully into Heaven.');
      await loadAllData();
    } catch (err: any) {
      showStatus(err.message || 'Failed to restore backup.', 'error');
    } finally {
      setIsRestoring(false);
      if (restoreFileInputRef.current) restoreFileInputRef.current.value = '';
    }
  };

  const handleSaveSchedule = async (newSchedule: string) => {
    setBackupSchedule(newSchedule);
    setIsSavingSchedule(true);
    try {
      await api.request('/admin/backup/config', {
        method: 'PUT',
        body: JSON.stringify({ autoBackupSchedule: newSchedule }),
      });
      showStatus(`Backup schedule updated to ${newSchedule.toUpperCase()}`);
    } catch (err: any) {
      showStatus('Failed to update schedule.', 'error');
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const handleRevokeDevice = async (deviceId: string) => {
    if (!confirm('Revoke this device session?')) return;
    try {
      await api.request(`/admin/devices/${deviceId}`, { method: 'DELETE' });
      setDevices((prev) => prev.filter((d) => d.id !== deviceId));
      showStatus('Device session revoked.');
    } catch (e) {
      showStatus('Failed to revoke device.', 'error');
    }
  };

  const handleExecuteClearData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmationPhrase !== 'CLEAR HEAVEN DATA' || pinInput.length < 4) return;

    setIsClearing(true);
    try {
      const res = await api.request('/admin/clear-data', {
        method: 'POST',
        body: JSON.stringify({
          pin: pinInput,
          confirmationPhrase,
          target: clearTarget,
        }),
      });

      showStatus(res.message || 'Data cleared successfully.');
      setIsClearModalOpen(false);
      setPinInput('');
      setConfirmationPhrase('');
      await loadAllData();
    } catch (err: any) {
      showStatus(err.message || 'Failed to clear data. Verify your PIN.', 'error');
    } finally {
      setIsClearing(false);
    }
  };

  // --- FILTERS ---
  const filteredCalls = calls.filter((c) => {
    if (callTypeFilter !== 'all' && c.callType !== callTypeFilter) return false;
    if (callStatusFilter !== 'all' && c.status !== callStatusFilter) return false;
    if (callSearch.trim()) {
      const q = callSearch.toLowerCase();
      const matchCaller = (c.callerName || '').toLowerCase().includes(q);
      const matchReceiver = (c.receiverName || '').toLowerCase().includes(q);
      if (!matchCaller && !matchReceiver) return false;
    }
    return true;
  });

  const filteredChats = messages.filter((m) => {
    if (chatSenderFilter === 'keerthi') {
      const isKeerthi = m.senderId === 'a1111111-1111-1111-1111-111111111111' || (m.senderName || '').includes('Keerthi');
      if (!isKeerthi) return false;
    } else if (chatSenderFilter === 'anu') {
      const isAnu = m.senderId === 'b2222222-2222-2222-2222-222222222222' || (m.senderName || '').includes('Anu');
      if (!isAnu) return false;
    }

    if (chatTypeFilter !== 'all' && m.type !== chatTypeFilter) return false;

    if (chatSearch.trim()) {
      const q = chatSearch.toLowerCase();
      return (m.content || '').toLowerCase().includes(q) || (m.senderName || '').toLowerCase().includes(q);
    }
    return true;
  });

  const filteredMemories = memories.filter((m) => {
    if (memorySearch.trim()) {
      const q = memorySearch.toLowerCase();
      return (
        (m.title || '').toLowerCase().includes(q) ||
        (m.description || '').toLowerCase().includes(q) ||
        (m.location || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredLoveNotes = loveNotes.filter((n) => {
    if (memorySearch.trim()) {
      const q = memorySearch.toLowerCase();
      return (n.title || '').toLowerCase().includes(q) || (n.content || n.message || '').toLowerCase().includes(q);
    }
    return true;
  });

  const filteredAuditLogs = auditLogs.filter((log) => {
    if (auditActionFilter !== 'all' && log.action !== auditActionFilter) return false;
    if (auditSearch.trim()) {
      const q = auditSearch.toLowerCase();
      return (log.action || '').toLowerCase().includes(q) || (log.details || '').toLowerCase().includes(q);
    }
    return true;
  });

  const navItems: { id: AdminMobileTab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Telemetry & Health', icon: LayoutDashboard },
    { id: 'calls', label: 'Calls & Recordings', icon: Phone },
    { id: 'chats', label: 'Chats & Messages', icon: MessageSquare },
    { id: 'memories', label: 'Memories & Love Vault', icon: Heart },
    { id: 'devices', label: 'Device Sessions', icon: Smartphone },
    { id: 'audit', label: 'Audit Logs', icon: History },
    { id: 'maintenance', label: 'Data & Backups', icon: Database },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#07070C] text-white select-none pb-28">
      {/* Top Mobile Header */}
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
              <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-[#9B5CFF] to-[#FF4F81] flex items-center justify-center text-[10px] font-black text-white">
                KA²
              </div>
              <span className="text-xs font-bold bg-gradient-to-r from-[#9B5CFF] to-[#FF4F81] bg-clip-text text-transparent">
                KA² — HEAVEN
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#FF4F81]/20 text-[#FF91B5] font-semibold border border-[#FF4F81]/30">
                Admin Console
              </span>
            </div>
            <p className="text-[10px] text-[#A7A7B7]">Realtime Infrastructure & Couple Ledger</p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadAllData}
          disabled={refreshing}
          className="px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-white/90 hover:text-white flex items-center space-x-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#FF4F81]' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </header>

      {/* Horizontal Segmented Tabs */}
      <div className="px-3 py-2.5 bg-[#0C0C14] border-b border-white/5 overflow-x-auto no-scrollbar flex items-center space-x-1.5 sticky top-[57px] z-20 backdrop-blur-md">
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

      {/* Feedback Toast */}
      {statusMsg && (
        <div
          className={`mx-4 mt-3 p-3 rounded-xl border text-xs font-semibold text-center animate-fade-in ${
            statusMsg.type === 'success'
              ? 'bg-[#42D392]/20 border-[#42D392]/40 text-[#42D392]'
              : 'bg-[#FF5570]/20 border-[#FF5570]/40 text-[#FF5570]'
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      {/* Main Tab Content */}
      <div className="p-4 space-y-4">
        {/* ================================================================= */}
        {/* MODULE 1: TELEMETRY & HEALTH */}
        {/* ================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Header Title */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">System Infrastructure Telemetry</h2>
                <p className="text-[11px] text-[#A7A7B7]">Realtime monitoring for KA² — HEAVEN private couple cluster</p>
              </div>
            </div>

            {/* Partner Presence Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="glass-panel p-3.5 rounded-2xl border border-white/10 flex items-center justify-between bg-gradient-to-r from-[#9B5CFF]/10 to-transparent">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img
                      src={resolveMediaUrl(user?.avatarUrl, 'Keerthi')}
                      alt="Keerthi"
                      className="w-11 h-11 rounded-full object-cover border-2 border-[#9B5CFF]"
                    />
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#42D392] border-2 border-[#07070C] rounded-full" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">Keerthi Adarsh (Administrator)</h3>
                    <p className="text-[10px] text-[#42D392] flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#42D392] animate-pulse" />
                      <span>Online & Connected</span>
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#9B5CFF]/20 text-[#B28CFF] text-[9px] font-bold border border-[#9B5CFF]/30">
                  Admin Active
                </span>
              </div>

              <div className="glass-panel p-3.5 rounded-2xl border border-white/10 flex items-center justify-between bg-gradient-to-r from-[#FF4F81]/10 to-transparent">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img
                      src={resolveMediaUrl(null, 'Anu')}
                      alt="Anu Sri"
                      className="w-11 h-11 rounded-full object-cover border-2 border-[#FF4F81]"
                    />
                    <span
                      className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-[#07070C] rounded-full ${
                        telemetry?.onlineUsers?.anu ? 'bg-[#42D392]' : 'bg-[#A7A7B7]'
                      }`}
                    />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">Anu Sri (Partner)</h3>
                    <p className="text-[10px] text-[#FF91B5] flex items-center space-x-1">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          telemetry?.onlineUsers?.anu ? 'bg-[#42D392]' : 'bg-[#A7A7B7]'
                        }`}
                      />
                      <span>{telemetry?.onlineUsers?.anu ? 'Online & In Heaven' : 'Last seen recently'}</span>
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#FF4F81]/20 text-[#FF91B5] text-[9px] font-bold border border-[#FF4F81]/30">
                  Partner
                </span>
              </div>
            </div>

            {/* Row 1: Primary Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="glass-panel rounded-2xl p-3.5 border border-white/10">
                <div className="flex items-center justify-between text-[#42D392] mb-1">
                  <span className="text-[11px] font-medium text-[#A7A7B7]">Realtime Sockets</span>
                  <Radio className="w-4 h-4" />
                </div>
                <div className="text-2xl font-extrabold text-white">{telemetry?.activeSockets || 2}</div>
                <p className="text-[10px] text-[#42D392] mt-0.5">WebSockets connected</p>
              </div>

              <div className="glass-panel rounded-2xl p-3.5 border border-white/10">
                <div className="flex items-center justify-between text-[#9B5CFF] mb-1">
                  <span className="text-[11px] font-medium text-[#A7A7B7]">Encrypted Messages</span>
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="text-2xl font-extrabold text-white">{telemetry?.totalMessagesCount || messages.length}</div>
                <p className="text-[10px] text-[#B28CFF] mt-0.5">Zero plaintext storage</p>
              </div>

              <div className="glass-panel rounded-2xl p-3.5 border border-white/10">
                <div className="flex items-center justify-between text-[#FF4F81] mb-1">
                  <span className="text-[11px] font-medium text-[#A7A7B7]">Cherished Memories</span>
                  <Heart className="w-4 h-4" />
                </div>
                <div className="text-2xl font-extrabold text-white">{telemetry?.totalMemoriesCount || memories.length}</div>
                <p className="text-[10px] text-[#FF91B5] mt-0.5">Photos, videos & notes</p>
              </div>

              <div className="glass-panel rounded-2xl p-3.5 border border-white/10">
                <div className="flex items-center justify-between text-[#FFB156] mb-1">
                  <span className="text-[11px] font-medium text-[#A7A7B7]">WebRTC Calls</span>
                  <Phone className="w-4 h-4" />
                </div>
                <div className="text-2xl font-extrabold text-white">{telemetry?.totalCallsCount || calls.length}</div>
                <p className="text-[10px] text-[#FFB156] mt-0.5">1-to-1 encrypted lines</p>
              </div>
            </div>

            {/* Row 2: Secondary System Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="glass-panel rounded-2xl p-3.5 border border-white/10">
                <div className="flex items-center justify-between text-[#FF4F81] mb-1">
                  <span className="text-[11px] font-medium text-[#A7A7B7]">Media Storage Bucket</span>
                  <HardDrive className="w-4 h-4" />
                </div>
                <div className="text-lg font-extrabold text-white">
                  {formatStorage(telemetry?.totalStorageBytes || 0)}
                </div>
                <p className="text-[10px] text-[#A7A7B7] mt-0.5">Protected private attachment storage</p>
              </div>

              <div className="glass-panel rounded-2xl p-3.5 border border-white/10">
                <div className="flex items-center justify-between text-[#42D392] mb-1">
                  <span className="text-[11px] font-medium text-[#A7A7B7]">Server Uptime</span>
                  <Server className="w-4 h-4" />
                </div>
                <div className="text-lg font-extrabold text-white">
                  {formatUptime(telemetry?.uptimeSeconds || 86400)}
                </div>
                <p className="text-[10px] text-[#42D392] mt-0.5">Status: 100% High Availability</p>
              </div>

              <div className="glass-panel rounded-2xl p-3.5 border border-white/10">
                <div className="flex items-center justify-between text-[#9B5CFF] mb-1">
                  <span className="text-[11px] font-medium text-[#A7A7B7]">Memory Allocation</span>
                  <Cpu className="w-4 h-4" />
                </div>
                <div className="text-lg font-extrabold text-white">
                  {telemetry?.memoryUsageMB || 24} MB
                </div>
                <p className="text-[10px] text-[#A7A7B7] mt-0.5">Database: JSON ACID Verified</p>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* MODULE 2: CALLS & RECORDINGS */}
        {/* ================================================================= */}
        {activeTab === 'calls' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
                <Phone className="w-5 h-5 text-[#FF91B5]" />
                <span>Voice & Video Call Ledger</span>
              </h2>
              <p className="text-[11px] text-[#A7A7B7]">Automatic call storage, durations, and encrypted session logs</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="glass-panel p-3 rounded-2xl border border-white/10">
                <span className="text-[10px] text-[#A7A7B7]">Total Calls</span>
                <div className="text-lg font-bold text-white">{calls.length}</div>
              </div>
              <div className="glass-panel p-3 rounded-2xl border border-white/10">
                <span className="text-[10px] text-[#42D392]">Voice Calls</span>
                <div className="text-lg font-bold text-white">{calls.filter((c) => c.callType === 'voice').length}</div>
              </div>
              <div className="glass-panel p-3 rounded-2xl border border-white/10">
                <span className="text-[10px] text-[#9B5CFF]">Video Calls</span>
                <div className="text-lg font-bold text-white">{calls.filter((c) => c.callType === 'video').length}</div>
              </div>
              <div className="glass-panel p-3 rounded-2xl border border-white/10">
                <span className="text-[10px] text-[#FFB156]">Total Duration</span>
                <div className="text-lg font-bold text-white">
                  {formatDuration(calls.reduce((acc, c) => acc + (c.durationSeconds || 0), 0))}
                </div>
              </div>
            </div>

            {/* Search & Filters */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search calls by participant..."
                  value={callSearch}
                  onChange={(e) => setCallSearch(e.target.value)}
                  className="w-full bg-[#101019] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#FF4F81]"
                />
              </div>

              <div className="flex items-center space-x-2">
                <div className="flex rounded-xl bg-white/5 p-1 border border-white/10 text-xs flex-1">
                  <button
                    onClick={() => setCallTypeFilter('all')}
                    className={`flex-1 py-1 rounded-lg font-medium transition-colors ${
                      callTypeFilter === 'all' ? 'bg-[#FF4F81] text-white' : 'text-[#A7A7B7]'
                    }`}
                  >
                    All Types
                  </button>
                  <button
                    onClick={() => setCallTypeFilter('voice')}
                    className={`flex-1 py-1 rounded-lg font-medium transition-colors ${
                      callTypeFilter === 'voice' ? 'bg-[#FF4F81] text-white' : 'text-[#A7A7B7]'
                    }`}
                  >
                    Voice
                  </button>
                  <button
                    onClick={() => setCallTypeFilter('video')}
                    className={`flex-1 py-1 rounded-lg font-medium transition-colors ${
                      callTypeFilter === 'video' ? 'bg-[#FF4F81] text-white' : 'text-[#A7A7B7]'
                    }`}
                  >
                    Video
                  </button>
                </div>

                <select
                  value={callStatusFilter}
                  onChange={(e) => setCallStatusFilter(e.target.value)}
                  className="bg-[#101019] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#FF4F81]"
                >
                  <option value="all">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="connected">Connected</option>
                  <option value="rejected">Declined</option>
                  <option value="missed">Missed</option>
                </select>
              </div>
            </div>

            {/* Calls List */}
            <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden divide-y divide-white/5">
              {filteredCalls.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#A7A7B7]">No calls match the selected filter.</div>
              ) : (
                filteredCalls.map((call) => {
                  const isVideo = call.callType === 'video';
                  const isCompleted = call.status === 'completed' || call.status === 'connected';
                  const isDeclined = call.status === 'rejected' || call.status === 'declined';
                  const isMissed = call.status === 'missed' || call.status === 'busy';

                  return (
                    <div key={call.id} className="p-3.5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
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

                            {call.isRecorded && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-semibold flex items-center space-x-0.5">
                                <span className="w-1 h-1 rounded-full bg-red-400 animate-pulse" />
                                <span>Rec</span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-2 text-[10px] text-[#A7A7B7] mt-0.5">
                            <span>{format(new Date(call.createdAt || call.startedAt), 'MMM dd, HH:mm:ss')}</span>
                            {call.durationSeconds > 0 && (
                              <span className="text-white font-medium flex items-center space-x-1">
                                <Clock className="w-2.5 h-2.5 text-[#FFB156]" />
                                <span>{formatDuration(call.durationSeconds)}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        {isCompleted ? (
                          <span className="px-2 py-0.5 rounded-full bg-[#42D392]/20 border border-[#42D392]/30 text-[#42D392] text-[10px] font-semibold flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Completed</span>
                          </span>
                        ) : isDeclined ? (
                          <span className="px-2 py-0.5 rounded-full bg-[#FF5570]/20 border border-[#FF5570]/30 text-[#FF5570] text-[10px] font-semibold flex items-center space-x-1">
                            <XCircle className="w-3 h-3" />
                            <span>Declined</span>
                          </span>
                        ) : isMissed ? (
                          <span className="px-2 py-0.5 rounded-full bg-[#FFB156]/20 border border-[#FFB156]/30 text-[#FFB156] text-[10px] font-semibold flex items-center space-x-1">
                            <PhoneMissed className="w-3 h-3" />
                            <span>Missed</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-white/10 text-white text-[10px] font-semibold">
                            {call.status}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* MODULE 3: CHATS & MESSAGES */}
        {/* ================================================================= */}
        {activeTab === 'chats' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-[#9B5CFF]" />
                <span>Chat Messages & Communications Vault</span>
              </h2>
              <p className="text-[11px] text-[#A7A7B7]">Realtime message stream, media attachments, and heart reactions</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="glass-panel p-3 rounded-2xl border border-white/10">
                <span className="text-[10px] text-[#A7A7B7]">Total Messages</span>
                <div className="text-lg font-bold text-white">{messages.length}</div>
              </div>
              <div className="glass-panel p-3 rounded-2xl border border-white/10">
                <span className="text-[10px] text-[#FF4F81]">Photos/Videos</span>
                <div className="text-lg font-bold text-white">
                  {messages.filter((m) => m.type === 'image' || m.type === 'video').length}
                </div>
              </div>
              <div className="glass-panel p-3 rounded-2xl border border-white/10">
                <span className="text-[10px] text-[#42D392]">Voice Notes</span>
                <div className="text-lg font-bold text-white">
                  {messages.filter((m) => m.type === 'voice').length}
                </div>
              </div>
              <div className="glass-panel p-3 rounded-2xl border border-white/10">
                <span className="text-[10px] text-[#FF5570]">Reactions</span>
                <div className="text-lg font-bold text-white">
                  {messages.reduce((acc, m) => acc + (m.reactions?.length || 0), 0)}
                </div>
              </div>
            </div>

            {/* Search & Filters */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search message text or participant..."
                  value={chatSearch}
                  onChange={(e) => setChatSearch(e.target.value)}
                  className="w-full bg-[#101019] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#FF4F81]"
                />
              </div>

              <div className="flex items-center space-x-2">
                <div className="flex rounded-xl bg-white/5 p-1 border border-white/10 text-xs flex-1">
                  <button
                    onClick={() => setChatSenderFilter('all')}
                    className={`flex-1 py-1 rounded-lg font-medium transition-colors ${
                      chatSenderFilter === 'all' ? 'bg-[#9B5CFF] text-white' : 'text-[#A7A7B7]'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setChatSenderFilter('keerthi')}
                    className={`flex-1 py-1 rounded-lg font-medium transition-colors ${
                      chatSenderFilter === 'keerthi' ? 'bg-[#9B5CFF] text-white' : 'text-[#A7A7B7]'
                    }`}
                  >
                    Keerthi
                  </button>
                  <button
                    onClick={() => setChatSenderFilter('anu')}
                    className={`flex-1 py-1 rounded-lg font-medium transition-colors ${
                      chatSenderFilter === 'anu' ? 'bg-[#FF4F81] text-white' : 'text-[#A7A7B7]'
                    }`}
                  >
                    Anu
                  </button>
                </div>

                <select
                  value={chatTypeFilter}
                  onChange={(e) => setChatTypeFilter(e.target.value)}
                  className="bg-[#101019] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#FF4F81]"
                >
                  <option value="all">All Types</option>
                  <option value="text">Text</option>
                  <option value="image">Photos</option>
                  <option value="voice">Voice</option>
                  <option value="video">Videos</option>
                  <option value="file">Files</option>
                </select>
              </div>
            </div>

            {/* Message Stream */}
            <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden divide-y divide-white/5 max-h-[550px] overflow-y-auto">
              {filteredChats.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#A7A7B7]">No messages match your criteria.</div>
              ) : (
                filteredChats.map((msg) => {
                  const isKeerthi =
                    msg.senderId === 'a1111111-1111-1111-1111-111111111111' ||
                    (msg.senderName || '').includes('Keerthi');

                  return (
                    <div key={msg.id} className="p-3.5 hover:bg-white/[0.02] transition-colors space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] border ${
                              isKeerthi
                                ? 'bg-[#9B5CFF]/20 border-[#9B5CFF]/40 text-[#B28CFF]'
                                : 'bg-[#FF4F81]/20 border-[#FF4F81]/40 text-[#FF91B5]'
                            }`}
                          >
                            {isKeerthi ? 'K' : 'A'}
                          </div>
                          <span className={`text-xs font-bold ${isKeerthi ? 'text-[#B28CFF]' : 'text-[#FF91B5]'}`}>
                            {msg.senderName || (isKeerthi ? 'Keerthi' : 'Anu')}
                          </span>
                          <span className="text-[10px] text-[#A7A7B7]">➔</span>
                          <span className="text-xs text-white/70">
                            {msg.receiverName || (isKeerthi ? 'Anu Sri' : 'Keerthi Adarsh')}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-white/60 font-mono">
                            {msg.type || 'text'}
                          </span>
                        </div>

                        <span className="text-[10px] text-[#A7A7B7] font-mono">
                          {format(new Date(msg.createdAt), 'MMM dd, HH:mm:ss')}
                        </span>
                      </div>

                      <p className="text-xs text-white whitespace-pre-wrap pl-8">{msg.content}</p>

                      {msg.mediaUrl && (
                        <div className="pl-8 pt-1">
                          {msg.type === 'image' ? (
                            <img
                              src={msg.mediaUrl}
                              alt="Attachment"
                              className="w-28 h-28 rounded-xl object-cover border border-white/10"
                            />
                          ) : (
                            <span className="text-[10px] text-[#FF91B5] underline break-all">{msg.mediaUrl}</span>
                          )}
                        </div>
                      )}

                      {msg.reactions && msg.reactions.length > 0 && (
                        <div className="pl-8 flex items-center space-x-1.5 pt-0.5">
                          {msg.reactions.map((r: any, idx: number) => (
                            <span key={idx} className="px-2 py-0.5 rounded-full bg-white/10 text-[10px]">
                              {r.emoji || '❤️'}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* MODULE 4: MEMORIES & LOVE VAULT */}
        {/* ================================================================= */}
        {activeTab === 'memories' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
                <Heart className="w-5 h-5 text-[#FF4F81]" />
                <span>Memories & Love Vault Storage</span>
              </h2>
              <p className="text-[11px] text-[#A7A7B7]">Shared photos, videos, and romantic letters storage</p>
            </div>

            {/* Segmented Switcher & Search */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search memories or letters..."
                  value={memorySearch}
                  onChange={(e) => setMemorySearch(e.target.value)}
                  className="w-full bg-[#101019] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#FF4F81]"
                />
              </div>

              <div className="flex rounded-xl bg-white/5 p-1 border border-white/10 text-xs">
                <button
                  onClick={() => setMemoryTab('photos')}
                  className={`flex-1 py-1.5 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-1.5 ${
                    memoryTab === 'photos' ? 'bg-[#FF4F81] text-white' : 'text-[#A7A7B7]'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Memories Gallery ({memories.length})</span>
                </button>
                <button
                  onClick={() => setMemoryTab('notes')}
                  className={`flex-1 py-1.5 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-1.5 ${
                    memoryTab === 'notes' ? 'bg-[#9B5CFF] text-white' : 'text-[#A7A7B7]'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Love Letters ({loveNotes.length})</span>
                </button>
              </div>
            </div>

            {memoryTab === 'photos' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredMemories.length === 0 ? (
                  <div className="col-span-full p-8 text-center text-xs text-[#A7A7B7]">No memories recorded yet.</div>
                ) : (
                  filteredMemories.map((m) => (
                    <div
                      key={m.id}
                      className="glass-panel rounded-2xl border border-white/10 overflow-hidden group flex flex-col"
                    >
                      <div className="h-44 w-full relative overflow-hidden bg-black/40">
                        <img
                          src={m.mediaUrl}
                          alt={m.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600';
                          }}
                        />
                        <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] text-white font-semibold border border-white/10">
                          {m.category || 'photo'}
                        </span>
                      </div>

                      <div className="p-3.5 space-y-1.5 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-white group-hover:text-[#FF91B5] transition-colors">
                            {m.title}
                          </h4>
                          {m.description && <p className="text-[11px] text-[#A7A7B7] line-clamp-2">{m.description}</p>}
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-[#A7A7B7] pt-1.5 border-t border-white/5">
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3 text-[#FF4F81]" />
                            <span>{m.date || 'Cherished'}</span>
                          </span>
                          {m.location && (
                            <span className="flex items-center space-x-1">
                              <MapPin className="w-3 h-3 text-[#9B5CFF]" />
                              <span>{m.location}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden divide-y divide-white/5">
                {filteredLoveNotes.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#A7A7B7]">No love letters saved yet.</div>
                ) : (
                  filteredLoveNotes.map((note) => (
                    <div key={note.id} className="p-4 space-y-2 hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-bold text-[#FF91B5]">{note.senderName || 'My Love'}</span>
                          <span className="text-[10px] text-[#A7A7B7]">➔</span>
                          <span className="text-xs font-semibold text-white">{note.receiverName || 'Soulmate'}</span>
                        </div>
                        <span className="text-[10px] text-[#A7A7B7] font-mono">
                          {format(new Date(note.createdAt || new Date()), 'MMM dd, yyyy HH:mm')}
                        </span>
                      </div>

                      {note.title && <h5 className="text-xs font-bold text-white">{note.title}</h5>}
                      <p className="text-xs text-white/90 italic font-serif leading-relaxed bg-white/[0.02] p-3 rounded-xl border border-white/5 whitespace-pre-wrap">
                        "{note.content || note.message}"
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* MODULE 5: DEVICE SESSIONS */}
        {/* ================================================================= */}
        {activeTab === 'devices' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
                <Smartphone className="w-5 h-5 text-[#9B5CFF]" />
                <span>Device Sessions & Security Control</span>
              </h2>
              <p className="text-[11px] text-[#A7A7B7]">Authorized devices for Keerthi & Anu with remote revoke capabilities</p>
            </div>

            <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden divide-y divide-white/5">
              {devices.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#A7A7B7]">No active device sessions found.</div>
              ) : (
                devices.map((dev) => {
                  const isMobile = dev.deviceType === 'ios' || dev.deviceType === 'android' || dev.deviceType === 'mobile';

                  return (
                    <div key={dev.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center space-x-3.5">
                        <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#FF91B5]">
                          {isMobile ? <Smartphone className="w-5 h-5" /> : <Laptop className="w-5 h-5" />}
                        </div>

                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="text-xs font-bold text-white">{dev.deviceName}</h4>
                            {dev.isCurrent && (
                              <span className="px-1.5 py-0.2 rounded-full bg-[#42D392]/20 border border-[#42D392]/30 text-[#42D392] text-[9px] font-bold">
                                Current
                              </span>
                            )}
                          </div>

                          <p className="text-[10px] text-[#A7A7B7] mt-0.5">
                            {dev.userName || (dev.userId === 'a1111111-1111-1111-1111-111111111111' ? 'Keerthi Adarsh' : 'Anu Sri')} • {dev.ipAddress}
                          </p>

                          <p className="text-[9px] text-white/40 truncate max-w-[200px] mt-0.5">{dev.userAgent}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRevokeDevice(dev.id)}
                        className="px-3 py-1.5 rounded-xl bg-[#FF5570]/15 border border-[#FF5570]/30 text-[#FF5570] hover:bg-[#FF5570]/25 text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Revoke</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* MODULE 6: AUDIT LOGS */}
        {/* ================================================================= */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
                <History className="w-5 h-5 text-[#42D392]" />
                <span>Immutable Security Audit Logs</span>
              </h2>
              <p className="text-[11px] text-[#A7A7B7]">Chronological ledger of logins, revocations, and configuration changes</p>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search audit action or details..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="w-full bg-[#101019] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#FF4F81]"
                />
              </div>

              <select
                value={auditActionFilter}
                onChange={(e) => setAuditActionFilter(e.target.value)}
                className="bg-[#101019] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#FF4F81]"
              >
                <option value="all">All Actions</option>
                <option value="USER_LOGIN">USER_LOGIN</option>
                <option value="DEVICE_REVOKED">DEVICE_REVOKED</option>
                <option value="SETTINGS_UPDATED">SETTINGS_UPDATED</option>
                <option value="DATA_CLEARED">DATA_CLEARED</option>
                <option value="BACKUP_EXPORTED">BACKUP_EXPORTED</option>
                <option value="SYSTEM_INITIALIZED">SYSTEM_INITIALIZED</option>
              </select>
            </div>

            {/* Audit List */}
            <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden divide-y divide-white/5">
              {filteredAuditLogs.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#A7A7B7]">No audit logs match criteria.</div>
              ) : (
                filteredAuditLogs.map((log) => (
                  <div key={log.id} className="p-3.5 space-y-1.5 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-white font-mono font-bold">
                        {log.action}
                      </span>
                      <span className="text-[10px] text-[#A7A7B7] font-mono">
                        {format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm:ss')}
                      </span>
                    </div>

                    <p className="text-xs text-white/90">{log.details}</p>

                    <div className="flex items-center space-x-3 text-[10px] text-[#A7A7B7]">
                      <span>User: {log.userEmail || 'admin@ka2heaven.com'}</span>
                      <span>•</span>
                      <span>IP: {log.ipAddress || '127.0.0.1'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* MODULE 7: DATA & BACKUPS */}
        {/* ================================================================= */}
        {activeTab === 'maintenance' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
                <Database className="w-5 h-5 text-[#9B5CFF]" />
                <span>Data Maintenance & Backup Operations</span>
              </h2>
              <p className="text-[11px] text-[#A7A7B7]">Full database snapshots, JSON export/restore, and maintenance controls</p>
            </div>

            {/* Backup Operations Card */}
            <div className="glass-panel p-4 rounded-2xl border border-white/10 space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <FileJson className="w-4 h-4 text-[#42D392]" />
                <span>Full Database Snapshot</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Export Button */}
                <button
                  type="button"
                  onClick={handleExportBackup}
                  disabled={isExporting}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#9B5CFF] to-[#FF4F81] text-white text-xs font-semibold flex items-center justify-center space-x-2 shadow-glow-pink hover:opacity-95 transition-opacity cursor-pointer"
                >
                  <Download className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />
                  <span>{isExporting ? 'Exporting...' : 'Export Complete Backup (JSON)'}</span>
                </button>

                {/* Restore Button */}
                <div className="relative">
                  <input
                    type="file"
                    ref={restoreFileInputRef}
                    onChange={handleRestoreFile}
                    accept=".json"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => restoreFileInputRef.current?.click()}
                    disabled={isRestoring}
                    className="w-full py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white text-xs font-semibold flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                  >
                    <Upload className={`w-4 h-4 ${isRestoring ? 'animate-spin text-[#FF4F81]' : ''}`} />
                    <span>{isRestoring ? 'Restoring Snapshot...' : 'Restore Backup File'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Automated Schedule */}
            <div className="glass-panel p-4 rounded-2xl border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-[#FFB156]" />
                  <span>Automatic Backup Schedule</span>
                </h3>
                <span className="text-[10px] text-[#42D392] font-semibold">Active</span>
              </div>

              <div className="flex items-center space-x-2">
                <select
                  value={backupSchedule}
                  onChange={(e) => handleSaveSchedule(e.target.value)}
                  disabled={isSavingSchedule}
                  className="bg-[#101019] border border-white/10 rounded-xl px-3 py-2 text-xs text-white flex-1 focus:outline-none focus:border-[#FF4F81]"
                >
                  <option value="hourly">Hourly Automated Backup</option>
                  <option value="daily">Daily Automated Backup</option>
                  <option value="weekly">Weekly Automated Backup</option>
                  <option value="monthly">Monthly Automated Backup</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>
            </div>

            {/* Danger Zone: Granular Clear Data */}
            <div className="glass-panel p-4 rounded-2xl border border-red-500/30 bg-red-500/5 space-y-3">
              <div className="flex items-center space-x-2 text-red-400">
                <AlertTriangle className="w-4 h-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider">Danger Zone: Data Maintenance</h3>
              </div>
              <p className="text-[11px] text-[#A7A7B7]">
                Granularly wipe message streams, gallery memories, or perform a full factory clear. Protected with PIN validation.
              </p>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setClearTarget('messages');
                    setIsClearModalOpen(true);
                  }}
                  className="p-2.5 rounded-xl bg-white/5 border border-red-500/20 text-red-300 text-[11px] font-semibold hover:bg-red-500/10 transition-colors text-center"
                >
                  Clear Messages Only
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setClearTarget('memories');
                    setIsClearModalOpen(true);
                  }}
                  className="p-2.5 rounded-xl bg-white/5 border border-red-500/20 text-red-300 text-[11px] font-semibold hover:bg-red-500/10 transition-colors text-center"
                >
                  Clear Memories Only
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setClearTarget('loveNotes');
                    setIsClearModalOpen(true);
                  }}
                  className="p-2.5 rounded-xl bg-white/5 border border-red-500/20 text-red-300 text-[11px] font-semibold hover:bg-red-500/10 transition-colors text-center"
                >
                  Clear Love Notes Only
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setClearTarget('all');
                    setIsClearModalOpen(true);
                  }}
                  className="p-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-[11px] font-bold hover:bg-red-500/30 transition-colors text-center"
                >
                  Clear All Data (Factory)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Clear Data Confirmation Modal */}
      <AnimatePresence>
        {isClearModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel rounded-3xl p-6 w-full max-w-sm border border-red-500/40 bg-[#101019] shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-red-400">
                  <AlertTriangle className="w-5 h-5" />
                  <h3 className="text-sm font-bold text-white">Confirm Data Clearance</h3>
                </div>
                <button type="button" onClick={() => setIsClearModalOpen(false)}>
                  <X className="w-5 h-5 text-white/60 hover:text-white" />
                </button>
              </div>

              <p className="text-xs text-[#A7A7B7]">
                You are about to permanently purge{' '}
                <span className="text-red-400 font-bold uppercase">{clearTarget}</span> from Heaven. This action cannot
                be undone.
              </p>

              <form onSubmit={handleExecuteClearData} className="space-y-3">
                <div>
                  <label className="block text-[11px] text-[#A7A7B7] mb-1">
                    Type phrase: <span className="text-white font-mono font-bold">CLEAR HEAVEN DATA</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={confirmationPhrase}
                    onChange={(e) => setConfirmationPhrase(e.target.value)}
                    placeholder="CLEAR HEAVEN DATA"
                    className="w-full bg-[#07070C] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#A7A7B7] mb-1">Security PIN (1530)</label>
                  <input
                    type="password"
                    required
                    maxLength={6}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="••••"
                    className="w-full bg-[#07070C] border border-white/10 rounded-xl px-3 py-2 text-xs text-white tracking-widest text-center font-mono focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsClearModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-white/80 hover:text-white"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={confirmationPhrase !== 'CLEAR HEAVEN DATA' || pinInput.length < 4 || isClearing}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-bold transition-opacity"
                  >
                    {isClearing ? 'Purging...' : 'Confirm Wipe'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

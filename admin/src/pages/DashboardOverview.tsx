import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/adminApi';
import { AdminTelemetry } from '@ka2/shared';
import {
  Activity,
  Users,
  HardDrive,
  MessageSquare,
  Heart,
  Lock,
  Cpu,
  Server,
  ShieldCheck,
  Radio,
  RefreshCw,
  Phone,
} from 'lucide-react';

export const DashboardOverview: React.FC = () => {
  const [telemetry, setTelemetry] = useState<AdminTelemetry | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTelemetry = async () => {
    try {
      setRefreshing(true);
      const data = await adminApi.getTelemetry();
      setTelemetry(data);
    } catch (err) {
      console.error('Failed to load telemetry:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 8000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${d > 0 ? `${d}d ` : ''}${h}h ${m}m ${s}s`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading || !telemetry) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#FF4F81] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">System Infrastructure Telemetry</h1>
          <p className="text-sm text-[#A7A7B7]">
            Realtime monitoring for KA² — HEAVEN private couple cluster
          </p>
        </div>

        <button
          onClick={fetchTelemetry}
          disabled={refreshing}
          className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold text-white flex items-center space-x-2 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Online Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Keerthi Presence */}
        <div className="glass-panel rounded-2xl p-5 border border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"
                alt="Keerthi"
                className="w-12 h-12 rounded-full object-cover border-2 border-[#9B5CFF]"
              />
              <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#07070C] ${
                telemetry.onlineUsers.keerthi ? 'bg-[#42D392]' : 'bg-white/40'
              }`} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Keerthi Adarsh (Administrator)</h3>
              <p className="text-xs text-[#A7A7B7]">
                {telemetry.onlineUsers.keerthi ? '🟢 Online & Connected' : '⚪ Last seen recently'}
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-[#9B5CFF]/20 text-[#B28CFF] text-xs font-semibold border border-[#9B5CFF]/40">
            Admin Active
          </span>
        </div>

        {/* Anu Presence */}
        <div className="glass-panel rounded-2xl p-5 border border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100"
                alt="Anu"
                className="w-12 h-12 rounded-full object-cover border-2 border-[#FF4F81]"
              />
              <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#07070C] ${
                telemetry.onlineUsers.anu ? 'bg-[#42D392]' : 'bg-white/40'
              }`} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Anu Sri (Partner)</h3>
              <p className="text-xs text-[#A7A7B7]">
                {telemetry.onlineUsers.anu ? '🟢 Online & In Heaven' : '⚪ Last seen recently'}
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-[#FF4F81]/20 text-[#FF91B5] text-xs font-semibold border border-[#FF4F81]/40">
            Partner
          </span>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Sockets & Presence */}
        <div className="glass-panel rounded-2xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#A7A7B7]">Realtime Sockets</span>
            <Radio className="w-4 h-4 text-[#42D392]" />
          </div>
          <div className="text-2xl font-extrabold text-white">{telemetry.activeSockets}</div>
          <p className="text-[11px] text-[#42D392] mt-1">WebSockets connected</p>
        </div>

        {/* Total Encrypted Messages */}
        <div className="glass-panel rounded-2xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#A7A7B7]">Encrypted Messages</span>
            <MessageSquare className="w-4 h-4 text-[#9B5CFF]" />
          </div>
          <div className="text-2xl font-extrabold text-white">{telemetry.totalMessagesCount}</div>
          <p className="text-[11px] text-[#B28CFF] mt-1">Zero plaintext storage</p>
        </div>

        {/* Memories Saved */}
        <div className="glass-panel rounded-2xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#A7A7B7]">Cherished Memories</span>
            <Heart className="w-4 h-4 text-[#FF4F81]" />
          </div>
          <div className="text-2xl font-extrabold text-white">{telemetry.totalMemoriesCount}</div>
          <p className="text-[11px] text-[#FF91B5] mt-1">Photos, videos & notes</p>
        </div>

        {/* WebRTC Calls */}
        <div className="glass-panel rounded-2xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#A7A7B7]">WebRTC Calls</span>
            <Phone className="w-4 h-4 text-[#FFB156]" />
          </div>
          <div className="text-2xl font-extrabold text-white">{telemetry.activeCallsCount || 0}</div>
          <p className="text-[11px] text-[#FFB156] mt-1">1-to-1 encrypted lines</p>
        </div>
      </div>

      {/* Secondary Hardware & System Health Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Storage Health */}
        <div className="glass-panel rounded-2xl p-5 border border-white/10">
          <div className="flex items-center space-x-2.5 mb-3">
            <HardDrive className="w-5 h-5 text-[#FF91B5]" />
            <h3 className="text-sm font-bold text-white">Media Storage Bucket</h3>
          </div>
          <div className="text-xl font-bold text-white mb-1">
            {formatBytes(telemetry.totalStorageBytes)}
          </div>
          <p className="text-xs text-[#A7A7B7]">Protected private attachment storage</p>
        </div>

        {/* Server Uptime */}
        <div className="glass-panel rounded-2xl p-5 border border-white/10">
          <div className="flex items-center space-x-2.5 mb-3">
            <Server className="w-5 h-5 text-[#42D392]" />
            <h3 className="text-sm font-bold text-white">Server Uptime</h3>
          </div>
          <div className="text-xl font-bold text-white mb-1 font-mono">
            {formatUptime(telemetry.uptimeSeconds)}
          </div>
          <p className="text-xs text-[#A7A7B7]">Status: 100% High Availability</p>
        </div>

        {/* Node.js Memory Heap */}
        <div className="glass-panel rounded-2xl p-5 border border-white/10">
          <div className="flex items-center space-x-2.5 mb-3">
            <Cpu className="w-5 h-5 text-[#9B5CFF]" />
            <h3 className="text-sm font-bold text-white">Memory Allocation</h3>
          </div>
          <div className="text-xl font-bold text-white mb-1 font-mono">
            {telemetry.memoryUsageMB} MB
          </div>
          <p className="text-xs text-[#A7A7B7]">Database: PostgreSQL / ACID Verified</p>
        </div>
      </div>
    </div>
  );
};

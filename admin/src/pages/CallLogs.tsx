import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/adminApi';
import { Phone, Video, Clock, CheckCircle2, XCircle, PhoneMissed, Search, Filter, RefreshCw, ShieldCheck, Radio } from 'lucide-react';
import { format } from 'date-fns';

export const CallLogs: React.FC = () => {
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'voice' | 'video'>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCalls = async () => {
    try {
      setRefreshing(true);
      const data = await adminApi.getCalls();
      setCalls(data);
    } catch (err) {
      console.error('Failed to load call logs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCalls();
  }, []);

  const formatDuration = (sec: number) => {
    if (!sec || sec <= 0) return '0s';
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (hrs > 0) return `${hrs}h ${mins}m ${s}s`;
    if (mins > 0) return `${mins}m ${s}s`;
    return `${s}s`;
  };

  const filteredCalls = calls.filter((c) => {
    if (filterType !== 'all' && c.callType !== filterType) return false;
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCaller = (c.callerName || '').toLowerCase().includes(q);
      const matchReceiver = (c.receiverName || '').toLowerCase().includes(q);
      const matchType = (c.callType || '').toLowerCase().includes(q);
      if (!matchCaller && !matchReceiver && !matchType) return false;
    }
    return true;
  });

  const totalVoice = calls.filter(c => c.callType === 'voice').length;
  const totalVideo = calls.filter(c => c.callType === 'video').length;
  const totalDurationSec = calls.reduce((acc, c) => acc + (c.durationSeconds || 0), 0);

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Phone className="w-6 h-6 text-[#FF91B5]" />
            <span>Voice & Video Call Ledger</span>
          </h1>
          <p className="text-sm text-[#A7A7B7]">
            Real-time automatic call storage, connection duration, and encrypted session ledger
          </p>
        </div>

        <button
          type="button"
          onClick={fetchCalls}
          disabled={refreshing}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white flex items-center space-x-2 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#FF4F81]' : 'text-white/60'}`} />
          <span>Refresh Calls</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#A7A7B7]">Total Calls Stored</span>
            <Radio className="w-4 h-4 text-[#FF4F81]" />
          </div>
          <div className="text-2xl font-extrabold text-white">{calls.length}</div>
          <p className="text-[11px] text-[#FF91B5] mt-1">Saved automatically</p>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#A7A7B7]">Voice Calls</span>
            <Phone className="w-4 h-4 text-[#42D392]" />
          </div>
          <div className="text-2xl font-extrabold text-white">{totalVoice}</div>
          <p className="text-[11px] text-[#42D392] mt-1">Direct audio streams</p>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#A7A7B7]">Video Calls</span>
            <Video className="w-4 h-4 text-[#9B5CFF]" />
          </div>
          <div className="text-2xl font-extrabold text-white">{totalVideo}</div>
          <p className="text-[11px] text-[#B28CFF] mt-1">HD video streams</p>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#A7A7B7]">Total Call Duration</span>
            <Clock className="w-4 h-4 text-[#FFB156]" />
          </div>
          <div className="text-2xl font-extrabold text-white">{formatDuration(totalDurationSec)}</div>
          <p className="text-[11px] text-[#FFB156] mt-1">Time in Heaven calls</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel rounded-2xl p-4 border border-white/10 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex items-center space-x-2 flex-1 relative">
          <Search className="w-4 h-4 text-white/40 absolute left-3" />
          <input
            type="text"
            placeholder="Search by participant or call type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#07070C] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#FF4F81]"
          />
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-2">
          {/* Call Type Filter */}
          <div className="flex rounded-xl bg-white/5 p-1 border border-white/10 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                filterType === 'all' ? 'bg-[#FF4F81] text-white' : 'text-[#A7A7B7] hover:text-white'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setFilterType('voice')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                filterType === 'voice' ? 'bg-[#FF4F81] text-white' : 'text-[#A7A7B7] hover:text-white'
              }`}
            >
              Voice
            </button>
            <button
              onClick={() => setFilterType('video')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                filterType === 'video' ? 'bg-[#FF4F81] text-white' : 'text-[#A7A7B7] hover:text-white'
              }`}
            >
              Video
            </button>
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#07070C] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#FF4F81]"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="connected">Connected</option>
            <option value="rejected">Declined</option>
            <option value="missed">Missed</option>
            <option value="busy">Busy</option>
          </select>
        </div>
      </div>

      {/* Call History Table / List */}
      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Call Sessions ({filteredCalls.length})
          </span>
          <span className="text-xs text-[#42D392] flex items-center space-x-1 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Encrypted WebRTC Channel</span>
          </span>
        </div>

        <div className="divide-y divide-white/5">
          {loading ? (
            <div className="p-8 text-center text-xs text-[#A7A7B7]">Loading call history...</div>
          ) : filteredCalls.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#A7A7B7]">No call records found.</div>
          ) : (
            filteredCalls.map((call) => {
              const isVideo = call.callType === 'video';
              const isCompleted = call.status === 'completed' || call.status === 'connected';
              const isDeclined = call.status === 'rejected' || call.status === 'declined';
              const isMissed = call.status === 'missed' || call.status === 'busy';

              return (
                <div
                  key={call.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-start sm:items-center space-x-3.5">
                    {/* Icon */}
                    <div
                      className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 ${
                        isVideo
                          ? 'bg-[#9B5CFF]/15 border-[#9B5CFF]/30 text-[#9B5CFF]'
                          : 'bg-[#FF4F81]/15 border-[#FF4F81]/30 text-[#FF91B5]'
                      }`}
                    >
                      {isVideo ? <Video className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
                    </div>

                    {/* Participants & Info */}
                    <div>
                      <div className="flex items-center space-x-2 flex-wrap gap-1">
                        <span className="text-sm font-bold text-white">{call.callerName}</span>
                        <span className="text-xs text-[#A7A7B7]">➔</span>
                        <span className="text-sm font-bold text-white">{call.receiverName}</span>

                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            isVideo
                              ? 'bg-[#9B5CFF]/20 text-[#B28CFF] border border-[#9B5CFF]/30'
                              : 'bg-[#FF4F81]/20 text-[#FF91B5] border border-[#FF4F81]/30'
                          }`}
                        >
                          {isVideo ? 'Video Call' : 'Voice Call'}
                        </span>

                        {call.isRecorded && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-semibold flex items-center space-x-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                            <span>Recorded</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-3 text-xs text-[#A7A7B7] mt-1 flex-wrap gap-1">
                        <span>
                          {format(new Date(call.createdAt || call.startedAt), 'MMM dd, yyyy • HH:mm:ss')}
                        </span>
                        {call.durationSeconds > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-white font-medium flex items-center space-x-1">
                              <Clock className="w-3 h-3 text-[#FFB156]" />
                              <span>{formatDuration(call.durationSeconds)}</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="self-end sm:self-center">
                    {isCompleted ? (
                      <span className="px-2.5 py-1 rounded-xl bg-[#42D392]/15 border border-[#42D392]/30 text-[#42D392] text-xs font-semibold flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Completed</span>
                      </span>
                    ) : isDeclined ? (
                      <span className="px-2.5 py-1 rounded-xl bg-[#FF5570]/15 border border-[#FF5570]/30 text-[#FF5570] text-xs font-semibold flex items-center space-x-1">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Declined</span>
                      </span>
                    ) : isMissed ? (
                      <span className="px-2.5 py-1 rounded-xl bg-[#FFB156]/15 border border-[#FFB156]/30 text-[#FFB156] text-xs font-semibold flex items-center space-x-1">
                        <PhoneMissed className="w-3.5 h-3.5" />
                        <span>Missed</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-xl bg-white/10 text-white text-xs font-semibold">
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
    </div>
  );
};

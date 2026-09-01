import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/adminApi';
import { MessageSquare, Image, Mic, FileText, Video, Search, RefreshCw, Heart, ShieldCheck, User } from 'lucide-react';
import { format } from 'date-fns';

export const ChatViewer: React.FC = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [senderFilter, setSenderFilter] = useState<'all' | 'keerthi' | 'anu'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const fetchChats = async () => {
    try {
      setRefreshing(true);
      const data = await adminApi.getChats();
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Failed to load chats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  const filteredMessages = messages.filter((m) => {
    if (senderFilter === 'keerthi') {
      const isKeerthi = m.senderId === 'a1111111-1111-1111-1111-111111111111' || (m.senderName || '').includes('Keerthi');
      if (!isKeerthi) return false;
    } else if (senderFilter === 'anu') {
      const isAnu = m.senderId === 'b2222222-2222-2222-2222-222222222222' || (m.senderName || '').includes('Anu');
      if (!isAnu) return false;
    }

    if (typeFilter !== 'all' && m.type !== typeFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchContent = (m.content || '').toLowerCase().includes(q);
      const matchSender = (m.senderName || '').toLowerCase().includes(q);
      if (!matchContent && !matchSender) return false;
    }
    return true;
  });

  const mediaCount = messages.filter(m => m.type === 'image' || m.type === 'video').length;
  const voiceCount = messages.filter(m => m.type === 'voice').length;
  const reactionsCount = messages.reduce((acc, m) => acc + (m.reactions?.length || 0), 0);

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <MessageSquare className="w-6 h-6 text-[#9B5CFF]" />
            <span>Chat Messages & Communications Vault</span>
          </h1>
          <p className="text-sm text-[#A7A7B7]">
            Entire real-time chat history, media attachments, and message reactions storage
          </p>
        </div>

        <button
          type="button"
          onClick={fetchChats}
          disabled={refreshing}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white flex items-center space-x-2 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#FF4F81]' : 'text-white/60'}`} />
          <span>Refresh Chats</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#A7A7B7]">Total Messages</span>
            <MessageSquare className="w-4 h-4 text-[#9B5CFF]" />
          </div>
          <div className="text-2xl font-extrabold text-white">{messages.length}</div>
          <p className="text-[11px] text-[#B28CFF] mt-1">Saved permanently</p>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#A7A7B7]">Photos & Videos</span>
            <Image className="w-4 h-4 text-[#FF4F81]" />
          </div>
          <div className="text-2xl font-extrabold text-white">{mediaCount}</div>
          <p className="text-[11px] text-[#FF91B5] mt-1">Shared media items</p>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#A7A7B7]">Voice Notes</span>
            <Mic className="w-4 h-4 text-[#42D392]" />
          </div>
          <div className="text-2xl font-extrabold text-white">{voiceCount}</div>
          <p className="text-[11px] text-[#42D392] mt-1">Audio recordings</p>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#A7A7B7]">Heart Reactions</span>
            <Heart className="w-4 h-4 text-[#FF5570]" />
          </div>
          <div className="text-2xl font-extrabold text-white">{reactionsCount}</div>
          <p className="text-[11px] text-[#FF5570] mt-1">Romantic taps</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel rounded-2xl p-4 border border-white/10 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex items-center space-x-2 flex-1 relative">
          <Search className="w-4 h-4 text-white/40 absolute left-3" />
          <input
            type="text"
            placeholder="Search message text or participant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#07070C] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#FF4F81]"
          />
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-2">
          {/* Sender Filter */}
          <div className="flex rounded-xl bg-white/5 p-1 border border-white/10 text-xs">
            <button
              onClick={() => setSenderFilter('all')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                senderFilter === 'all' ? 'bg-[#9B5CFF] text-white' : 'text-[#A7A7B7] hover:text-white'
              }`}
            >
              All Users
            </button>
            <button
              onClick={() => setSenderFilter('keerthi')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                senderFilter === 'keerthi' ? 'bg-[#9B5CFF] text-white' : 'text-[#A7A7B7] hover:text-white'
              }`}
            >
              Keerthi
            </button>
            <button
              onClick={() => setSenderFilter('anu')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                senderFilter === 'anu' ? 'bg-[#FF4F81] text-white' : 'text-[#A7A7B7] hover:text-white'
              }`}
            >
              Anu
            </button>
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-[#07070C] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#FF4F81]"
          >
            <option value="all">All Content Types</option>
            <option value="text">Text Messages</option>
            <option value="image">Photos & Images</option>
            <option value="voice">Voice Notes</option>
            <option value="video">Videos</option>
            <option value="file">Documents / Files</option>
          </select>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Encrypted Messages Stream ({filteredMessages.length})
          </span>
          <span className="text-xs text-[#42D392] flex items-center space-x-1 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>End-to-End Encrypted Wire</span>
          </span>
        </div>

        <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-xs text-[#A7A7B7]">Loading conversations...</div>
          ) : filteredMessages.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#A7A7B7]">No messages match criteria.</div>
          ) : (
            filteredMessages.map((msg) => {
              const isKeerthi = msg.senderId === 'a1111111-1111-1111-1111-111111111111' || (msg.senderName || '').includes('Keerthi');

              return (
                <div
                  key={msg.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                    {/* Avatar Badge */}
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border ${
                        isKeerthi
                          ? 'bg-[#9B5CFF]/20 border-[#9B5CFF]/40 text-[#B28CFF]'
                          : 'bg-[#FF4F81]/20 border-[#FF4F81]/40 text-[#FF91B5]'
                      }`}
                    >
                      {isKeerthi ? 'K' : 'A'}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 flex-wrap gap-1">
                        <span className={`text-xs font-bold ${isKeerthi ? 'text-[#B28CFF]' : 'text-[#FF91B5]'}`}>
                          {msg.senderName || (isKeerthi ? 'Keerthi Adarsh' : 'Anu Sri')}
                        </span>
                        <span className="text-[10px] text-[#A7A7B7]">➔</span>
                        <span className="text-xs text-white/70">
                          {msg.receiverName || (isKeerthi ? 'Anu Sri' : 'Keerthi Adarsh')}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/70 font-mono">
                          {msg.type || 'text'}
                        </span>
                      </div>

                      {/* Message Content */}
                      <p className="text-xs text-white mt-1 break-words font-sans whitespace-pre-wrap">
                        {msg.content}
                      </p>

                      {/* Media URL if present */}
                      {msg.mediaUrl && (
                        <div className="mt-2">
                          {msg.type === 'image' ? (
                            <img
                              src={msg.mediaUrl}
                              alt="Media"
                              className="w-32 h-32 rounded-xl object-cover border border-white/10"
                            />
                          ) : (
                            <span className="text-[11px] text-[#FF91B5] underline break-all">
                              {msg.mediaUrl}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Reactions */}
                      {msg.reactions && msg.reactions.length > 0 && (
                        <div className="flex items-center space-x-1.5 mt-2">
                          {msg.reactions.map((r: any, idx: number) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-xs flex items-center space-x-1"
                            >
                              <span>{r.emoji || '❤️'}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timestamp */}
                  <span className="text-[10px] text-[#A7A7B7] whitespace-nowrap self-start sm:self-auto font-mono">
                    {format(new Date(msg.createdAt), 'MMM dd, yyyy HH:mm:ss')}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

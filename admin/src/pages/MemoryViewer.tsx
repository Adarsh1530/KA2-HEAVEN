import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/adminApi';
import { Heart, Image, Video, Mail, Calendar, MapPin, Search, RefreshCw, Sparkles, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';

export const MemoryViewer: React.FC = () => {
  const [memories, setMemories] = useState<any[]>([]);
  const [loveNotes, setLoveNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'memories' | 'loveNotes'>('memories');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchMemories = async () => {
    try {
      setRefreshing(true);
      const data = await adminApi.getMemories();
      setMemories(data.memories || []);
      setLoveNotes(data.loveNotes || []);
    } catch (err) {
      console.error('Failed to load memories:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, []);

  const filteredMemories = memories.filter((m) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (m.title || '').toLowerCase().includes(q);
      const matchDesc = (m.description || '').toLowerCase().includes(q);
      const matchLoc = (m.location || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchLoc) return false;
    }
    return true;
  });

  const filteredLoveNotes = loveNotes.filter((n) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (n.title || '').toLowerCase().includes(q);
      const matchContent = (n.content || '').toLowerCase().includes(q);
      if (!matchTitle && !matchContent) return false;
    }
    return true;
  });

  const photosCount = memories.filter(m => m.category === 'photos' || !m.category).length;
  const videosCount = memories.filter(m => m.category === 'videos').length;

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Heart className="w-6 h-6 text-[#FF4F81]" />
            <span>Memories & Love Vault Storage</span>
          </h1>
          <p className="text-sm text-[#A7A7B7]">
            Entire gallery of shared couple memories, photos, videos, and love letters
          </p>
        </div>

        <button
          type="button"
          onClick={fetchMemories}
          disabled={refreshing}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white flex items-center space-x-2 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#FF4F81]' : 'text-white/60'}`} />
          <span>Refresh Memories</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#A7A7B7]">Total Memories</span>
            <Heart className="w-4 h-4 text-[#FF4F81]" />
          </div>
          <div className="text-2xl font-extrabold text-white">{memories.length}</div>
          <p className="text-[11px] text-[#FF91B5] mt-1">Photos & moments</p>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#A7A7B7]">Love Letters</span>
            <Mail className="w-4 h-4 text-[#9B5CFF]" />
          </div>
          <div className="text-2xl font-extrabold text-white">{loveNotes.length}</div>
          <p className="text-[11px] text-[#B28CFF] mt-1">Saved love notes</p>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#A7A7B7]">Photo Memories</span>
            <Image className="w-4 h-4 text-[#42D392]" />
          </div>
          <div className="text-2xl font-extrabold text-white">{photosCount}</div>
          <p className="text-[11px] text-[#42D392] mt-1">Captured photos</p>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#A7A7B7]">Video Clips</span>
            <Video className="w-4 h-4 text-[#FFB156]" />
          </div>
          <div className="text-2xl font-extrabold text-white">{videosCount}</div>
          <p className="text-[11px] text-[#FFB156] mt-1">Motion memories</p>
        </div>
      </div>

      {/* View Switcher & Search */}
      <div className="glass-panel rounded-2xl p-4 border border-white/10 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex items-center space-x-2 flex-1 relative">
          <Search className="w-4 h-4 text-white/40 absolute left-3" />
          <input
            type="text"
            placeholder="Search memories by title, location or love notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#07070C] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#FF4F81]"
          />
        </div>

        {/* Tab Toggle */}
        <div className="flex rounded-xl bg-white/5 p-1 border border-white/10 text-xs">
          <button
            onClick={() => setActiveTab('memories')}
            className={`px-4 py-1.5 rounded-lg font-semibold transition-colors flex items-center space-x-1.5 ${
              activeTab === 'memories' ? 'bg-[#FF4F81] text-white' : 'text-[#A7A7B7] hover:text-white'
            }`}
          >
            <Image className="w-3.5 h-3.5" />
            <span>Memories Gallery ({memories.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('loveNotes')}
            className={`px-4 py-1.5 rounded-lg font-semibold transition-colors flex items-center space-x-1.5 ${
              activeTab === 'loveNotes' ? 'bg-[#9B5CFF] text-white' : 'text-[#A7A7B7] hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Love Letters ({loveNotes.length})</span>
          </button>
        </div>
      </div>

      {/* Content View */}
      {activeTab === 'memories' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full p-12 text-center text-xs text-[#A7A7B7]">Loading memories...</div>
          ) : filteredMemories.length === 0 ? (
            <div className="col-span-full p-12 text-center text-xs text-[#A7A7B7]">No memories found.</div>
          ) : (
            filteredMemories.map((mem) => (
              <div
                key={mem.id}
                className="glass-panel rounded-2xl border border-white/10 overflow-hidden group hover:border-[#FF4F81]/50 transition-all flex flex-col"
              >
                {/* Media Image */}
                <div className="h-48 w-full relative overflow-hidden bg-black/40">
                  <img
                    src={mem.mediaUrl}
                    alt={mem.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600';
                    }}
                  />
                  <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] text-white font-semibold border border-white/10">
                    {mem.category || 'photo'}
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-[#FF91B5] transition-colors">
                      {mem.title}
                    </h3>
                    {mem.description && (
                      <p className="text-xs text-[#A7A7B7] mt-1 line-clamp-2">{mem.description}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-[#A7A7B7]">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-[#FF4F81]" />
                      <span>{mem.date || 'Cherished'}</span>
                    </span>
                    {mem.location && (
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-[#9B5CFF]" />
                        <span>{mem.location}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Love Notes List */
        <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden divide-y divide-white/5">
          {loading ? (
            <div className="p-8 text-center text-xs text-[#A7A7B7]">Loading love letters...</div>
          ) : filteredLoveNotes.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#A7A7B7]">No love letters found.</div>
          ) : (
            filteredLoveNotes.map((note) => (
              <div key={note.id} className="p-5 hover:bg-white/[0.02] transition-colors space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-[#FF91B5]">{note.senderName || 'My Love'}</span>
                    <span className="text-xs text-[#A7A7B7]">➔</span>
                    <span className="text-xs font-semibold text-white">{note.receiverName || 'Soulmate'}</span>
                  </div>
                  <span className="text-[10px] text-[#A7A7B7] font-mono">
                    {format(new Date(note.createdAt || new Date()), 'MMM dd, yyyy HH:mm')}
                  </span>
                </div>

                {note.title && <h4 className="text-sm font-bold text-white">{note.title}</h4>}
                <p className="text-xs text-white/90 italic font-serif leading-relaxed bg-white/[0.02] p-3 rounded-xl border border-white/5 whitespace-pre-wrap">
                  "{note.content}"
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

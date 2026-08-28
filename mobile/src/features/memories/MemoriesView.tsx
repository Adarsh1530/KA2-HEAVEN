import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';
import { MemoryItem, MemoryCategory } from '@ka2/shared';
import { GlassCard } from '../../components/common/GlassCard';
import { MemoryModal } from './MemoryModal';
import {
  Heart,
  Plus,
  Image as ImageIcon,
  Video,
  Mic,
  Calendar,
  MapPin,
  Sparkles,
  X,
  Upload,
} from 'lucide-react';
import { format } from 'date-fns';

export const MemoriesView: React.FC = () => {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<MemoryCategory>('all');
  const [selectedMemory, setSelectedMemory] = useState<MemoryItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // New Memory Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchMemories = async () => {
    try {
      let endpoint = '/memories';
      if (activeCategory === 'favorites') {
        endpoint += '?favorite=true';
      } else if (activeCategory !== 'all') {
        endpoint += `?category=${activeCategory}`;
      }
      const data = await api.request(endpoint);
      setMemories(data.memories);
    } catch (err) {
      console.error('Failed to fetch memories:', err);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, [activeCategory]);

  const handleToggleFavorite = async (memoryId: string) => {
    try {
      const res = await api.request(`/memories/${memoryId}/favorite`, { method: 'PUT' });
      setMemories(prev => prev.map(m => (m.id === memoryId ? res.memory : m)));
      if (selectedMemory?.id === memoryId) {
        setSelectedMemory(res.memory);
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  const handleDelete = async (memoryId: string) => {
    try {
      await api.request(`/memories/${memoryId}`, { method: 'DELETE' });
      setMemories(prev => prev.filter(m => m.id !== memoryId));
      setSelectedMemory(null);
    } catch (err) {
      console.error('Error deleting memory:', err);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const handleCreateMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !mediaFile) return;

    setIsSubmitting(true);
    try {
      const uploadRes = await api.uploadMedia(mediaFile);
      const isVid = mediaFile.type.startsWith('video/');
      const isAud = mediaFile.type.startsWith('audio/');

      const payload = {
        title,
        description,
        date,
        location,
        category: isVid ? 'videos' : isAud ? 'voice' : 'photos',
        mediaUrl: uploadRes.fileUrl,
        mediaType: isVid ? 'video' : isAud ? 'audio' : 'image',
        notes,
      };

      const res = await api.request('/memories', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setMemories(prev => [res.memory, ...prev]);
      setIsCreating(false);
      setTitle('');
      setDescription('');
      setLocation('');
      setNotes('');
      setMediaFile(null);
      setMediaPreview(null);
    } catch (err) {
      console.error('Failed to create memory:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories: { id: MemoryCategory; label: string; icon: any }[] = [
    { id: 'all', label: 'All', icon: Sparkles },
    { id: 'photos', label: 'Photos', icon: ImageIcon },
    { id: 'videos', label: 'Videos', icon: Video },
    { id: 'favorites', label: 'Favourites', icon: Heart },
  ];

  return (
    <div className="flex flex-col space-y-4 pb-24 px-4 pt-3 select-none">
      {/* 1. Header & New Memory Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <span>❤️ Our Memories</span>
          </h1>
          <p className="text-xs text-[#A7A7B7]">Preserving every moment of our love</p>
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsCreating(true)}
          className="px-3 py-2 rounded-xl bg-gradient-to-r from-[#9B5CFF] to-[#FF4F81] text-white text-xs font-semibold flex items-center space-x-1.5 shadow-glow-pink cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Memory</span>
        </motion.button>
      </div>

      {/* 2. Category Filters Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center space-x-1.5 transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-gradient-to-r from-[#9B5CFF] to-[#FF4F81] text-white shadow-glow-pink font-semibold'
                  : 'glass-panel text-white/70 hover:text-white border-white/10'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#FF91B5]'}`} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Memories Grid / Masonry Layout */}
      {memories.length === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-3">
            <Heart className="w-8 h-8 text-[#FF91B5] opacity-50" />
          </div>
          <h3 className="text-sm font-semibold text-white">Nothing here yet. Create your first memory.</h3>
          <p className="text-xs text-[#A7A7B7] mt-1">Capture the moments that take your breath away.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {memories.map((mem) => (
            <motion.div
              key={mem.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedMemory(mem)}
              className="glass-panel rounded-2xl overflow-hidden cursor-pointer border border-white/10 group relative shadow-lg"
            >
              {/* Media Thumbnail */}
              <div className="relative aspect-square overflow-hidden bg-black/40">
                <img
                  src={mem.thumbnailUrl || mem.mediaUrl}
                  alt={mem.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Favorite Heart Tag */}
                {mem.isFavorite && (
                  <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#FF4F81] text-white flex items-center justify-center shadow-md">
                    <Heart className="w-3.5 h-3.5 fill-current" />
                  </span>
                )}

                {mem.mediaType === 'video' && (
                  <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md text-[9px] text-white font-medium flex items-center space-x-1">
                    <Video className="w-2.5 h-2.5" />
                    <span>Video</span>
                  </span>
                )}
              </div>

              {/* Title & Date */}
              <div className="p-2.5 bg-[#171722]/90 backdrop-blur-md">
                <h3 className="text-xs font-semibold text-white truncate">{mem.title}</h3>
                <p className="text-[10px] text-[#A7A7B7] mt-0.5 flex items-center space-x-1">
                  <Calendar className="w-2.5 h-2.5 text-[#FF91B5]" />
                  <span>{format(new Date(mem.date), 'MMM dd, yyyy')}</span>
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Expanded Memory Modal */}
      <MemoryModal
        memory={selectedMemory}
        onClose={() => setSelectedMemory(null)}
        onToggleFavorite={handleToggleFavorite}
        onDelete={handleDelete}
      />

      {/* Create Memory Form Modal */}
      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 safe-top safe-bottom">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel rounded-3xl p-6 w-full max-w-sm max-h-[85vh] overflow-y-auto border border-white/20 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-white flex items-center space-x-2">
                  <Heart className="w-5 h-5 text-[#FF4F81] fill-current" />
                  <span>Create Shared Memory</span>
                </h2>
                <button onClick={() => setIsCreating(false)}>
                  <X className="w-5 h-5 text-white/60 hover:text-white" />
                </button>
              </div>

              <form onSubmit={handleCreateMemory} className="space-y-3.5">
                {/* Media Picker */}
                <div>
                  <label className="block text-[11px] text-[#A7A7B7] mb-1 font-medium">
                    Photo / Video
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {mediaPreview ? (
                    <div className="relative aspect-video rounded-xl overflow-hidden border border-white/20">
                      <img src={mediaPreview} alt="preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setMediaFile(null);
                          setMediaPreview(null);
                        }}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 text-white flex items-center justify-center"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-white/20 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-[#FF4F81] transition-colors"
                    >
                      <Upload className="w-6 h-6 text-white/50 mb-1.5" />
                      <span className="text-xs text-white/70">Upload photo or video</span>
                    </div>
                  )}
                </div>

                {/* Title */}
                <div>
                  <label className="block text-[11px] text-[#A7A7B7] mb-1 font-medium">Memory Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. That Beautiful Evening ❤️"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[#101019] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF4F81]"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[11px] text-[#A7A7B7] mb-1 font-medium">Description</label>
                  <textarea
                    rows={2}
                    placeholder="What made this moment unforgettable?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-[#101019] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF4F81]"
                  />
                </div>

                {/* Date & Location */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-[#A7A7B7] mb-1 font-medium">Date</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-[#101019] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF4F81]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#A7A7B7] mb-1 font-medium">Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Sunset Cove"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-[#101019] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF4F81]"
                    />
                  </div>
                </div>

                {/* Secret Note */}
                <div>
                  <label className="block text-[11px] text-[#A7A7B7] mb-1 font-medium">Romantic Whisper (Note)</label>
                  <input
                    type="text"
                    placeholder="A sweet secret note for us..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-[#101019] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF4F81]"
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting || !title || !mediaFile}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#9B5CFF] to-[#FF4F81] text-white font-semibold text-xs shadow-glow-pink hover:opacity-95 disabled:opacity-50 transition-opacity"
                >
                  {isSubmitting ? 'Saving Memory...' : 'Save to Our Memories ❤️'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

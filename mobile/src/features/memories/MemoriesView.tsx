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
  Calendar,
  Sparkles,
  X,
  Upload,
  Check,
} from 'lucide-react';
import { format } from 'date-fns';

interface SelectedFilePreview {
  file: File;
  previewUrl: string;
  id: string;
}

export const MemoriesView: React.FC = () => {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<MemoryCategory>('all');
  const [selectedMemory, setSelectedMemory] = useState<MemoryItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Multi-file selection state
  const [selectedFiles, setSelectedFiles] = useState<SelectedFilePreview[]>([]);
  const [optionalTitle, setOptionalTitle] = useState('');
  const [optionalDate, setOptionalDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const directUploadRef = useRef<HTMLInputElement | null>(null);

  const fetchMemories = async () => {
    try {
      let endpoint = '/memories';
      if (activeCategory === 'favorites') {
        endpoint += '?favorite=true';
      } else if (activeCategory !== 'all') {
        endpoint += `?category=${activeCategory}`;
      }
      const data = await api.request(endpoint);
      setMemories(data.memories || []);
    } catch (err) {
      console.error('Failed to fetch memories:', err);
    }
  };

  useEffect(() => {
    fetchMemories();
    const handleSync = () => fetchMemories();
    window.addEventListener('ka2_data_cleared', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('ka2_data_cleared', handleSync);
      window.removeEventListener('storage', handleSync);
    };
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

  const handleFilesChosen = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newFiles: SelectedFilePreview[] = Array.from(files).map((f) => ({
      file: f,
      previewUrl: URL.createObjectURL(f),
      id: `${f.name}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    }));

    setSelectedFiles((prev) => [...prev, ...newFiles]);
    setIsCreating(true);
  };

  const handleRemoveSelectedFile = (id: string) => {
    setSelectedFiles((prev) => {
      const filtered = prev.filter((item) => item.id !== id);
      if (filtered.length === 0) {
        setIsCreating(false);
      }
      return filtered;
    });
  };

  const handleSaveMemories = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (selectedFiles.length === 0) return;

    setIsSubmitting(true);
    try {
      const rawFiles = selectedFiles.map((item) => item.file);
      const uploadedMedia = await api.uploadMultipleMedia(rawFiles);

      const memDate = optionalDate || new Date().toISOString().split('T')[0];
      const defaultDateStr = format(new Date(memDate), 'MMM dd, yyyy');

      const batchPayload = uploadedMedia.map((media, idx) => {
        const isVid = media.mimeType?.startsWith('video/');
        const isAud = media.mimeType?.startsWith('audio/');
        const itemTitle =
          optionalTitle.trim()
            ? (selectedFiles.length > 1 ? `${optionalTitle.trim()} (${idx + 1})` : optionalTitle.trim())
            : `Memory — ${defaultDateStr}${selectedFiles.length > 1 ? ` (${idx + 1})` : ''}`;

        return {
          title: itemTitle,
          description: '',
          date: memDate,
          location: 'Our Heaven',
          category: (isVid ? 'videos' : isAud ? 'voice' : 'photos') as any,
          mediaUrl: media.fileUrl,
          thumbnailUrl: media.fileUrl,
          mediaType: (isVid ? 'video' : isAud ? 'audio' : 'image') as any,
          isFavorite: false,
          notes: '',
        };
      });

      const res = await api.request('/memories/batch', {
        method: 'POST',
        body: JSON.stringify({ memories: batchPayload }),
      });

      if (res.memories) {
        setMemories((prev) => [...res.memories, ...prev]);
      } else {
        await fetchMemories();
      }

      // Reset state and close modal
      setSelectedFiles([]);
      setOptionalTitle('');
      setIsCreating(false);
    } catch (err) {
      console.error('Failed to create memories:', err);
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
      {/* Hidden Global Multi-File Pickers */}
      <input
        type="file"
        ref={directUploadRef}
        multiple
        accept="image/*,video/*"
        onChange={(e) => {
          handleFilesChosen(e.target.files);
          if (directUploadRef.current) directUploadRef.current.value = '';
        }}
        className="hidden"
      />
      <input
        type="file"
        ref={fileInputRef}
        multiple
        accept="image/*,video/*"
        onChange={(e) => {
          handleFilesChosen(e.target.files);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }}
        className="hidden"
      />

      {/* 1. Header & Instant Upload Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <span>❤️ Our Memories</span>
          </h1>
          <p className="text-xs text-[#A7A7B7]">Preserving every moment of our love</p>
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => directUploadRef.current?.click()}
          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#9B5CFF] to-[#FF4F81] text-white text-xs font-semibold flex items-center space-x-1.5 shadow-glow-pink cursor-pointer"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Photos</span>
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
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center space-x-1.5 transition-all whitespace-nowrap cursor-pointer ${
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
          <h3 className="text-sm font-semibold text-white">No memories uploaded yet.</h3>
          <p className="text-xs text-[#A7A7B7] mt-1 max-w-xs">
            Tap Upload Photos to select multiple photos or videos and save them directly!
          </p>
          <button
            onClick={() => directUploadRef.current?.click()}
            className="mt-4 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white font-medium border border-white/10 flex items-center space-x-2 cursor-pointer"
          >
            <Upload className="w-4 h-4 text-[#FF4F81]" />
            <span>Select Photos Now</span>
          </button>
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

      {/* Multi-Image Upload & Preview Modal */}
      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 safe-top safe-bottom">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel rounded-3xl p-6 w-full max-w-sm max-h-[85vh] overflow-y-auto border border-white/20 shadow-2xl flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-white flex items-center space-x-2">
                  <Heart className="w-5 h-5 text-[#FF4F81] fill-current" />
                  <span>Save to Memories</span>
                </h2>
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setSelectedFiles([]);
                  }}
                  className="p-1 text-white/60 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveMemories} className="space-y-4 flex-1 flex flex-col justify-between">
                <div>
                  {/* Selected Photos Multi-Grid Preview */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-white/90">
                      {selectedFiles.length} {selectedFiles.length === 1 ? 'item' : 'items'} selected
                    </span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-[#FF91B5] hover:text-white flex items-center space-x-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add more</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 bg-[#101019] rounded-2xl border border-white/10">
                    {selectedFiles.map((item) => (
                      <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden border border-white/10 group">
                        <img src={item.previewUrl} alt="preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveSelectedFile(item.id)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center cursor-pointer hover:bg-[#FF4F81] transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    {/* Add More Tile */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-xl border border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:border-[#FF4F81] transition-colors text-white/50 hover:text-white"
                    >
                      <Plus className="w-5 h-5 mb-0.5" />
                      <span className="text-[10px]">Add</span>
                    </div>
                  </div>

                  {/* Optional Custom Title (Not required!) */}
                  <div className="mt-3.5">
                    <label className="block text-[11px] text-[#A7A7B7] mb-1 font-medium">
                      Album / Memory Title <span className="text-[10px] text-white/40">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sunset Moments (or leave blank)"
                      value={optionalTitle}
                      onChange={(e) => setOptionalTitle(e.target.value)}
                      className="w-full bg-[#101019] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF4F81]"
                    />
                  </div>

                  {/* Date */}
                  <div className="mt-3">
                    <label className="block text-[11px] text-[#A7A7B7] mb-1 font-medium">Date</label>
                    <input
                      type="date"
                      value={optionalDate}
                      onChange={(e) => setOptionalDate(e.target.value)}
                      className="w-full bg-[#101019] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF4F81]"
                    />
                  </div>
                </div>

                {/* Instant Save Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || selectedFiles.length === 0}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#9B5CFF] to-[#FF4F81] text-white font-semibold text-xs shadow-glow-pink hover:opacity-95 disabled:opacity-50 transition-opacity flex items-center justify-center space-x-2 cursor-pointer mt-4"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving {selectedFiles.length} {selectedFiles.length === 1 ? 'Memory' : 'Memories'}...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save {selectedFiles.length} {selectedFiles.length === 1 ? 'Photo' : 'Photos'} to Memories ❤️</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};


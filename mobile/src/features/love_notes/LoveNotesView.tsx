import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { LoveNoteItem } from '@ka2/shared';
import { GlassCard } from '../../components/common/GlassCard';
import { LoveNoteModal } from './LoveNoteModal';
import {
  Mail,
  Plus,
  Heart,
  Calendar,
  Sparkles,
  X,
  Send,
  Upload,
  ArrowLeft,
} from 'lucide-react';
import { format } from 'date-fns';

interface LoveNotesViewProps {
  onBack?: () => void;
}

export const LoveNotesView: React.FC<LoveNotesViewProps> = ({ onBack }) => {
  const { user, partner } = useAuth();
  const [loveNotes, setLoveNotes] = useState<LoveNoteItem[]>([]);
  const [selectedNote, setSelectedNote] = useState<LoveNoteItem | null>(null);
  const [isComposing, setIsComposing] = useState(false);

  // Composer Form
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [stationeryStyle, setStationeryStyle] = useState<'romantic_parchment' | 'midnight_violet' | 'rose_gold' | 'celestial_stars'>('romantic_parchment');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchLoveNotes = async () => {
    try {
      const data = await api.request('/love-notes');
      setLoveNotes(data.loveNotes);
    } catch (err) {
      console.error('Failed to fetch love notes:', err);
    }
  };

  useEffect(() => {
    fetchLoveNotes();
  }, []);

  const handleOpenNote = async (note: LoveNoteItem) => {
    try {
      const res = await api.request(`/love-notes/${note.id}/open`, { method: 'PUT' });
      setSelectedNote(res.loveNote);
      setLoveNotes(prev => prev.map(n => (n.id === note.id ? res.loveNote : n)));
    } catch {
      setSelectedNote(note);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSendNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;

    setIsSending(true);
    try {
      let uploadedPhotoUrl = undefined;
      if (photoFile) {
        const uploadRes = await api.uploadMedia(photoFile);
        uploadedPhotoUrl = uploadRes.fileUrl;
      }

      const payload = {
        title,
        message,
        stationeryStyle,
        photoUrl: uploadedPhotoUrl,
      };

      const res = await api.request('/love-notes', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setLoveNotes(prev => [res.loveNote, ...prev]);
      setIsComposing(false);
      setTitle('');
      setMessage('');
      setPhotoFile(null);
      setPhotoPreview(null);
    } catch (err) {
      console.error('Failed to send love note:', err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col space-y-4 pb-24 px-4 pt-3 select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {onBack && (
            <button onClick={onBack} className="p-1 text-white/70 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-white flex items-center space-x-2">
              <span>💌 Love Notes</span>
            </h1>
            <p className="text-xs text-[#A7A7B7]">Heartfelt letters written for each other</p>
          </div>
        </div>

        <button
          onClick={() => setIsComposing(true)}
          className="px-3 py-2 rounded-xl bg-gradient-to-r from-[#9B5CFF] to-[#FF4F81] text-white text-xs font-semibold flex items-center space-x-1.5 shadow-glow-pink"
        >
          <Plus className="w-4 h-4" />
          <span>Write Letter</span>
        </button>
      </div>

      {/* Love Notes List */}
      {loveNotes.length === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-3">
            <Mail className="w-8 h-8 text-[#FF91B5] opacity-50" />
          </div>
          <h3 className="text-sm font-semibold text-white">Write something she'll remember. 💌</h3>
          <p className="text-xs text-[#A7A7B7] mt-1">Leave a digital letter sealed with all your heart.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {loveNotes.map((note) => {
            const isFromMe = note.senderId === user?.id;

            return (
              <GlassCard
                key={note.id}
                interactive
                glowColor="rose"
                onClick={() => handleOpenNote(note)}
                className="p-4 border-white/10 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center space-x-3.5">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border ${
                    note.isOpened
                      ? 'bg-white/5 border-white/10 text-white/70'
                      : 'bg-gradient-to-tr from-[#9B5CFF]/30 to-[#FF4F81]/30 border-[#FF4F81]/40 text-[#FF4F81] shadow-glow-pink animate-pulse'
                  }`}>
                    <Mail className="w-5 h-5" />
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-semibold text-white">{note.title}</h3>
                      {!note.isOpened && !isFromMe && (
                        <span className="w-2 h-2 rounded-full bg-[#FF4F81] shadow-[0_0_8px_#FF4F81]" />
                      )}
                    </div>
                    <p className="text-[11px] text-[#A7A7B7] mt-0.5">
                      From {note.senderName} • {format(new Date(note.date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>

                <span className="text-xs text-[#FF91B5] font-semibold">Open &rarr;</span>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Love Note Modal */}
      <LoveNoteModal note={selectedNote} onClose={() => setSelectedNote(null)} />

      {/* Love Note Composer Modal */}
      <AnimatePresence>
        {isComposing && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel rounded-3xl p-6 w-full max-w-sm max-h-[85vh] overflow-y-auto border border-white/20 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-white flex items-center space-x-2">
                  <Heart className="w-5 h-5 text-[#FF4F81] fill-current" />
                  <span>Write a Love Letter</span>
                </h2>
                <button onClick={() => setIsComposing(false)}>
                  <X className="w-5 h-5 text-white/60 hover:text-white" />
                </button>
              </div>

              <form onSubmit={handleSendNote} className="space-y-3.5">
                {/* Title */}
                <div>
                  <label className="block text-[11px] text-[#A7A7B7] mb-1 font-medium">Letter Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. To My Forever Girl ❤️"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[#101019] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF4F81]"
                  />
                </div>

                {/* Stationery Style */}
                <div>
                  <label className="block text-[11px] text-[#A7A7B7] mb-1 font-medium">Stationery Theme</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'romantic_parchment', label: '📜 Parchment' },
                      { id: 'rose_gold', label: '🌸 Rose Gold' },
                      { id: 'midnight_violet', label: '🌌 Midnight' },
                      { id: 'celestial_stars', label: '✨ Celestial' },
                    ].map((style) => (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => setStationeryStyle(style.id as any)}
                        className={`py-1.5 px-2 rounded-xl text-xs font-medium border transition-all ${
                          stationeryStyle === style.id
                            ? 'bg-[#FF4F81]/20 border-[#FF4F81] text-white font-semibold'
                            : 'bg-[#101019] border-white/10 text-white/60 hover:text-white'
                        }`}
                      >
                        {style.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message Body */}
                <div>
                  <label className="block text-[11px] text-[#A7A7B7] mb-1 font-medium">Your Words</label>
                  <textarea
                    rows={6}
                    required
                    placeholder="Pour your thoughts and deepest feelings here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full bg-[#101019] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-serif focus:outline-none focus:border-[#FF4F81]"
                  />
                </div>

                {/* Optional Attached Photo */}
                <div>
                  <label className="block text-[11px] text-[#A7A7B7] mb-1 font-medium">Attach Keepsake Photo (Optional)</label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                  {photoPreview ? (
                    <div className="relative aspect-video rounded-xl overflow-hidden border border-white/20">
                      <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoFile(null);
                          setPhotoPreview(null);
                        }}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white/70 hover:text-white flex items-center justify-center space-x-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Attach Photo</span>
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSending || !title || !message}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#9B5CFF] to-[#FF4F81] text-white font-semibold text-xs shadow-glow-pink hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSending ? 'Sealing with Love...' : 'Seal & Send Love Letter ❤️'}</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

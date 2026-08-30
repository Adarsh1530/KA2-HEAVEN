import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LoveNoteItem } from '@ka2/shared';
import { resolveMediaUrl } from '../../services/api';
import { X, Heart, Mail, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

interface LoveNoteModalProps {
  note: LoveNoteItem | null;
  onClose: () => void;
}

export const LoveNoteModal: React.FC<LoveNoteModalProps> = ({ note, onClose }) => {
  const [envelopeOpen, setEnvelopeOpen] = useState(false);

  useEffect(() => {
    if (note) {
      const timer = setTimeout(() => {
        setEnvelopeOpen(true);
      }, 400);
      return () => clearTimeout(timer);
    } else {
      setEnvelopeOpen(false);
    }
  }, [note]);

  if (!note) return null;

  const stationeryStyles = {
    romantic_parchment: 'bg-[#FFFDF9] text-[#2C2523] border-[#E8DFC8]',
    midnight_violet: 'bg-[#151128] text-[#F1EBFD] border-[#3D2C66]',
    rose_gold: 'bg-[#FFF5F7] text-[#3D1D24] border-[#FAD2DA]',
    celestial_stars: 'bg-[#0E1326] text-[#E4ECFD] border-[#29355A]',
  };

  const currentStationery = stationeryStyles[note.stationeryStyle] || stationeryStyles.romantic_parchment;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-2xl flex flex-col items-center justify-center p-4 safe-top safe-bottom select-none">
      {/* Top Close Button */}
      <div className="w-full max-w-sm flex justify-end mb-3">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Unfolding Envelope / Stationery Letter */}
      <div className="w-full max-w-sm relative">
        {/* Soft Romantic Glowing Halo */}
        <div className="absolute -inset-4 bg-gradient-to-r from-[#9B5CFF]/30 via-[#FF4F81]/30 to-[#FF91B5]/30 rounded-3xl blur-2xl pointer-events-none" />

        <AnimatePresence mode="wait">
          {!envelopeOpen ? (
            /* Envelope Sealed View */
            <motion.div
              key="envelope"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#171722] border border-white/20 rounded-3xl p-8 text-center flex flex-col items-center shadow-2xl relative"
            >
              <div className="w-16 h-16 rounded-full bg-[#FF4F81]/20 border border-[#FF4F81]/40 flex items-center justify-center mb-4 animate-bounce">
                <Heart className="w-8 h-8 text-[#FF4F81] fill-current" />
              </div>

              <h3 className="text-base font-bold text-white mb-1">A Love Note for You</h3>
              <p className="text-xs text-[#A7A7B7]">From {note.senderName} ❤️</p>
              <span className="text-[10px] text-[#FF91B5] mt-4 uppercase tracking-widest">
                Unfolding your letter...
              </span>
            </motion.div>
          ) : (
            /* Unfolded Letter View */
            <motion.div
              key="letter"
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className={`rounded-3xl p-6 shadow-2xl border ${currentStationery} max-h-[75vh] overflow-y-auto relative`}
            >
              {/* Decorative Header Stamp */}
              <div className="flex items-center justify-between border-b pb-3 mb-4 opacity-70">
                <span className="text-[10px] uppercase font-bold tracking-widest">
                  KA² HEAVEN LETTER
                </span>
                <span className="text-[10px] font-mono">
                  {format(new Date(note.date), 'MMMM dd, yyyy')}
                </span>
              </div>

              {/* Title */}
              <h2 className="text-lg font-bold font-serif mb-3">{note.title}</h2>

              {/* Optional Attached Photo */}
              {note.photoUrl && (
                <div className="mb-4 rounded-2xl overflow-hidden shadow-md">
                  <img src={resolveMediaUrl(note.photoUrl)} alt="Love Note Moment" className="w-full h-44 object-cover" />
                </div>
              )}

              {/* Letter Message Body */}
              <p className="text-sm font-serif leading-relaxed whitespace-pre-wrap mb-6">
                {note.message}
              </p>

              {/* Heart Signature Seal */}
              <div className="border-t pt-4 flex items-center justify-between opacity-80">
                <div className="flex items-center space-x-1.5 text-xs font-semibold">
                  <span>Forever yours,</span>
                  <span className="text-[#FF4F81]">{note.senderName}</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#FF4F81]/15 flex items-center justify-center text-[#FF4F81]">
                  <Heart className="w-4 h-4 fill-current" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

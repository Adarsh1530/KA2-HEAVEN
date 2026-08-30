import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MemoryItem } from '@ka2/shared';
import { resolveMediaUrl } from '../../services/api';
import { X, Heart, MapPin, Calendar, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface MemoryModalProps {
  memory: MemoryItem | null;
  onClose: () => void;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
}

export const MemoryModal: React.FC<MemoryModalProps> = ({
  memory,
  onClose,
  onToggleFavorite,
  onDelete,
}) => {
  if (!memory) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex flex-col justify-between p-4 safe-top safe-bottom select-none">
      {/* Top Bar */}
      <div className="flex items-center justify-between z-10">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onToggleFavorite(memory.id)}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
              memory.isFavorite
                ? 'bg-[#FF4F81] text-white shadow-glow-pink'
                : 'bg-white/10 text-white/70 hover:text-white'
            }`}
          >
            <Heart className="w-5 h-5 fill-current" />
          </button>
          <button
            onClick={() => onDelete(memory.id)}
            className="w-9 h-9 rounded-full bg-white/10 text-[#FF5570] flex items-center justify-center hover:bg-[#FF5570]/20 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Expanded Media */}
      <div className="flex-1 flex items-center justify-center my-4 overflow-hidden">
        {memory.mediaType === 'video' ? (
          <video
            src={resolveMediaUrl(memory.mediaUrl)}
            controls
            autoPlay
            className="max-h-[60vh] max-w-full rounded-2xl object-contain shadow-2xl"
          />
        ) : (
          <motion.img
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            src={resolveMediaUrl(memory.mediaUrl)}
            alt={memory.title}
            className="max-h-[60vh] max-w-full rounded-2xl object-contain shadow-2xl"
          />
        )}
      </div>

      {/* Bottom Info Sheet */}
      <div className="glass-panel rounded-3xl p-5 border border-white/10 backdrop-blur-xl">
        <h2 className="text-base font-bold text-white mb-1">{memory.title}</h2>
        <p className="text-xs text-white/80 leading-relaxed mb-3">{memory.description}</p>

        <div className="flex items-center space-x-4 text-[11px] text-[#A7A7B7]">
          <span className="flex items-center space-x-1">
            <Calendar className="w-3.5 h-3.5 text-[#FF91B5]" />
            <span>{format(new Date(memory.date), 'MMMM dd, yyyy')}</span>
          </span>
          {memory.location && (
            <span className="flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-[#42D392]" />
              <span>{memory.location}</span>
            </span>
          )}
        </div>

        {memory.notes && (
          <div className="mt-3 pt-3 border-t border-white/10 text-xs italic text-[#FF91B5] font-serif">
            "{memory.notes}"
          </div>
        )}
      </div>
    </div>
  );
};

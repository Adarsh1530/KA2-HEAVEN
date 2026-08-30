import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api, resolveMediaUrl } from '../../services/api';
import { TimelineMilestone } from '@ka2/shared';
import { GlassCard } from '../../components/common/GlassCard';
import {
  Heart,
  Calendar,
  Sparkles,
  MapPin,
  Camera,
  Mail,
  Plus,
  ArrowLeft,
  X,
} from 'lucide-react';
import { format } from 'date-fns';

interface StoryViewProps {
  onBack?: () => void;
}

export const StoryView: React.FC<StoryViewProps> = ({ onBack }) => {
  const [timeline, setTimeline] = useState<TimelineMilestone[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  // New Milestone Form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<'milestone' | 'trip' | 'anniversary' | 'date' | 'note'>('milestone');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTimeline = async () => {
    try {
      const data = await api.request('/story/timeline');
      setTimeline(data.timeline);
    } catch (err) {
      console.error('Failed to fetch timeline:', err);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, []);

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date) return;

    setIsSubmitting(true);
    try {
      const res = await api.request('/story/timeline', {
        method: 'POST',
        body: JSON.stringify({ title, description, date, category }),
      });

      setTimeline(prev => [res.milestone, ...prev]);
      setIsAdding(false);
      setTitle('');
      setDescription('');
    } catch (err) {
      console.error('Failed to add milestone:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'anniversary':
        return <Heart className="w-4 h-4 text-[#FF4F81] fill-current" />;
      case 'trip':
        return <MapPin className="w-4 h-4 text-[#42D392]" />;
      case 'note':
        return <Mail className="w-4 h-4 text-[#FF91B5]" />;
      case 'date':
        return <Camera className="w-4 h-4 text-[#B28CFF]" />;
      default:
        return <Sparkles className="w-4 h-4 text-[#FF4F81]" />;
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
              <span>Our Story ❤️</span>
            </h1>
            <p className="text-xs text-[#A7A7B7]">Every step of our journey together</p>
          </div>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="px-3 py-2 rounded-xl bg-gradient-to-r from-[#9B5CFF] to-[#FF4F81] text-white text-xs font-semibold flex items-center space-x-1.5 shadow-glow-pink"
        >
          <Plus className="w-4 h-4" />
          <span>Add Chapter</span>
        </button>
      </div>

      {/* Timeline Vertical Rail */}
      <div className="relative pl-6 space-y-6 before:absolute before:top-3 before:bottom-3 before:left-2.5 before:w-0.5 before:bg-gradient-to-b before:from-[#9B5CFF] before:via-[#FF4F81] before:to-[#FF91B5]">
        {timeline.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.08 }}
            className="relative group"
          >
            {/* Timeline Pin Node */}
            <div className="absolute -left-[27px] top-3.5 w-6 h-6 rounded-full bg-[#07070C] border-2 border-[#FF4F81] flex items-center justify-center shadow-glow-pink z-10">
              {getCategoryIcon(item.category)}
            </div>

            {/* Timeline Card */}
            <GlassCard className="p-4 border-white/10 hover:border-[#FF4F81]/40 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold text-[#FF91B5] uppercase tracking-wider">
                  {item.monthYear || format(new Date(item.date), 'MMMM yyyy')}
                </span>
                <span className="text-[10px] text-[#A7A7B7]">
                  {format(new Date(item.date), 'MMM dd, yyyy')}
                </span>
              </div>

              <h3 className="text-sm font-bold text-white mb-1">{item.title}</h3>
              <p className="text-xs text-white/80 leading-relaxed">{item.description}</p>

              {item.mediaUrl && (
                <div className="mt-3 rounded-xl overflow-hidden aspect-video">
                  <img src={resolveMediaUrl(item.mediaUrl)} alt={item.title} className="w-full h-full object-cover" />
                </div>
              )}
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Add Chapter Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel rounded-3xl p-6 w-full max-w-sm border border-white/20 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-white flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-[#FF4F81]" />
                  <span>Add Story Milestone</span>
                </h2>
                <button onClick={() => setIsAdding(false)}>
                  <X className="w-5 h-5 text-white/60 hover:text-white" />
                </button>
              </div>

              <form onSubmit={handleAddMilestone} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] text-[#A7A7B7] mb-1 font-medium">Milestone Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. When We Moved In Together"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[#101019] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF4F81]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#A7A7B7] mb-1 font-medium">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-[#101019] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF4F81]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#A7A7B7] mb-1 font-medium">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-[#101019] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF4F81]"
                  >
                    <option value="milestone">🌟 Milestone</option>
                    <option value="anniversary">❤️ Anniversary</option>
                    <option value="trip">✈️ Trip / Vacation</option>
                    <option value="date">🥂 Special Date</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-[#A7A7B7] mb-1 font-medium">Description</label>
                  <textarea
                    rows={3}
                    placeholder="Describe how magical this memory was..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-[#101019] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF4F81]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !title}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#9B5CFF] to-[#FF4F81] text-white font-semibold text-xs shadow-glow-pink hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {isSubmitting ? 'Adding...' : 'Add to Our Story ❤️'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

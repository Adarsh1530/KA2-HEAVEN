import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useCall } from '../../context/CallContext';
import { ParticleConnectionScene } from '../../components/canvas/ParticleConnectionScene';
import { GlassCard } from '../../components/common/GlassCard';
import { resolveMediaUrl } from '../../services/api';
import { NavTab } from '../../components/common/BottomNav';
import {
  MessageCircle,
  Phone,
  Video,
  Heart,
  Lock,
  Mail,
  BookOpen,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

interface HomeViewProps {
  onNavigate: (tab: NavTab) => void;
  onOpenLoveNotes: () => void;
  onOpenStory: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigate,
  onOpenLoveNotes,
  onOpenStory,
}) => {
  const { user, partner, bothOnline } = useAuth();
  const { startCall } = useCall();

  const isPartnerOnline = partner?.presenceStatus === 'online' || partner?.presenceStatus === 'typing' || partner?.presenceStatus === 'in_call';

  return (
    <div className="flex flex-col space-y-5 pb-24 px-4 pt-3">
      {/* 1. Dynamic Greeting Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Welcome back, {user?.nickname || user?.name} ❤️
          </h1>
          <p className="text-xs text-[#A7A7B7] flex items-center space-x-1.5 mt-0.5">
            <span className={`w-2 h-2 rounded-full ${bothOnline ? 'bg-[#42D392] shadow-[0_0_8px_#42D392]' : 'bg-[#FF91B5]'}`} />
            <span>{bothOnline ? 'Both in our Heaven right now ✨' : isPartnerOnline ? `${partner?.nickname || partner?.name} is active` : 'A Heaven Made for Two.'}</span>
          </p>
        </div>
      </motion.div>

      {/* 2. Hero 3D Relationship Connection Canvas */}
      <GlassCard className="h-64 relative flex flex-col justify-between p-0 overflow-hidden border-white/10 shadow-2xl">
        {/* Background 3D Particle Canvas Scene */}
        <div className="absolute inset-0 z-0">
          <ParticleConnectionScene bothOnline={bothOnline} intensity={1.0} />
        </div>

        {/* Floating Top Badge */}
        <div className="relative z-10 p-4 flex items-center justify-between">
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/10 backdrop-blur-md text-[10px] font-semibold text-white/90">
            <Sparkles className="w-3 h-3 text-[#FF4F81]" />
            <span>Our Private World</span>
          </span>

          <span className="text-[10px] text-white/50 font-serif italic">
            End-to-End Encrypted
          </span>
        </div>

        {/* Bottom Hero: Dual Partner Avatars & Presence */}
        <div className="relative z-10 p-4 bg-gradient-to-t from-[#07070C]/90 via-[#07070C]/40 to-transparent flex items-center justify-around">
          {/* Keerthi Avatar */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <img
                src={resolveMediaUrl(user?.avatarUrl, user?.name || 'Keerthi')}
                alt={user?.name}
                className="w-14 h-14 rounded-full object-cover border-2 border-[#9B5CFF] shadow-[0_0_15px_rgba(155,92,255,0.4)]"
              />
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#42D392] border-2 border-[#07070C] rounded-full" />
            </div>
            <span className="text-xs font-semibold text-white mt-1.5">{user?.nickname || 'Keerthi'}</span>
            <span className="text-[9px] text-[#A7A7B7]">You</span>
          </div>

          {/* Romantic Pulsing Heart Emblem */}
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#9B5CFF]/30 to-[#FF4F81]/30 border border-[#FF4F81]/40 flex items-center justify-center animate-heart-pulse shadow-glow-pink">
              <Heart className="w-5 h-5 text-[#FF4F81] fill-[#FF4F81]" />
            </div>
            <span className="text-[8px] text-[#FF91B5] font-semibold mt-1 uppercase tracking-widest">
              Together
            </span>
          </div>

          {/* Anu Sri Avatar */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <img
                src={resolveMediaUrl(partner?.avatarUrl, partner?.name || 'Anu')}
                alt={partner?.name}
                className="w-14 h-14 rounded-full object-cover border-2 border-[#FF4F81] shadow-[0_0_15px_rgba(255,79,129,0.4)]"
              />
              <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 ${isPartnerOnline ? 'bg-[#42D392]' : 'bg-white/40'} border-2 border-[#07070C] rounded-full`} />
            </div>
            <span className="text-xs font-semibold text-white mt-1.5">{partner?.nickname || 'Anu'}</span>
            <span className="text-[9px] text-[#A7A7B7]">{isPartnerOnline ? 'Active' : 'Offline'}</span>
          </div>
        </div>
      </GlassCard>

      {/* 3. Quick Action Cards (2x2 Grid + Full Width) */}
      <div>
        <h2 className="text-xs font-semibold text-[#A7A7B7] uppercase tracking-wider mb-2.5 px-1">
          Quick Actions
        </h2>

        <div className="grid grid-cols-2 gap-3">
          {/* Chat Card */}
          <GlassCard
            interactive
            glowColor="rose"
            onClick={() => onNavigate('chat')}
            className="flex items-center space-x-3.5 cursor-pointer"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#9B5CFF]/25 to-[#FF4F81]/25 border border-[#FF4F81]/30 flex items-center justify-center text-[#FF4F81]">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Chat</h3>
              <p className="text-[11px] text-[#A7A7B7]">Talk to {partner?.nickname || 'her'}</p>
            </div>
          </GlassCard>

          {/* Voice Call Card */}
          <GlassCard
            interactive
            glowColor="violet"
            onClick={() => startCall('voice')}
            className="flex items-center space-x-3.5 cursor-pointer"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#42D392]/25 to-[#9B5CFF]/25 border border-[#42D392]/30 flex items-center justify-center text-[#42D392]">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Voice Call</h3>
              <p className="text-[11px] text-[#A7A7B7]">Call {partner?.nickname || 'her'}</p>
            </div>
          </GlassCard>

          {/* Video Call Card */}
          <GlassCard
            interactive
            glowColor="violet"
            onClick={() => startCall('video')}
            className="flex items-center space-x-3.5 cursor-pointer"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#9B5CFF]/25 to-[#B28CFF]/25 border border-[#9B5CFF]/30 flex items-center justify-center text-[#B28CFF]">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Video Call</h3>
              <p className="text-[11px] text-[#A7A7B7]">See {partner?.nickname || 'her'}</p>
            </div>
          </GlassCard>

          {/* Memories Card */}
          <GlassCard
            interactive
            glowColor="rose"
            onClick={() => onNavigate('memories')}
            className="flex items-center space-x-3.5 cursor-pointer"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FF4F81]/25 to-[#FF91B5]/25 border border-[#FF91B5]/30 flex items-center justify-center text-[#FF91B5]">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Memories</h3>
              <p className="text-[11px] text-[#A7A7B7]">Our moments</p>
            </div>
          </GlassCard>
        </div>

        {/* Second Row: Love Notes & Private Vault */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          {/* Love Notes */}
          <GlassCard
            interactive
            glowColor="rose"
            onClick={onOpenLoveNotes}
            className="flex items-center space-x-3.5 cursor-pointer"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FF91B5]/25 to-[#FF4F81]/25 border border-[#FF91B5]/30 flex items-center justify-center text-[#FF91B5]">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Love Notes</h3>
              <p className="text-[11px] text-[#A7A7B7]">Heartfelt letters</p>
            </div>
          </GlassCard>

          {/* Private Vault */}
          <GlassCard
            interactive
            glowColor="violet"
            onClick={() => onNavigate('vault')}
            className="flex items-center space-x-3.5 cursor-pointer"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#9B5CFF]/25 to-[#171722] border border-[#9B5CFF]/30 flex items-center justify-center text-[#B28CFF]">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Private Vault</h3>
              <p className="text-[11px] text-[#A7A7B7]">Secret space</p>
            </div>
          </GlassCard>
        </div>

        {/* Our Story Banner */}
        <GlassCard
          interactive
          glowColor="rose"
          onClick={onOpenStory}
          className="mt-3 flex items-center justify-between cursor-pointer bg-gradient-to-r from-[#171722] via-[#101019] to-[#171722]"
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#FF4F81]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Our Story & Milestones ❤️</h3>
              <p className="text-[11px] text-[#A7A7B7]">Relive how our journey unfolded</p>
            </div>
          </div>
          <span className="text-xs text-[#FF4F81] font-semibold">View &rarr;</span>
        </GlassCard>
      </div>
    </div>
  );
};

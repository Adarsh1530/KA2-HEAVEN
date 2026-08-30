import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCall } from '../../context/CallContext';
import { useAuth } from '../../context/AuthContext';
import { resolveMediaUrl } from '../../services/api';
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  ShieldCheck,
  Disc,
  X,
  Check,
} from 'lucide-react';

export const CallOverlay: React.FC = () => {
  const { partner } = useAuth();
  const {
    callState,
    callType,
    callerInfo,
    isMuted,
    isVideoOff,
    isSpeakerOn,
    isRecording,
    recordingConsentRequested,
    callDuration,
    connectionQuality,
    localStream,
    remoteStream,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    toggleSpeaker,
    requestRecording,
    respondRecordingConsent,
  } = useCall();

  const [controlsVisible, setControlsVisible] = useState(true);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const autoHideTimeoutRef = useRef<any>(null);

  // Attach streams to video & audio elements
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.play().catch(e => console.log('[Call] Audio autoplay catch:', e));
    }
  }, [remoteStream]);

  // Auto-hide controls for video call
  useEffect(() => {
    if (callType === 'video' && callState === 'connected') {
      const resetHideTimer = () => {
        setControlsVisible(true);
        if (autoHideTimeoutRef.current) clearTimeout(autoHideTimeoutRef.current);
        autoHideTimeoutRef.current = setTimeout(() => {
          setControlsVisible(false);
        }, 4000);
      };

      resetHideTimer();
      window.addEventListener('touchstart', resetHideTimer);
      window.addEventListener('mousemove', resetHideTimer);

      return () => {
        if (autoHideTimeoutRef.current) clearTimeout(autoHideTimeoutRef.current);
        window.removeEventListener('touchstart', resetHideTimer);
        window.removeEventListener('mousemove', resetHideTimer);
      };
    }
  }, [callType, callState]);

  if (callState === 'idle') return null;

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const partnerDisplayName = callerInfo?.name || partner?.name || 'My Love';
  const partnerAvatar = resolveMediaUrl(callerInfo?.avatar || partner?.avatarUrl, partnerDisplayName);

  return (
    <div className="fixed inset-0 z-50 bg-[#07070C] flex flex-col justify-between overflow-hidden select-none safe-top safe-bottom">
      {/* Hidden audio element dedicated to crystal clear remote audio playback */}
      <audio ref={remoteAudioRef} autoPlay playsInline />
      {/* ----------------------------------------------------------------- */}
      {/* INCOMING CALL SCREEN */}
      {/* ----------------------------------------------------------------- */}
      {callState === 'ringing' && (
        <div className="flex-1 flex flex-col items-center justify-between p-8 text-center bg-radial-gradient from-[#171722] via-[#07070C] to-[#07070C]">
          <div className="mt-12 flex flex-col items-center">
            <span className="text-xs uppercase tracking-widest text-[#FF91B5] font-semibold mb-2">
              Incoming {callType === 'video' ? 'Video' : 'Voice'} Call
            </span>
            <h2 className="text-2xl font-bold text-white">{partnerDisplayName}</h2>
            <p className="text-xs text-[#A7A7B7] mt-1">A Heaven Made for Two.</p>
          </div>

          {/* Animated Avatar Ring */}
          <div className="relative my-8">
            <div className="w-36 h-36 rounded-full border-4 border-[#FF4F81] p-1 animate-pulse shadow-glow-pink">
              <img
                src={partnerAvatar}
                alt={partnerDisplayName}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <span className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[#42D392] flex items-center justify-center text-black font-bold">
              {callType === 'video' ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
            </span>
          </div>

          {/* Incoming Call Action Controls */}
          <div className="w-full max-w-xs flex items-center justify-around mb-8">
            {/* Decline */}
            <div className="flex flex-col items-center space-y-2">
              <button
                onClick={() => rejectCall('declined')}
                className="w-16 h-16 rounded-full bg-[#FF5570] text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform"
              >
                <PhoneOff className="w-7 h-7" />
              </button>
              <span className="text-xs text-white/70">Decline</span>
            </div>

            {/* Accept */}
            <div className="flex flex-col items-center space-y-2">
              <button
                onClick={acceptCall}
                className="w-16 h-16 rounded-full bg-[#42D392] text-white flex items-center justify-center shadow-[0_0_25px_#42D392] hover:scale-105 active:scale-95 transition-transform animate-bounce"
              >
                <Phone className="w-7 h-7 fill-current" />
              </button>
              <span className="text-xs text-white/70">Accept</span>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* CONNECTED / CALLING SCREEN */}
      {/* ----------------------------------------------------------------- */}
      {(callState === 'connected' || callState === 'initiated') && (
        <div className="relative flex-1 flex flex-col justify-between h-full">
          {/* VIDEO CALL LAYOUT */}
          {callType === 'video' ? (
            <div className="absolute inset-0 z-0 bg-black">
              {/* Fullscreen Remote Video */}
              {remoteStream ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <img
                    src={partnerAvatar}
                    alt={partnerDisplayName}
                    className="w-24 h-24 rounded-full object-cover border-2 border-[#FF4F81] mb-3"
                  />
                  <p className="text-sm text-white/70">Connecting video feed...</p>
                </div>
              )}

              {/* Floating PiP Local Video */}
              {localStream && !isVideoOff && (
                <motion.div
                  drag
                  dragConstraints={{ left: 10, right: 240, top: 20, bottom: 400 }}
                  className="absolute top-16 right-4 z-20 w-28 h-40 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-black"
                >
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform scale-x-[-1]"
                  />
                </motion.div>
              )}
            </div>
          ) : (
            /* VOICE CALL LAYOUT */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-radial-gradient from-[#171722] via-[#07070C] to-[#07070C]">
              {/* 3D Glowing Relationship Avatar */}
              <div className="relative mb-6">
                <div className="w-40 h-40 rounded-full border-4 border-[#9B5CFF] p-1.5 shadow-[0_0_30px_rgba(155,92,255,0.4)]">
                  <img
                    src={partnerAvatar}
                    alt={partnerDisplayName}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-[#FF4F81] animate-ping opacity-25" />
              </div>

              <h2 className="text-2xl font-bold text-white">{partnerDisplayName}</h2>
              <span className="text-sm text-[#FF91B5] font-mono font-semibold mt-1">
                {callState === 'connected' ? formatDuration(callDuration) : 'Calling...'}
              </span>

              {/* Connection Quality Pill */}
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-white/70 mt-4">
                <Radio className="w-3 h-3 text-[#42D392]" />
                <span>Encrypted • Quality: {connectionQuality}</span>
              </div>
            </div>
          )}

          {/* Top Status Bar Controls */}
          <AnimatePresence>
            {controlsVisible && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="relative z-30 p-4 flex items-center justify-between glass-panel mx-4 mt-2 rounded-2xl backdrop-blur-xl border border-white/10"
              >
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#42D392] animate-pulse" />
                  <span className="text-xs font-semibold text-white">{partnerDisplayName}</span>
                  <span className="text-[11px] font-mono text-[#A7A7B7]">
                    ({callState === 'connected' ? formatDuration(callDuration) : 'Connecting'})
                  </span>
                </div>

                {/* Call Recording Status / Trigger */}
                <div className="flex items-center space-x-2">
                  {isRecording ? (
                    <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-[#FF5570]/20 border border-[#FF5570] text-[10px] text-[#FF5570] font-semibold animate-pulse">
                      <Disc className="w-3 h-3 animate-spin" />
                      <span>Recording</span>
                    </span>
                  ) : (
                    <button
                      onClick={requestRecording}
                      title="Request Consent to Record"
                      className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-white/80 transition-colors"
                    >
                      Record Call
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom Floating Glass Controls */}
          <AnimatePresence>
            {controlsVisible && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
                className="relative z-30 p-4 mx-4 mb-4 glass-panel rounded-3xl backdrop-blur-2xl border border-white/10 flex items-center justify-around max-w-sm self-center w-full"
              >
                {/* Mute Toggle */}
                <button
                  onClick={toggleMute}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    isMuted ? 'bg-[#FF5570] text-white' : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                {/* Video Toggle (if Video Call) */}
                {callType === 'video' && (
                  <button
                    onClick={toggleVideo}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      isVideoOff ? 'bg-[#FF5570] text-white' : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                  </button>
                )}

                {/* Speaker Toggle */}
                <button
                  onClick={toggleSpeaker}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    isSpeakerOn ? 'bg-[#9B5CFF] text-white' : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </button>

                {/* End Call Button */}
                <button
                  onClick={endCall}
                  className="w-14 h-14 rounded-full bg-[#FF5570] text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform"
                >
                  <PhoneOff className="w-6 h-6" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Dual Consent Call Recording Notification Modal */}
      <AnimatePresence>
        {recordingConsentRequested && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel rounded-3xl p-6 max-w-xs text-center border border-white/20 shadow-2xl"
            >
              <div className="w-12 h-12 rounded-full bg-[#FF5570]/20 text-[#FF5570] flex items-center justify-center mx-auto mb-3">
                <Disc className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Record this call?</h3>
              <p className="text-xs text-[#A7A7B7] mt-1.5">
                {partnerDisplayName} requested to record this call. The encrypted recording will be securely saved to your Private Vault.
              </p>

              <div className="flex items-center space-x-3 mt-6">
                <button
                  onClick={() => respondRecordingConsent(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 text-white/80 hover:bg-white/20 text-xs font-semibold"
                >
                  Decline
                </button>
                <button
                  onClick={() => respondRecordingConsent(true)}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#9B5CFF] to-[#FF4F81] text-white text-xs font-semibold shadow-glow-pink"
                >
                  Consent & Record
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

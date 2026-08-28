import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Send, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceRecorderProps {
  onSendVoice: (audioBlob: Blob, durationMs: number, waveform: number[]) => void;
  onCancel: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onSendVoice, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [amplitudes, setAmplitudes] = useState<number[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const timerRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    startRecording();
    return () => {
      stopTracks();
    };
  }, []);

  const stopTracks = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Setup Web Audio API for live waveform analysis
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateWaveform = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = Math.min(1.0, (sum / bufferLength) / 128);

        setAmplitudes(prev => {
          const next = [...prev, avg];
          return next.slice(-25); // Keep last 25 bars
        });

        animFrameRef.current = requestAnimationFrame(updateWaveform);
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      updateWaveform();

      timerRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      onCancel();
    }
  };

  const handleSend = () => {
    if (!mediaRecorderRef.current) return;

    mediaRecorderRef.current.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const durationMs = duration * 1000;
      onSendVoice(audioBlob, durationMs, amplitudes.length > 0 ? amplitudes : [0.3, 0.6, 0.8, 0.5, 0.7, 0.4]);
      stopTracks();
    };

    mediaRecorderRef.current.stop();
  };

  const handleCancel = () => {
    stopTracks();
    onCancel();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex items-center space-x-3 w-full bg-[#101019] border border-white/10 rounded-2xl px-4 py-2.5 backdrop-blur-xl">
      {/* Delete / Cancel Button */}
      <button
        onClick={handleCancel}
        className="w-8 h-8 rounded-full bg-white/5 text-[#FF5570] hover:bg-[#FF5570]/20 flex items-center justify-center transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {/* Pulsing Recording Indicator & Timer */}
      <div className="flex items-center space-x-2">
        <span className="w-3 h-3 rounded-full bg-[#FF5570] animate-pulse" />
        <span className="text-xs font-mono text-white/90">{formatTime(duration)}</span>
      </div>

      {/* Live Animated Waveform */}
      <div className="flex-1 flex items-center justify-center space-x-1 h-8 px-2">
        {amplitudes.map((amp, idx) => (
          <div
            key={idx}
            className="w-1 bg-gradient-to-t from-[#9B5CFF] to-[#FF4F81] rounded-full transition-all duration-75"
            style={{
              height: `${Math.max(4, amp * 28)}px`,
            }}
          />
        ))}
      </div>

      {/* Send Voice Button */}
      <button
        onClick={handleSend}
        className="w-8 h-8 rounded-full bg-gradient-to-r from-[#9B5CFF] to-[#FF4F81] text-white flex items-center justify-center shadow-glow-pink hover:opacity-90 active:scale-95 transition-all"
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  );
};

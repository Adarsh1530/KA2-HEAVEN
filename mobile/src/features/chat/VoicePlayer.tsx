import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

interface VoicePlayerProps {
  src: string;
  durationMs?: number;
  waveform?: number[];
  isOutgoing?: boolean;
}

export const VoicePlayer: React.FC<VoicePlayerProps> = ({
  src,
  durationMs = 5000,
  waveform = [0.2, 0.4, 0.7, 0.5, 0.8, 0.6, 0.9, 0.4, 0.3, 0.6, 0.5, 0.8, 0.3],
  isOutgoing = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 1
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(src);
    audioRef.current = audio;

    audio.onended = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    audio.ontimeupdate = () => {
      if (audio.duration) {
        setProgress(audio.currentTime / audio.duration);
      }
    };

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.play().catch(console.error);
      setIsPlaying(true);
    }
  };

  const handleCycleSpeed = () => {
    const rates = [1, 1.5, 2];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIdx];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const seekTime = pos * (audioRef.current.duration || (durationMs / 1000));
    audioRef.current.currentTime = seekTime;
    setProgress(pos);
  };

  const formatDuration = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex items-center space-x-2.5 py-1 min-w-[200px] max-w-[260px] select-none">
      {/* Play/Pause Button */}
      <button
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
          isOutgoing
            ? 'bg-white text-[#FF4F81] hover:bg-white/90'
            : 'bg-[#FF4F81] text-white hover:bg-[#FF4F81]/90 shadow-glow-pink'
        }`}
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 ml-0.5 fill-current" />}
      </button>

      {/* Waveform Visualization Bars */}
      <div
        onClick={handleSeek}
        className="flex-1 flex items-center space-x-0.5 h-7 cursor-pointer py-1"
      >
        {waveform.map((amp, idx) => {
          const barFraction = idx / waveform.length;
          const isPassed = progress >= barFraction;

          return (
            <div
              key={idx}
              className={`w-1 rounded-full transition-colors ${
                isPassed
                  ? isOutgoing ? 'bg-white' : 'bg-[#FF4F81]'
                  : isOutgoing ? 'bg-white/40' : 'bg-white/20'
              }`}
              style={{
                height: `${Math.max(4, amp * 22)}px`,
              }}
            />
          );
        })}
      </div>

      {/* Duration & Speed pill */}
      <div className="flex flex-col items-end">
        <span className={`text-[10px] font-mono ${isOutgoing ? 'text-white/90' : 'text-[#A7A7B7]'}`}>
          {formatDuration(durationMs)}
        </span>
        <button
          onClick={handleCycleSpeed}
          className={`text-[9px] px-1.5 py-0.5 rounded font-semibold mt-0.5 transition-colors ${
            isOutgoing ? 'bg-white/20 text-white' : 'bg-white/10 text-[#FF91B5]'
          }`}
        >
          {playbackRate}x
        </button>
      </div>
    </div>
  );
};

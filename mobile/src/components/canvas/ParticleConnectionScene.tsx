import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';

interface ParticleConnectionSceneProps {
  bothOnline?: boolean;
  inCall?: boolean;
  intensity?: number;
  className?: string;
}

export const ParticleConnectionScene: React.FC<ParticleConnectionSceneProps> = ({
  bothOnline = true,
  inCall = false,
  intensity = 1.0,
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { reduceMotion } = useTheme();

  useEffect(() => {
    if (reduceMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth * window.devicePixelRatio);
    let height = (canvas.height = canvas.offsetHeight * window.devicePixelRatio);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      height = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    };
    window.addEventListener('resize', handleResize);

    // Ambient background dust stars
    const starsCount = 35;
    const stars = Array.from({ length: starsCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.6 + 0.2,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
    }));

    let angle = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      // Draw background ambient stars
      stars.forEach(star => {
        star.x += star.vx * intensity;
        star.y += star.vy * intensity;
        if (star.x < 0) star.x = width;
        if (star.x > width) star.x = 0;
        if (star.y < 0) star.y = height;
        if (star.y > height) star.y = 0;

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha * 0.5})`;
        ctx.fill();
      });

      // Orbit dynamics
      const orbitSpeed = (inCall ? 0.035 : bothOnline ? 0.018 : 0.008) * intensity;
      angle += orbitSpeed;

      // Distance between particles (Closer if both online, tightest if in call)
      const baseRadius = inCall ? 45 : bothOnline ? 65 : 95;
      const rx = baseRadius * (width / 400);
      const ry = (baseRadius * 0.55) * (height / 300);

      // Particle 1: Keerthi (Violet)
      const p1X = centerX + Math.cos(angle) * rx;
      const p1Y = centerY + Math.sin(angle) * ry;

      // Particle 2: Anu (Rose Pink)
      const p2X = centerX + Math.cos(angle + Math.PI) * rx;
      const p2Y = centerY + Math.sin(angle + Math.PI) * ry;

      // Central Romantic Glow
      const centerGlow = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, baseRadius * 1.5
      );
      centerGlow.addColorStop(0, bothOnline ? 'rgba(255, 79, 129, 0.18)' : 'rgba(155, 92, 255, 0.08)');
      centerGlow.addColorStop(0.6, 'rgba(155, 92, 255, 0.06)');
      centerGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = centerGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Connecting Beam (during call or active presence)
      if (inCall || bothOnline) {
        ctx.beginPath();
        ctx.moveTo(p1X, p1Y);

        // Gentle curved romantic spline
        const cpX = centerX + Math.sin(angle * 2) * 15;
        const cpY = centerY + Math.cos(angle * 2) * 15;
        ctx.quadraticCurveTo(cpX, cpY, p2X, p2Y);

        const beamGradient = ctx.createLinearGradient(p1X, p1Y, p2X, p2Y);
        beamGradient.addColorStop(0, 'rgba(155, 92, 255, 0.8)');
        beamGradient.addColorStop(0.5, 'rgba(255, 145, 181, 0.9)');
        beamGradient.addColorStop(1, 'rgba(255, 79, 129, 0.8)');

        ctx.strokeStyle = beamGradient;
        ctx.lineWidth = inCall ? 3.5 : 1.8;
        ctx.shadowColor = '#FF4F81';
        ctx.shadowBlur = inCall ? 18 : 8;
        ctx.stroke();
        ctx.shadowBlur = 0; // reset
      }

      // Draw Particle 1: Keerthi
      const grad1 = ctx.createRadialGradient(p1X, p1Y, 0, p1X, p1Y, 18);
      grad1.addColorStop(0, '#FFFFFF');
      grad1.addColorStop(0.3, '#B28CFF');
      grad1.addColorStop(0.7, 'rgba(155, 92, 255, 0.6)');
      grad1.addColorStop(1, 'transparent');
      ctx.fillStyle = grad1;
      ctx.beginPath();
      ctx.arc(p1X, p1Y, 18, 0, Math.PI * 2);
      ctx.fill();

      // Core Keerthi dot
      ctx.beginPath();
      ctx.arc(p1X, p1Y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();

      // Draw Particle 2: Anu
      const grad2 = ctx.createRadialGradient(p2X, p2Y, 0, p2X, p2Y, 18);
      grad2.addColorStop(0, '#FFFFFF');
      grad2.addColorStop(0.3, '#FF91B5');
      grad2.addColorStop(0.7, 'rgba(255, 79, 129, 0.6)');
      grad2.addColorStop(1, 'transparent');
      ctx.fillStyle = grad2;
      ctx.beginPath();
      ctx.arc(p2X, p2Y, 18, 0, Math.PI * 2);
      ctx.fill();

      // Core Anu dot
      ctx.beginPath();
      ctx.arc(p2X, p2Y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [bothOnline, inCall, intensity, reduceMotion]);

  if (reduceMotion) {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        <div className="w-28 h-28 rounded-full bg-gradient-to-r from-[#9B5CFF]/20 to-[#FF4F81]/20 blur-xl animate-pulse" />
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full block pointer-events-none ${className}`}
      style={{ opacity: 0.95 }}
    />
  );
};

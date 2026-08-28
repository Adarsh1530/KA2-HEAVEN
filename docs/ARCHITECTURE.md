# KA² — HEAVEN System Architecture

## 1. Executive Architectural Overview

**KA² — HEAVEN** is an ultra-private, romantic, realtime communication and memories ecosystem built exclusively for **Keerthi Adarsh** (Administrator & Partner) and **Anu Sri** (Partner).

```
┌─────────────────────────────────────────────────────────────┐
│                    KA² — HEAVEN CLIENTS                    │
│   ┌──────────────────────────┐  ┌───────────────────────┐   │
│   │   Mobile Client (Web/PWA)│  │   Admin Web Dashboard │   │
│   │   - 3D Particle Canvas   │  │   - Live Theme Mockup │   │
│   │   - WebRTC Voice/Video   │  │   - System Health     │   │
│   │   - Encrypted Vault (AES)│  │   - Session Audit     │   │
│   └─────────────▲────────────┘  └───────────▲───────────┘   │
└─────────────────┼───────────────────────────┼───────────────┘
                  │ HTTPS REST + WebSocket    │ HTTPS REST
                  ▼                           ▼
┌─────────────────────────────────────────────────────────────┐
│             KA² REALTIME BACKEND & SIGNALING                │
│   - Node.js & TypeScript Express Engine                     │
│   - Socket.IO Realtime Gateway (Presence, Chat, WebRTC)     │
│   - JWT Auth with Refresh Token Rotation & PIN Guard        │
│   - Multer Storage & Media Stream Pipeline                  │
└──────────────────────────────┬──────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
┌──────────────────────────────┐    ┌─────────────────────────┐
│     POSTGRESQL DATABASE      │    │  ENCRYPTED MEDIA VAULT  │
│  - Users, Messages, Calls    │    │  - Photos, Videos       │
│  - Memories, Love Notes      │    │  - Voice Notes          │
│  - Vault Items (Ciphertext)  │    │  - Call Recordings      │
└──────────────────────────────┘    └─────────────────────────┘
```

---

## 2. Tier Breakdown

### 2.1 Mobile Client (`/mobile`)
- **Framework**: React 19 + TypeScript + Vite + Tailwind CSS.
- **Atmospheric Visuals**: 60 FPS GPU-accelerated HTML5 Canvas 3D particle relation engine that binds Keerthi and Anu's presence dynamically.
- **Audio & Video Engine**: Native Web Audio API for recording live waveforms with audio player scrubbers (1x, 1.5x, 2x speeds) and WebRTC RTCPeerConnection for encrypted 1-to-1 video/audio calls.
- **Zero-Knowledge Vault**: WebCrypto API deriving 256-bit AES-GCM keys from user security PIN via PBKDF2 (100,000 SHA-256 iterations).

### 2.2 Backend & WebRTC Signaling (`/backend`)
- **Engine**: Express.js with TypeScript and Socket.IO.
- **WebRTC Signaling**: Session Description Protocol (SDP) and ICE candidate forwarder over secure WebSockets.
- **Authentication**: Dual-tier JWT (15-minute short-lived Access Token + 30-day rotatable Refresh Token) + Bcrypt PIN verification.
- **Storage**: Multi-MIME file handler storing protected assets with strict authentication checks.

### 2.3 Admin Console (`/admin`)
- **Purpose**: Infrastructure management, realtime telemetry, active hardware session revocation, and dynamic live theme publishing with side-by-side interactive mobile device preview.
- **Zero-Knowledge Privacy Separation**: The admin interface has strictly zero visibility into private E2EE conversation content or decrypted personal vault items.

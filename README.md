# KA² — HEAVEN

<div align="center">
  <img src="./mobile/public/favicon.svg" width="96" height="96" alt="KA² Monogram" />
  <h1>KA² — HEAVEN</h1>
  <p><strong>A Heaven Made for Two.</strong></p>
  <p><em>Where It’s Just Us. ❤️</em></p>
</div>

---

## 🌹 About KA² — HEAVEN

**KA² — HEAVEN** is an ultra-private, realtime communication and memories application built exclusively for two people:
- **Keerthi Adarsh** (Administrator & Partner)
- **Anu Sri** (Partner)

The brand **KA²** embodies **K**eerthi **A**darsh + **²** (Anu / the second half of the relationship) as one private digital universe.

---

## ✨ Features

- 🌌 **Cinematic 3D Particle Connection Atmosphere**: GPU-accelerated 60 FPS HTML5 Canvas engine where Keerthi and Anu's orbiting particles dynamically react to presence and calls.
- 🎬 **Startup Brand Animation**: 2.5-second cinematic reveal sequence with orbiting particles, light burst, geometric monogram emergence, and smooth entrance into Heaven.
- 💬 **Realtime Private Chat**: Realtime messaging with Socket.IO, text, rich emojis, reactions, replies, soft deletion, editing, delivery/read receipts, search, and 3-particle gentle typing indicators.
- 🎙️ **Voice Notes**: Hold-to-record with live Web Audio API waveform visualization, duration timer, and audio player with 1x / 1.5x / 2x playback speed controls.
- 📞 **WebRTC Voice & Video Calling**: True 1-to-1 encrypted voice and video calling with fullscreen remote view, floating draggable PiP camera, mute/speaker toggles, and dual-consent call recording archived to Private Vault.
- ❤️ **Our Memories Gallery**: Masonry gallery categorized by All, Photos, Videos, Voice, and Favourites with smooth fullscreen lightbox modal.
- 🔐 **Private Vault (Dual Privacy)**: Separate **OUR VAULT** (shared) and **MY PRIVATE VAULT** (personal) protected by PIN / Biometrics and client-side AES-256-GCM zero-knowledge encryption.
- 💌 **Love Notes**: Heartfelt letter composer and envelope unfolding animation with stationery styles (Parchment, Rose Gold, Midnight, Celestial) and wax seal.
- 📖 **Our Story / Timeline**: Chronological relationship milestones and memories.
- 👑 **Admin Console & Live Theme Customizer**: Realtime system health, telemetry, hardware sessions manager, audit logs, and live interactive device mockup preview.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Run All Services Concurrently
```bash
npm run dev
```
- **Backend Realtime API**: `http://localhost:5000`
- **Mobile Application**: `http://localhost:5173`
- **Admin Dashboard**: `http://localhost:5174`

---

## 🔑 Initial Pre-configured Credentials

| User | Email | Password | Default PIN | Role |
|---|---|---|---|---|
| **Keerthi Adarsh** | `keerthi@ka2heaven.local` | `Keerthi@Heaven2026!` | `2808` | Administrator |
| **Anu Sri** | `anu@ka2heaven.local` | `AnuSri@Heaven2026!` | `2808` | Partner |

---

## 🧪 Testing

Run comprehensive backend API, auth, chat, presence, vault isolation, and admin protection tests:
```bash
npm run test
```

---

## 📚 Documentation
- [Architecture Overview](docs/ARCHITECTURE.md)
- [API Reference](docs/API.md)
- [Security & Encryption](docs/SECURITY.md)
- [Production Deployment](docs/DEPLOYMENT.md)

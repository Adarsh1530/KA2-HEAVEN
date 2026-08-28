# KA² — HEAVEN Production Deployment Guide

## 1. Prerequisites
- Node.js 18+ (tested on Node v24 LTS)
- PostgreSQL 14+ (or embedded SQLite for local/self-hosted single instances)
- TLS / HTTPS Certificates (Let's Encrypt / Cloudflare)
- WebRTC STUN/TURN server (e.g. Coturn or Twilio/Xirsys TURN)

---

## 2. Environment Setup

Copy `.env.example` to `.env` in the root folder:

```bash
cp .env.example .env
```

Configure your production secrets:
```ini
NODE_ENV=production
PORT=5000
CLIENT_URL=https://heaven.ka2.world
ADMIN_URL=https://admin.ka2.world

DATABASE_URL=postgresql://postgres:SecurePass@db.ka2.world:5432/ka2_heaven
JWT_ACCESS_SECRET=your_super_strong_production_access_secret_2026
JWT_REFRESH_SECRET=your_super_strong_production_refresh_secret_2026

STUN_SERVER_1=stun:stun.l.google.com:19302
TURN_SERVER_URL=turn:turn.ka2.world:3478
TURN_USERNAME=ka2user
TURN_CREDENTIAL=ka2secret
```

---

## 3. Installation & Build

```bash
# 1. Install all dependencies across workspaces
npm run install:all

# 2. Build all workspaces (shared -> backend -> mobile -> admin)
npm run build

# 3. Run automated tests
npm run test
```

---

## 4. Production Service Launch (PM2 / Systemd)

```bash
# Start backend server
cd backend
NODE_ENV=production node dist/server.js
```

Static frontend builds in `mobile/dist` and `admin/dist` can be served via NGINX or Caddy.

### Sample NGINX Configuration:
```nginx
# Mobile Web Client
server {
    server_name heaven.ka2.world;
    root /var/www/ka2-heaven/mobile/dist;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
}

# Admin Console
server {
    server_name admin.ka2.world;
    root /var/www/ka2-heaven/admin/dist;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
}

# Realtime API & WebSockets
server {
    server_name api.ka2.world;
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

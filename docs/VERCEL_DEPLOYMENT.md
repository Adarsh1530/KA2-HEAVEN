# KA² — HEAVEN Vercel Live Deployment Guide

This guide explains how to deploy the **KA² — HEAVEN Mobile App** and **Admin Console** live on **Vercel** with full HTTPS and custom domain support.

---

## 1. Quick Deploy via Vercel CLI (Recommended)

### Deploying the Mobile Web App
```bash
cd mobile
npx vercel --prod
```
When prompted:
- **Set up and deploy?**: `y`
- **Which scope?**: Select your Vercel account
- **Link to existing project?**: `n`
- **Project name**: `ka2-heaven`
- **In which directory is your code located?**: `./`
- **Override settings?**: `n` (Vercel automatically detects `vercel.json` and Vite)

### Deploying the Admin Console
```bash
cd admin
npx vercel --prod
```
- **Project name**: `ka2-heaven-admin`

---

## 2. Deploying via GitHub & Vercel Dashboard

1. Push your repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: KA2 Heaven production release"
   git remote add origin https://github.com/<your-username>/ka2-heaven.git
   git push -u origin main
   ```
2. Open **[Vercel Dashboard](https://vercel.com/new)** and click **"Add New Project"**.
3. Import your `ka2-heaven` repository.
4. **For Mobile App**:
   - **Root Directory**: `mobile`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Environment Variables**:
     - `VITE_API_URL`: `https://api.yourdomain.com/api` (or your Render/Railway backend URL)
     - `VITE_SOCKET_URL`: `https://api.yourdomain.com`
5. Click **"Deploy"**!

---

## 3. Realtime Backend Hosting (Socket.IO + WebRTC)

Vercel provides edge and serverless functions for HTTP APIs. For persistent WebSockets (realtime chat, presence, and WebRTC signaling), host the Node.js backend on:

### Free Cloud Deployment Options:
1. **Render.com** (Web Service):
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
2. **Railway.app** (1-Click Node.js Service)
3. **Fly.io** or a **VPS / Docker Container**

Once deployed, set `VITE_API_URL` and `VITE_SOCKET_URL` in your Vercel project environment variables!

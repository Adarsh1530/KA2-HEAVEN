# KA² — HEAVEN Android Live APK & Installation Guide

This guide explains the multiple ways to download, install, and run **KA² — HEAVEN** directly on Android devices.

---

## 📱 Method 1: Instant PWA Install (Zero Build Required)

Both Keerthi and Anu can immediately install **KA² — HEAVEN** as a full standalone app without manual APK installation:

1. Open your live Vercel URL (e.g. `https://ka2-heaven.vercel.app`) in **Google Chrome** on your Android device (or **Safari** on iOS).
2. Tap the **Chrome menu (⋮)** or **Share button (iOS)**.
3. Tap **"Add to Home screen"** / **"Install App"**.
4. The **KA²** app icon will appear directly in your phone's app drawer with:
   - Fullscreen immersive mode (no browser URL bars)
   - Dark theme `#07070C` splash screen
   - Direct camera, microphone, and WebRTC access
   - Offline cached luxury assets

---

## 📦 Method 2: Automated GitHub Actions Cloud APK Build

Your repository includes an automated GitHub Actions CI/CD workflow (`.github/workflows/build-apk.yml`) that builds `KA2-HEAVEN.apk` in the cloud:

1. Push your repository to GitHub:
   ```bash
   git push origin main
   ```
2. Navigate to your repository on GitHub and click the **Actions** tab.
3. Select **"Build KA² — HEAVEN Android Live APK"**.
4. Click **"Run workflow"**.
5. Once complete (approx 2 minutes), download the generated **`KA2-HEAVEN.apk`** artifact from the workflow summary or from **Releases**.
6. Open the `.apk` on your Android phone and tap **Install**!

---

## 🛠️ Method 3: Local Android Studio Build

If you have Android Studio installed on your computer:

```bash
# 1. Build the mobile web assets
npm run build:shared
npm run build:mobile

# 2. Sync web assets with Capacitor Android
cd mobile
npx cap sync android

# 3. Open project in Android Studio
npx cap open android
```

In Android Studio:
- Click **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
- Locate the output `app-debug.apk` in `mobile/android/app/build/outputs/apk/debug/`.
- Transfer to your phone and install!

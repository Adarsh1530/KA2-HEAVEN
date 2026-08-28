# KA² — HEAVEN Flutter Native Android APK Project

This project packages **KA² — HEAVEN** into a native Android APK using **Flutter** and **Visual Studio Code**.

---

## 🚀 How to Build the APK in Visual Studio Code (Step-by-Step)

### Prerequisites:
1. Install [Flutter SDK](https://docs.flutter.dev/get-started/install/windows)
2. In **Visual Studio Code**, install the **Flutter** extension (`Dart-Code.flutter`).

---

### Step 1: Open the Project in Visual Studio Code
1. Open Visual Studio Code.
2. Click **File** > **Open Folder...**
3. Select `D:\KA2\flutter_app`

---

### Step 2: Fetch Flutter Packages
Open the integrated terminal in VS Code (`Ctrl + ~`) and run:
```bash
flutter pub get
```

---

### Step 3: Build the Android Release APK
Run:
```bash
flutter build apk --release
```

---

### Step 4: Locate Your APK File
Once the build completes, your installable APK will be at:
```
D:\KA2\flutter_app\build\app\outputs\flutter-apk\app-release.apk
```
Transfer `app-release.apk` to your Android phone and install!

---

## 📱 Features Included in this Flutter Build:
- **Full Hardware WebRTC Access**: Camera and Microphone pre-configured for live voice and video calling.
- **Photo & File Picker**: Directly opens phone gallery/camera when tapping change photo, chat media, or memories.
- **Cinematic Romantic Splash Screen**: Displays KA² glowing monogram during startup.
- **Status Bar & Navigation**: Styled with Dark Luxury `#07070C` immersion.

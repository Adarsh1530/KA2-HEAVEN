import os
import sys

def configure_android():
    print("[KA2 CI] Configuring Android Manifest and Gradle settings...")
    
    # 1. Update AndroidManifest.xml
    manifest_path = "android/app/src/main/AndroidManifest.xml"
    if os.path.exists(manifest_path):
        with open(manifest_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        permissions = """
    <uses-permission android:name="android.permission.INTERNET"/>
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>
    <uses-permission android:name="android.permission.CAMERA"/>
    <uses-permission android:name="android.permission.RECORD_AUDIO"/>
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS"/>
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES"/>
    <uses-permission android:name="android.permission.READ_MEDIA_VIDEO"/>
    <uses-permission android:name="android.permission.READ_MEDIA_AUDIO"/>
    <uses-permission android:name="android.permission.VIBRATE"/>
    <uses-permission android:name="android.permission.WAKE_LOCK"/>
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>

    <uses-feature android:name="android.hardware.camera" android:required="false"/>
    <uses-feature android:name="android.hardware.camera.autofocus" android:required="false"/>
    <uses-feature android:name="android.hardware.microphone" android:required="false"/>
"""
        if "<application" in content and "android.permission.CAMERA" not in content:
            content = content.replace("<application", permissions + '\n    <application android:usesCleartextTraffic="true"', 1)
            
        with open(manifest_path, "w", encoding="utf-8") as f:
            f.write(content)
        print("[KA2 CI] AndroidManifest.xml updated successfully.")
    else:
        print("[KA2 CI] Warning: AndroidManifest.xml not found at", manifest_path)

    # 2. Update android/app/build.gradle for minSdkVersion 24
    gradle_path = "android/app/build.gradle"
    if os.path.exists(gradle_path):
        with open(gradle_path, "r", encoding="utf-8") as f:
            gcontent = f.read()
            
        gcontent = gcontent.replace("minSdkVersion = flutter.minSdkVersion", "minSdkVersion = 24")
        gcontent = gcontent.replace("minSdkVersion flutter.minSdkVersion", "minSdkVersion 24")
        
        with open(gradle_path, "w", encoding="utf-8") as f:
            f.write(gcontent)
        print("[KA2 CI] android/app/build.gradle updated with minSdkVersion 24.")
    else:
        print("[KA2 CI] Warning: build.gradle not found at", gradle_path)

if __name__ == "__main__":
    configure_android()

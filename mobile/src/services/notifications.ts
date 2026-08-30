/**
 * KA² — HEAVEN Universal Notification & Audio Chime Service
 * Supports Foreground, Background, and Lockscreen Notifications with Vibration
 */

class NotificationService {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private ringtoneInterval: any = null;

  constructor() {
    this.initServiceWorker();
  }

  private async initServiceWorker() {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js');
        this.swRegistration = reg;
        console.log('[NotificationService] ServiceWorker registered');
      } catch (err) {
        console.warn('[NotificationService] ServiceWorker registration failed:', err);
      }
    }
  }

  public async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    try {
      const perm = await Notification.requestPermission();
      return perm === 'granted';
    } catch {
      return false;
    }
  }

  public isPermissionGranted(): boolean {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    return Notification.permission === 'granted';
  }

  // Play Romantic Audio Chime (Message tone)
  public playMessageChime() {
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Gentle romantic 2-tone chime (F5 -> A5)
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(698.46, now); // F5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1046.5, now + 0.05); // C6

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now + 0.05);
      osc1.stop(now + 0.5);
      osc2.stop(now + 0.5);
    } catch {}
  }

  // Play Continuous Romantic Call Ringtone
  public startCallRingtone() {
    this.stopCallRingtone();
    const playTone = () => {
      try {
        const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(480, now + 0.2);
        osc.frequency.setValueAtTime(440, now + 0.4);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.8);
      } catch {}
    };

    playTone();
    this.ringtoneInterval = setInterval(playTone, 2000);
  }

  public stopCallRingtone() {
    if (this.ringtoneInterval) {
      clearInterval(this.ringtoneInterval);
      this.ringtoneInterval = null;
    }
  }

  // Show Lockscreen / Background Incoming Call Alert
  public async notifyIncomingCall(callerName: string, callType: 'voice' | 'video', callId: string) {
    this.startCallRingtone();

    // Vibrate device (pattern: vibrate 500ms, pause 200ms, repeat)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([500, 200, 500, 200, 500, 200, 500]);
      } catch {}
    }

    const title = `Incoming ${callType === 'video' ? 'Video' : 'Voice'} Call ❤️`;
    const body = `${callerName} is calling you in Our Heaven...`;

    if (this.swRegistration && 'showNotification' in this.swRegistration) {
      try {
        await this.swRegistration.showNotification(title, {
          body,
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          tag: `call-${callId}`,
          renotify: true,
          requireInteraction: true,
          data: { callId, type: 'call' },
        });
        return;
      } catch {}
    }

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.svg',
          tag: `call-${callId}`,
          requireInteraction: true,
        });
      } catch {}
    }
  }

  // Show New Message Alert
  public async notifyNewMessage(senderName: string, content: string) {
    this.playMessageChime();

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([200, 100, 200]);
      } catch {}
    }

    // Only show system notification if tab is hidden / phone locked
    if (typeof document !== 'undefined' && !document.hidden) {
      return;
    }

    const title = `${senderName} ❤️`;
    const body = content.length > 60 ? `${content.substring(0, 57)}...` : content;

    if (this.swRegistration && 'showNotification' in this.swRegistration) {
      try {
        await this.swRegistration.showNotification(title, {
          body,
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          tag: 'ka2-new-message',
          renotify: true,
        });
        return;
      } catch {}
    }

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.svg',
          tag: 'ka2-new-message',
        });
      } catch {}
    }
  }
}

export const notificationService = new NotificationService();

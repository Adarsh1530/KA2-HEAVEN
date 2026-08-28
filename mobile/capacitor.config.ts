import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'world.ka2.heaven',
  appName: 'KA² — HEAVEN',
  webDir: 'dist',
  bundledWebRuntime: false,
  backgroundColor: '#07070C',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2500,
      backgroundColor: '#07070C',
      showSpinner: false,
      androidSpinnerStyle: 'large',
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;

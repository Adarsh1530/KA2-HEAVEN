/**
 * KA² — HEAVEN Shared Constants & Brand Definitions
 */

export const BRAND = {
  SHORT_NAME: 'KA²',
  NAME: 'KA² — HEAVEN',
  PRIMARY_TAGLINE: 'A Heaven Made for Two.',
  SECONDARY_TAGLINE: 'Where It’s Just Us. ❤️',
  SUPPORTING_TAGLINE: 'Our World. Our Memories. Our Heaven.',
  ADMIN_NAME: 'Keerthi Adarsh',
  PARTNER_NAME: 'Anu Sri',
  ESTABLISHED_DATE: '2026-08-28',
} as const;

export const THEME_PALETTE = {
  // Dark Romantic Luxury (Default)
  dark: {
    primaryBackground: '#07070C',
    secondaryBackground: '#101019',
    surface: '#171722',
    surfaceBorder: 'rgba(255, 255, 255, 0.08)',
    surfaceGlass: 'rgba(23, 23, 34, 0.75)',
    primaryAccent: '#FF4F81', // Rose Pink
    secondaryAccent: '#9B5CFF', // Deep Violet
    softPink: '#FF91B5',
    softViolet: '#B28CFF',
    textPrimary: '#FFFFFF',
    textSecondary: '#A7A7B7',
    textMuted: '#6B6B7F',
    success: '#42D392',
    error: '#FF5570',
    warning: '#FFB156',
    gradientPrimary: 'linear-gradient(135deg, #9B5CFF 0%, #FF4F81 50%, #FF91B5 100%)',
    gradientGlow: 'radial-gradient(circle, rgba(255,79,129,0.25) 0%, rgba(155,92,255,0.15) 50%, transparent 70%)',
    chatBubbleOutgoing: 'linear-gradient(135deg, rgba(155,92,255,0.85) 0%, rgba(255,79,129,0.85) 100%)',
    chatBubbleIncoming: 'rgba(23, 23, 34, 0.85)',
  },
  // Light Heaven
  light: {
    primaryBackground: '#FAF7FA',
    secondaryBackground: '#F2EDF4',
    surface: '#FFFFFF',
    surfaceBorder: 'rgba(155, 92, 255, 0.12)',
    surfaceGlass: 'rgba(255, 255, 255, 0.85)',
    primaryAccent: '#E03369',
    secondaryAccent: '#813FE3',
    softPink: '#F2759D',
    softViolet: '#9973EB',
    textPrimary: '#151520',
    textSecondary: '#66667C',
    textMuted: '#9494A8',
    success: '#27AE60',
    error: '#EB3B5A',
    warning: '#E67E22',
    gradientPrimary: 'linear-gradient(135deg, #813FE3 0%, #E03369 50%, #F2759D 100%)',
    gradientGlow: 'radial-gradient(circle, rgba(224,51,105,0.15) 0%, rgba(129,63,227,0.1) 50%, transparent 70%)',
    chatBubbleOutgoing: 'linear-gradient(135deg, #813FE3 0%, #E03369 100%)',
    chatBubbleIncoming: '#FFFFFF',
  }
} as const;

export const SOCKET_EVENTS = {
  // Connection & Auth
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  AUTHENTICATE: 'authenticate',
  AUTHENTICATED: 'authenticated',
  UNAUTHORIZED: 'unauthorized',

  // Presence & State
  PRESENCE_UPDATE: 'presence:update',
  PRESENCE_SYNC: 'presence:sync',
  HEARTBEAT: 'presence:heartbeat',

  // Chat & Messaging
  MESSAGE_SEND: 'chat:message_send',
  MESSAGE_RECEIVE: 'chat:message_receive',
  MESSAGE_EDIT: 'chat:message_edit',
  MESSAGE_DELETE: 'chat:message_delete',
  MESSAGE_REACT: 'chat:message_react',
  MESSAGE_READ: 'chat:message_read',
  MESSAGE_DELIVERED: 'chat:message_delivered',
  TYPING_START: 'chat:typing_start',
  TYPING_STOP: 'chat:typing_stop',

  // WebRTC Audio & Video Calling
  CALL_INITIATE: 'call:initiate',
  CALL_INCOMING: 'call:incoming',
  CALL_ACCEPT: 'call:accept',
  CALL_REJECT: 'call:reject',
  CALL_BUSY: 'call:busy',
  CALL_END: 'call:end',
  CALL_SIGNAL_OFFER: 'call:signal_offer',
  CALL_SIGNAL_ANSWER: 'call:signal_answer',
  CALL_SIGNAL_ICE: 'call:signal_ice',
  CALL_STATE_CHANGE: 'call:state_change',
  CALL_RECORDING_REQUEST: 'call:recording_request',
  CALL_RECORDING_CONSENT: 'call:recording_consent',
  CALL_RECORDING_STATE: 'call:recording_state',

  // System & Config
  APP_CONFIG_UPDATE: 'system:config_update',
  NOTIFICATION_BROADCAST: 'system:notification_broadcast',
} as const;

export const INITIAL_APP_SETTINGS = {
  appName: 'KA² — HEAVEN',
  shortBrandMark: 'KA²',
  tagline: 'A Heaven Made for Two.',
  secondaryTagline: 'Where It’s Just Us. ❤️',
  primaryColor: '#FF4F81',
  secondaryColor: '#9B5CFF',
  themeMode: 'dark' as const,
  particleIntensity: 1.0,
  reduceMotion: false,
  soundEffectsEnabled: true,
  hapticFeedbackEnabled: true,
  autoLockTimeoutSeconds: 60,
  biometricsEnabled: true,
  e2eeEnabled: true,
  callRecordingAllowed: true,
  chatWallpaper: 'ambient-nebula',
  maxUploadSizeMB: 50,
};

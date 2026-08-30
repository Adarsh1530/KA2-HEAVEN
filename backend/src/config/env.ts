import dotenv from 'dotenv';
import path from 'path';

// Load .env from root or backend directory
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  host: process.env.HOST || '0.0.0.0',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  adminUrl: process.env.ADMIN_URL || 'http://localhost:5174',

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'ka2_heaven_access_secret_2026_romantic_luxury',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'ka2_heaven_refresh_secret_2026_romantic_luxury',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  db: {
    type: process.env.DB_TYPE || 'sqlite',
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ka2_heaven',
    sqlitePath: process.env.SQLITE_DB_PATH || path.resolve(__dirname, '../../data/ka2_heaven.json'),
  },

  storage: {
    uploadDir: path.resolve(__dirname, '../../uploads'),
    maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || '50', 10),
  },

  seed: {
    adminEmail: process.env.ADMIN_EMAIL || 'keerthi@ka2heaven.local',
    adminPassword: process.env.ADMIN_PASSWORD || 'Keerthi@Heaven2026!',
    adminName: 'Keerthi Adarsh',
    userEmail: process.env.USER_EMAIL || 'anu@ka2heaven.local',
    userPassword: process.env.USER_PASSWORD || 'AnuSri@Heaven2026!',
    userName: 'Anu Sri',
    defaultPin: process.env.ADMIN_INITIAL_PIN || '2808',
  },

  webrtc: {
    stunServers: [
      process.env.STUN_SERVER_1 || 'stun:stun.l.google.com:19302',
      process.env.STUN_SERVER_2 || 'stun:stun1.l.google.com:19302',
      process.env.STUN_SERVER_3 || 'stun:stun2.l.google.com:19302',
      process.env.STUN_SERVER_4 || 'stun:stun.cloudflare.com:3478',
      process.env.STUN_SERVER_5 || 'stun:global.stun.twilio.com:3478',
    ],
    turnServer: process.env.TURN_SERVER_URL || 'turn:openrelay.metered.ca:80',
    turnUsername: process.env.TURN_USERNAME || 'openrelayproject',
    turnCredential: process.env.TURN_CREDENTIAL || 'openrelayproject',
  }
};

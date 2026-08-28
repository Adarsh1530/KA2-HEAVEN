import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app';
import { config } from './config/env';
import { db } from './db';
import { SocketManager } from './sockets/socketManager';

async function bootstrap() {
  try {
    // Initialize Database & Seeds
    console.log('[KA² Backend] Initializing database...');
    await db.init();
    console.log('[KA² Backend] Database initialized & verified.');

    const server = http.createServer(app);

    // Initialize Socket.IO Server
    const io = new SocketIOServer(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
      pingTimeout: 30000,
      pingInterval: 10000,
    });

    const socketManager = new SocketManager(io);

    // Start Listening
    server.listen(config.port, config.host, () => {
      console.log('====================================================');
      console.log(' ✨ KA² — HEAVEN REALTIME BACKEND SERVER');
      console.log(` 🌌 Listening on http://${config.host}:${config.port}`);
      console.log(` 💬 Client App URL: ${config.clientUrl}`);
      console.log(` 🔐 Admin Console: ${config.adminUrl}`);
      console.log(' 🔒 Status: Secure Couple Cloud Active');
      console.log('====================================================');
    });

    // Graceful Shutdown
    const shutdown = async () => {
      console.log('\n[KA² Backend] Gracefully shutting down...');
      await db.persist();
      server.close(() => {
        console.log('[KA² Backend] Server stopped.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

  } catch (error) {
    console.error('Fatal startup error:', error);
    process.exit(1);
  }
}

bootstrap();

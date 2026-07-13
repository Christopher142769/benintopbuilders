import { createApp } from './app.js';
import { connectMongo } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { startCronJobs } from './jobs/crons.js';
import http from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

async function bootstrap() {
  try {
    await connectMongo();
    if (env.nodeEnv !== 'test') startCronJobs();
  } catch (err) {
    logger.warn({ err }, 'Démarrage sans MongoDB (healthcheck reste disponible)');
  }

  const app = createApp();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: env.corsOrigins, credentials: true },
  });
  app.set('io', io);

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('UNAUTHORIZED'));
      const payload = jwt.verify(token, env.jwtAccessSecret);
      socket.userId = payload.sub;
      next();
    } catch {
      next(new Error('UNAUTHORIZED'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.userId}`);
    socket.on('conv:join', (conversationId) => {
      socket.join(`conv:${conversationId}`);
    });
    socket.on('user:typing', ({ conversationId }) => {
      socket.to(`conv:${conversationId}`).emit('user:typing', {
        conversationId,
        userId: socket.userId,
      });
    });
  });

  server.listen(env.port, () => {
    logger.info(`BTB API écoute sur http://localhost:${env.port}`);
  });
}

bootstrap();

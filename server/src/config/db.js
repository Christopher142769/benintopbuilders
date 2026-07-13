import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';

const MAX_RETRIES = 10;
const RETRY_DELAY_MS = 2000;

export async function connectMongo(retries = MAX_RETRIES) {
  mongoose.set('strictQuery', true);

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await mongoose.connect(env.mongodbUri, {
        serverSelectionTimeoutMS: 5000,
      });
      logger.info({ uri: env.mongodbUri.replace(/\/\/.*@/, '//***@') }, 'MongoDB connected');
      return mongoose.connection;
    } catch (err) {
      logger.error({ err, attempt, retries }, 'MongoDB connection failed');
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
    }
  }
  return null;
}

export async function disconnectMongo() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

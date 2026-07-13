import { createApp } from './app.js';
import { connectMongo } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { startCronJobs } from './jobs/crons.js';

async function bootstrap() {
  try {
    await connectMongo();
    if (env.nodeEnv !== 'test') startCronJobs();
  } catch (err) {
    logger.warn({ err }, 'Démarrage sans MongoDB (healthcheck reste disponible)');
  }

  const app = createApp();
  app.listen(env.port, () => {
    logger.info(`BTB API écoute sur http://localhost:${env.port}`);
  });
}

bootstrap();

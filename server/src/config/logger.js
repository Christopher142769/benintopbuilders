import pino from 'pino';
import { env, isProd } from './env.js';

export const logger = pino({
  level: process.env.LOG_LEVEL || (isProd ? 'info' : 'debug'),
  transport: isProd
    ? undefined
    : {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'SYS:standard' },
      },
  base: { service: 'btb-server', env: env.nodeEnv },
});

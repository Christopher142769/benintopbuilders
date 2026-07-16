const path = require('path');

/**
 * Configuration PM2 — API Bénin Top Builders.
 * Usage :
 *   pm2 startOrReload ecosystem.config.cjs --update-env
 *   pm2 save
 *   pm2 startup   (une fois, pour démarrer PM2 au boot du VPS)
 *
 * Instance unique volontaire : Socket.io (messagerie) partage l'état des
 * salons en mémoire. Passer en cluster nécessiterait un adaptateur Redis.
 */
module.exports = {
  apps: [
    {
      name: 'btb-api',
      cwd: path.join(__dirname, 'server'),
      script: 'src/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      max_memory_restart: '400M',
      autorestart: true,
      time: true,
      out_file: path.join(__dirname, 'logs', 'api-out.log'),
      error_file: path.join(__dirname, 'logs', 'api-error.log'),
    },
  ],
};

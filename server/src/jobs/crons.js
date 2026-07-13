import cron from 'node-cron';
import { logger } from '../config/logger.js';
import { cloturerExpires, resetQuotasMensuels } from '../services/ao.service.js';

export function startCronJobs() {
  // Clôture horaire des AO
  cron.schedule('0 * * * *', async () => {
    try {
      const n = await cloturerExpires();
      if (n) logger.info({ n }, 'AO clôturés automatiquement');
    } catch (err) {
      logger.error({ err }, 'Cron clôture AO');
    }
  });

  // Reset quotas le 1er du mois à 00:05
  cron.schedule('5 0 1 * *', async () => {
    try {
      const n = await resetQuotasMensuels();
      logger.info({ n }, 'Quotas AO mensuels réinitialisés');
    } catch (err) {
      logger.error({ err }, 'Cron quotas AO');
    }
  });

  logger.info('Crons AO démarrés');
}

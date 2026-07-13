import cron from 'node-cron';
import { logger } from '../config/logger.js';
import { cloturerExpires, resetQuotasMensuels } from '../services/ao.service.js';
import { restituerStocksExpires } from '../services/marketplace.service.js';
import { runAdhesionLifecycle } from '../services/adhesion.service.js';

export function startCronJobs() {
  cron.schedule('0 * * * *', async () => {
    try {
      const n = await cloturerExpires();
      if (n) logger.info({ n }, 'AO clôturés automatiquement');
    } catch (err) {
      logger.error({ err }, 'Cron clôture AO');
    }
  });

  cron.schedule('5 0 1 * *', async () => {
    try {
      const n = await resetQuotasMensuels();
      logger.info({ n }, 'Quotas AO mensuels réinitialisés');
    } catch (err) {
      logger.error({ err }, 'Cron quotas AO');
    }
  });

  cron.schedule('*/10 * * * *', async () => {
    try {
      const n = await restituerStocksExpires();
      if (n) logger.info({ n }, 'Stocks restitués (paiement échoué)');
    } catch (err) {
      logger.error({ err }, 'Cron restitution stock');
    }
  });

  cron.schedule('0 6 * * *', async () => {
    try {
      const result = await runAdhesionLifecycle();
      logger.info(result, 'Cycle adhésion exécuté');
    } catch (err) {
      logger.error({ err }, 'Cron adhésion');
    }
  });

  logger.info('Crons démarrés');
}

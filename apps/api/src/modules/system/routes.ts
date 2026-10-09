import type { AppConfigDto } from '@courtly/shared';
import { Router } from 'express';
import type { AppDeps } from '../../app';

export function systemRoutes({ db, config }: Pick<AppDeps, 'db' | 'config'>) {
  const router = Router();

  router.get('/health', async (_req, res) => {
    await db.$queryRaw`SELECT 1`;
    res.json({ status: 'ok' });
  });

  router.get('/config', (_req, res) => {
    const body: AppConfigDto = { timezone: config.timezone, currency: config.currency };
    res.json(body);
  });

  return router;
}

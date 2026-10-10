import { Router } from 'express';
import type { SystemController } from './controller';

export function systemRoutes({ controller }: { controller: SystemController }) {
  const router = Router();

  router.get('/health', controller.health);
  router.get('/config', controller.appConfig);

  return router;
}

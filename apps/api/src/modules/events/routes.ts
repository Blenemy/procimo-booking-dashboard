import { Router } from 'express';
import type { AuthGuards } from '../auth/middleware';
import type { EventsController } from './controller';

export function eventsRoutes({
  controller,
  auth,
}: {
  controller: EventsController;
  auth: AuthGuards;
}) {
  const router = Router();

  router.get('/events', auth.requireAuth, controller.stream);

  return router;
}

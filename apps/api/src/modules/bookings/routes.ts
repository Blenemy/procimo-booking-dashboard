import { Router } from 'express';
import type { AuthGuards } from '../auth/middleware';
import type { BookingsController } from './controller';

export function bookingsRoutes({
  controller,
  auth,
}: {
  controller: BookingsController;
  auth: AuthGuards;
}) {
  const router = Router();
  const user = [auth.requireAuth, auth.requireRole('USER')];

  router.post('/bookings', ...user, controller.create);

  return router;
}

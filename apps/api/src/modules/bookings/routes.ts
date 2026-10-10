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
  const admin = [auth.requireAuth, auth.requireRole('ADMIN')];

  router.get('/bookings/me', ...user, controller.listMine);
  router.post('/bookings', ...user, controller.create);
  router.post('/bookings/:id/cancel', ...user, controller.cancel);

  router.get('/admin/bookings', ...admin, controller.dayOverview);

  return router;
}

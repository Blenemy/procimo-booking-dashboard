import { Router } from 'express';
import type { AuthGuards } from '../auth/middleware';
import type { CourtsController } from './controller';

export function courtsRoutes({
  controller,
  auth,
}: {
  controller: CourtsController;
  auth: AuthGuards;
}) {
  const router = Router();
  const admin = [auth.requireAuth, auth.requireRole('ADMIN')];

  router.get('/courts', auth.requireAuth, controller.listActive);
  router.get('/courts/:id/availability', auth.requireAuth, controller.availability);

  router.get('/admin/courts', ...admin, controller.listAll);
  router.post('/admin/courts', ...admin, controller.create);
  router.patch('/admin/courts/:id', ...admin, controller.update);

  return router;
}

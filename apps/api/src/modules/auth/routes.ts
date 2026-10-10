import { Router } from 'express';
import type { AuthController } from './controller';
import type { AuthGuards } from './middleware';

export function authRoutes({ controller, auth }: { controller: AuthController; auth: AuthGuards }) {
  const router = Router();

  router.post('/login', controller.login);
  router.post('/logout', controller.logout);
  router.get('/me', auth.requireAuth, controller.me);

  return router;
}

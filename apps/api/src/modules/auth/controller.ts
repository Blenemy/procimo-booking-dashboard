import { loginRequestSchema } from '@courtly/shared';
import type { RequestHandler } from 'express';
import type { Config } from '../../core/config';
import { HTTP_STATUS } from '../../http/status';
import { parse } from '../../http/validate';
import { SESSION_COOKIE, sessionCookieOptions } from './lib/session-cookie';
import { authUser } from './middleware';
import type { AuthService } from './service';

export function createAuthController({
  config,
  service,
}: {
  config: Config;
  service: AuthService;
}) {
  const login: RequestHandler = async (req, res) => {
    const { email, password } = parse(loginRequestSchema, req.body);
    const { user, token } = await service.login(email, password);

    res.cookie(SESSION_COOKIE, token, sessionCookieOptions(config));
    res.json(user);
  };

  const logout: RequestHandler = (_req, res) => {
    res.clearCookie(SESSION_COOKIE, sessionCookieOptions(config));
    res.status(HTTP_STATUS.NO_CONTENT).end();
  };

  const me: RequestHandler = (req, res) => {
    res.json(authUser(req));
  };

  return { login, logout, me };
}

export type AuthController = ReturnType<typeof createAuthController>;

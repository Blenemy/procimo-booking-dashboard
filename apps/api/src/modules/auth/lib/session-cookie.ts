import type { CookieOptions } from 'express';
import type { Config } from '../../../core/config';
import { hoursToMilliseconds } from '../../../core/time';

export const SESSION_COOKIE = 'courtly_session';

export const sessionCookieOptions = (
  config: Pick<Config, 'sessionTtlHours' | 'cookieSecure'>,
): CookieOptions => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: config.cookieSecure,
  path: '/',
  maxAge: hoursToMilliseconds(config.sessionTtlHours),
});

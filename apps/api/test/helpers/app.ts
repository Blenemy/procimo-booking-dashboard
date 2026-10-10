import { createApp } from '../../src/app';
import type { AppDeps } from '../../src/app';
import { systemClock } from '../../src/core/clock';
import { loadConfig } from '../../src/core/config';
import { createLogger } from '../../src/core/logger';
import type { Db } from '../../src/db/client';
import { SESSION_COOKIE } from '../../src/modules/auth/lib/session-cookie';
import { TokenSigner } from '../../src/modules/auth/lib/token-signer';
import { testDatabaseUrl } from './db';

export const testConfig = () =>
  loadConfig({
    NODE_ENV: 'test',
    DATABASE_URL: testDatabaseUrl(),
    FACILITY_TIMEZONE: 'Europe/Lisbon',
    CURRENCY: 'EUR',
    JWT_SECRET: 'test-secret-that-is-at-least-32-characters-long',
  });

export function createTestApp(db: Db, overrides: Partial<Omit<AppDeps, 'db'>> = {}) {
  return createApp({
    config: testConfig(),
    db,
    clock: systemClock,
    logger: createLogger('silent'),
    ...overrides,
  });
}

export const testTokenSigner = () => {
  const { jwtSecret, sessionTtlHours } = testConfig();
  return new TokenSigner(jwtSecret, sessionTtlHours);
};

export const sessionCookie = async (userId: number) =>
  `${SESSION_COOKIE}=${await testTokenSigner().sign(userId)}`;

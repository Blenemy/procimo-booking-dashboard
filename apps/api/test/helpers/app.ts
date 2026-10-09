import { createApp } from '../../src/app';
import type { AppDeps } from '../../src/app';
import { systemClock } from '../../src/clock';
import { loadConfig } from '../../src/config';
import type { Db } from '../../src/db/client';
import { createLogger } from '../../src/logger';
import { testDatabaseUrl } from './db';

export function createTestApp(db: Db, overrides: Partial<Omit<AppDeps, 'db'>> = {}) {
  const config = loadConfig({
    NODE_ENV: 'test',
    DATABASE_URL: testDatabaseUrl(),
    FACILITY_TIMEZONE: 'Europe/Lisbon',
    CURRENCY: 'EUR',
  });
  return createApp({
    config,
    db,
    clock: systemClock,
    logger: createLogger('silent'),
    ...overrides,
  });
}

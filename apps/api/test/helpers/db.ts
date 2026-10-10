import { createPrismaClient } from '../../src/db/client';
import type { Db } from '../../src/db/client';

export function testDatabaseUrl(): string {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error('TEST_DATABASE_URL is not set');
  if (!new URL(url).pathname.endsWith('_test')) {
    throw new Error(`Refusing to run tests against a non-test database: ${url}`);
  }
  return url;
}

const TEST_DB_POOL_SIZE = 20;

export const createTestDb = (): Db => createPrismaClient(testDatabaseUrl(), TEST_DB_POOL_SIZE);

export async function resetDb(db: Db) {
  await db.$transaction([
    db.bookingSlot.deleteMany(),
    db.booking.deleteMany(),
    db.court.deleteMany(),
    db.user.deleteMany(),
  ]);
}

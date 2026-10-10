import type { Role } from '@courtly/shared';
import type { Db } from '../../src/db/client';
import { PasswordHasher } from '../../src/modules/auth/lib/password-hasher';

export const DEFAULT_PASSWORD = 'password123';

const passwordHasher = new PasswordHasher();
let sequence = 0;

export async function createUser(
  db: Db,
  overrides: { email?: string; name?: string; role?: Role; password?: string } = {},
) {
  sequence += 1;
  return db.user.create({
    data: {
      email: overrides.email ?? `user${sequence}@courtly.test`,
      name: overrides.name ?? `User ${sequence}`,
      role: overrides.role ?? 'USER',
      passwordHash: await passwordHasher.hash(overrides.password ?? DEFAULT_PASSWORD),
    },
  });
}

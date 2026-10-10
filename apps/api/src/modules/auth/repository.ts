import type { Role } from '@courtly/shared';
import type { Db } from '../../db/client';

export const createUsersRepository = (db: Db) => ({
  findByEmail: (email: string) => db.user.findUnique({ where: { email } }),
  findById: (id: number) => db.user.findUnique({ where: { id } }),
  count: () => db.user.count(),
  create: (data: { email: string; name: string; role: Role; passwordHash: string }) =>
    db.user.create({ data }),
});

export type UsersRepository = ReturnType<typeof createUsersRepository>;

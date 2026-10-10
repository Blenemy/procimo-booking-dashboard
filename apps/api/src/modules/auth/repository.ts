import type { Db } from '../../db/client';

export const createUsersRepository = (db: Db) => ({
  findByEmail: (email: string) => db.user.findUnique({ where: { email } }),
  findById: (id: number) => db.user.findUnique({ where: { id } }),
});

export type UsersRepository = ReturnType<typeof createUsersRepository>;

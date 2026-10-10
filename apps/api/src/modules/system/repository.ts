import type { Db } from '../../db/client';

export const createSystemRepository = (db: Db) => ({
  ping: async () => {
    await db.$queryRaw`SELECT 1`;
  },
});

export type SystemRepository = ReturnType<typeof createSystemRepository>;

import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client';

export type Db = PrismaClient;

export function createPrismaClient(databaseUrl: string, connectionLimit = 10): Db {
  const url = new URL(databaseUrl);
  const adapter = new PrismaMariaDb({
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    connectionLimit,
    connectTimeout: 5_000,
    allowPublicKeyRetrieval: true,
  });
  return new PrismaClient({ adapter });
}

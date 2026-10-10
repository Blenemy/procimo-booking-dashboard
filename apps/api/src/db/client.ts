import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client';

export type Db = PrismaClient;

const DEFAULT_MYSQL_PORT = 3306;
const CONNECT_TIMEOUT_MS = 5_000;

export function createPrismaClient(databaseUrl: string, connectionLimit: number): Db {
  const url = new URL(databaseUrl);
  const adapter = new PrismaMariaDb({
    host: url.hostname,
    port: Number(url.port || DEFAULT_MYSQL_PORT),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ''),
    connectionLimit,
    connectTimeout: CONNECT_TIMEOUT_MS,
    allowPublicKeyRetrieval: true,
  });
  return new PrismaClient({ adapter });
}

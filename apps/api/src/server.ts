import { createApp } from './app';
import { systemClock } from './core/clock';
import { loadConfig } from './core/config';
import { createLogger } from './core/logger';
import { createPrismaClient } from './db/client';

const config = loadConfig();
const logger = createLogger(config.logLevel);
const db = createPrismaClient(config.databaseUrl, config.dbPoolSize);
const app = createApp({ config, db, clock: systemClock, logger });

const server = app.listen(config.port, () => {
  logger.info({ port: config.port, timezone: config.timezone }, 'API listening');
});

const shutdown = (signal: NodeJS.Signals) => {
  logger.info({ signal }, 'Shutting down');
  server.close(() => {
    void db.$disconnect().finally(() => process.exit(0));
  });
};

process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);

import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import type { Clock } from './core/clock';
import type { Config } from './core/config';
import type { Logger } from './core/logger';
import type { Db } from './db/client';
import { errorHandler, notFoundHandler } from './http/errors';
import { systemRoutes } from './modules/system/routes';

export interface AppDeps {
  config: Config;
  db: Db;
  clock: Clock;
  logger: Logger;
}

export function createApp(deps: AppDeps) {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(
    pinoHttp({
      logger: deps.logger,
      autoLogging: { ignore: (req) => req.url === '/api/health' },
      serializers: {
        req: (req: { id: unknown; method: string; url: string }) => ({
          id: req.id,
          method: req.method,
          url: req.url,
        }),
        res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
      },
    }),
  );
  app.use(express.json({ limit: '10kb' }));
  app.use(cookieParser());

  const api = express.Router();
  api.use(systemRoutes(deps));
  app.use('/api', api);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

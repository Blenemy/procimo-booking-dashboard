import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import type { Clock } from './core/clock';
import type { Config } from './core/config';
import type { Logger } from './core/logger';
import type { Db } from './db/client';
import { TransactionRetry } from './db/transaction-retry';
import { BookingPolicy } from './domain/booking-policy';
import { FacilityCalendar } from './domain/facility-calendar';
import { errorHandler, notFoundHandler } from './http/errors';
import { requireJsonForMutations } from './http/json-only';
import { createAuthController } from './modules/auth/controller';
import { PasswordHasher } from './modules/auth/lib/password-hasher';
import { TokenSigner } from './modules/auth/lib/token-signer';
import { createAuthGuards } from './modules/auth/middleware';
import { createUsersRepository } from './modules/auth/repository';
import { authRoutes } from './modules/auth/routes';
import { createAuthService } from './modules/auth/service';
import { createBookingsController } from './modules/bookings/controller';
import { createBookingsRepository } from './modules/bookings/repository';
import { bookingsRoutes } from './modules/bookings/routes';
import { createBookingsService } from './modules/bookings/service';
import { createCourtsController } from './modules/courts/controller';
import { createCourtsRepository } from './modules/courts/repository';
import { courtsRoutes } from './modules/courts/routes';
import { createCourtsService } from './modules/courts/service';
import { createSystemController } from './modules/system/controller';
import { createSystemRepository } from './modules/system/repository';
import { systemRoutes } from './modules/system/routes';

const TRUSTED_PROXY_HOPS = 1;
const JSON_BODY_LIMIT = '10kb';
const HEALTH_PATH = '/api/health';

export interface AppDeps {
  config: Config;
  db: Db;
  clock: Clock;
  logger: Logger;
}

export function createApp(deps: AppDeps) {
  const app = express();

  app.set('trust proxy', TRUSTED_PROXY_HOPS);
  app.use(helmet());
  app.use(
    pinoHttp({
      logger: deps.logger,
      autoLogging: { ignore: (req) => req.url === HEALTH_PATH },
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
  app.use(express.json({ limit: JSON_BODY_LIMIT }));
  app.use(cookieParser());

  const { config, db, clock } = deps;

  const calendar = new FacilityCalendar(config.timezone);
  const policy = new BookingPolicy(calendar);
  const retry = new TransactionRetry();

  const passwordHasher = new PasswordHasher();
  const tokenSigner = new TokenSigner(config.jwtSecret, config.sessionTtlHours);
  const users = createUsersRepository(db);
  const auth = createAuthGuards({ users, tokenSigner });
  const courts = createCourtsRepository(db);

  const systemController = createSystemController({
    config,
    repository: createSystemRepository(db),
  });
  const authController = createAuthController({
    config,
    service: createAuthService({ users, passwordHasher, tokenSigner }),
  });
  const courtsController = createCourtsController({
    service: createCourtsService({
      repository: courts,
      calendar,
      policy,
      clock,
    }),
  });
  const bookingsController = createBookingsController({
    service: createBookingsService({
      repository: createBookingsRepository(db, retry),
      courts,
      calendar,
      policy,
      clock,
      currency: config.currency,
    }),
  });

  const api = express.Router();
  api.use(requireJsonForMutations);
  api.use(systemRoutes({ controller: systemController }));
  api.use('/auth', authRoutes({ controller: authController, auth }));
  api.use(courtsRoutes({ controller: courtsController, auth }));
  api.use(bookingsRoutes({ controller: bookingsController, auth }));
  app.use('/api', api);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

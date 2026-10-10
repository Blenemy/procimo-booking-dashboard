import { z } from 'zod';

const isIanaTimeZone = (zone: string) => {
  try {
    new Intl.DateTimeFormat('en', { timeZone: zone });
    return true;
  } catch {
    return false;
  }
};

const DEFAULTS = {
  port: 3000,
  dbPoolSize: 10,
  timezone: 'Europe/Lisbon',
  currency: 'EUR',
  sessionTtlHours: 12,
};

const CURRENCY_CODE_LENGTH = 3;
const MIN_JWT_SECRET_LENGTH = 32;

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(DEFAULTS.port),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  DATABASE_URL: z.url({ protocol: /^mysql$/ }),
  DB_POOL_SIZE: z.coerce.number().int().positive().default(DEFAULTS.dbPoolSize),
  FACILITY_TIMEZONE: z
    .string()
    .default(DEFAULTS.timezone)
    .refine(isIanaTimeZone, 'must be a valid IANA time zone'),
  CURRENCY: z.string().length(CURRENCY_CODE_LENGTH).toUpperCase().default(DEFAULTS.currency),
  JWT_SECRET: z.string().min(MIN_JWT_SECRET_LENGTH),
  SESSION_TTL_HOURS: z.coerce.number().int().positive().default(DEFAULTS.sessionTtlHours),
  COOKIE_SECURE: z.stringbool().optional(),
});

export interface Config {
  env: 'development' | 'production' | 'test';
  port: number;
  logLevel: string;
  databaseUrl: string;
  dbPoolSize: number;
  timezone: string;
  currency: string;
  jwtSecret: string;
  sessionTtlHours: number;
  cookieSecure: boolean;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    throw new Error(`Invalid environment configuration:\n${z.prettifyError(result.error)}`);
  }
  const e = result.data;
  return {
    env: e.NODE_ENV,
    port: e.PORT,
    logLevel: e.LOG_LEVEL,
    databaseUrl: e.DATABASE_URL,
    dbPoolSize: e.DB_POOL_SIZE,
    timezone: e.FACILITY_TIMEZONE,
    currency: e.CURRENCY,
    jwtSecret: e.JWT_SECRET,
    sessionTtlHours: e.SESSION_TTL_HOURS,
    cookieSecure: e.COOKIE_SECURE ?? e.NODE_ENV === 'production',
  };
}

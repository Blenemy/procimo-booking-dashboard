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

export type SeedConfig = Pick<Config, 'logLevel' | 'databaseUrl' | 'timezone'>;

const seedEnvSchema = envSchema.pick({
  LOG_LEVEL: true,
  DATABASE_URL: true,
  FACILITY_TIMEZONE: true,
});

const parseEnv = <S extends z.ZodType>(schema: S, env: NodeJS.ProcessEnv): z.output<S> => {
  const result = schema.safeParse(env);
  if (!result.success) {
    throw new Error(`Invalid environment configuration:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const e = parseEnv(envSchema, env);
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

export function loadSeedConfig(env: NodeJS.ProcessEnv = process.env): SeedConfig {
  const e = parseEnv(seedEnvSchema, env);
  return { logLevel: e.LOG_LEVEL, databaseUrl: e.DATABASE_URL, timezone: e.FACILITY_TIMEZONE };
}

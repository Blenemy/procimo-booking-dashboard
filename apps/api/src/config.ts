import { z } from 'zod';

const isIanaTimeZone = (zone: string) => {
  try {
    new Intl.DateTimeFormat('en', { timeZone: zone });
    return true;
  } catch {
    return false;
  }
};

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  DATABASE_URL: z.url({ protocol: /^mysql$/ }),
  DB_POOL_SIZE: z.coerce.number().int().positive().default(10),
  FACILITY_TIMEZONE: z
    .string()
    .default('Europe/Lisbon')
    .refine(isIanaTimeZone, 'must be a valid IANA time zone'),
  CURRENCY: z.string().length(3).toUpperCase().default('EUR'),
});

export interface Config {
  env: 'development' | 'production' | 'test';
  port: number;
  logLevel: string;
  databaseUrl: string;
  dbPoolSize: number;
  timezone: string;
  currency: string;
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
  };
}

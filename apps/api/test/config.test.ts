import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/core/config';

const base = {
  DATABASE_URL: 'mysql://u:p@localhost:3306/courtly',
  JWT_SECRET: 'a-secret-that-is-at-least-32-characters',
};

describe('loadConfig', () => {
  it('applies defaults', () => {
    const config = loadConfig(base);

    expect(config).toMatchObject({
      port: 3000,
      timezone: 'Europe/Lisbon',
      currency: 'EUR',
      dbPoolSize: 10,
      sessionTtlHours: 12,
      cookieSecure: false,
    });
  });

  it('rejects an unknown time zone', () => {
    expect(() => loadConfig({ ...base, FACILITY_TIMEZONE: 'Mars/Olympus' })).toThrow(
      /FACILITY_TIMEZONE/,
    );
  });

  it('rejects a non-MySQL database url', () => {
    expect(() => loadConfig({ ...base, DATABASE_URL: 'postgres://u:p@localhost/db' })).toThrow(
      /DATABASE_URL/,
    );
  });

  it('requires a JWT secret of at least 32 characters', () => {
    expect(() => loadConfig({ ...base, JWT_SECRET: 'short' })).toThrow(/JWT_SECRET/);
  });

  it('defaults to Secure cookies in production unless explicitly disabled', () => {
    expect(loadConfig({ ...base, NODE_ENV: 'production' }).cookieSecure).toBe(true);
    expect(
      loadConfig({ ...base, NODE_ENV: 'production', COOKIE_SECURE: 'false' }).cookieSecure,
    ).toBe(false);
  });
});

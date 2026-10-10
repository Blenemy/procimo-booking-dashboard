import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/core/config';

const base = { DATABASE_URL: 'mysql://u:p@localhost:3306/courtly' };

describe('loadConfig', () => {
  it('applies defaults', () => {
    const config = loadConfig(base);

    expect(config).toMatchObject({
      port: 3000,
      timezone: 'Europe/Lisbon',
      currency: 'EUR',
      dbPoolSize: 10,
    });
  });

  it('rejects an unknown time zone', () => {
    expect(() => loadConfig({ ...base, FACILITY_TIMEZONE: 'Mars/Olympus' })).toThrow(
      /FACILITY_TIMEZONE/,
    );
  });

  it('rejects a non-MySQL database url', () => {
    expect(() => loadConfig({ DATABASE_URL: 'postgres://u:p@localhost/db' })).toThrow(
      /DATABASE_URL/,
    );
  });
});

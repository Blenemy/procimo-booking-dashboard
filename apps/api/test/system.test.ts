import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { createTestApp } from './helpers/app';
import { createTestDb } from './helpers/db';

const db = createTestDb();
const app = createTestApp(db);

afterAll(() => db.$disconnect());

describe('system routes', () => {
  it('reports health when the database is reachable', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('exposes the facility time zone and currency', async () => {
    const res = await request(app).get('/api/config');

    expect(res.body).toEqual({ timezone: 'Europe/Lisbon', currency: 'EUR' });
  });

  it('returns a JSON 404 for unknown routes', async () => {
    const res = await request(app).get('/api/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
  });

  it('rejects a malformed JSON body with 400', async () => {
    const res = await request(app)
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send('{"broken":');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

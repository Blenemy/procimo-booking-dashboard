import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createLogger } from '../src/core/logger';
import { AppError, errorHandler } from '../src/http/errors';
import { parse } from '../src/http/validate';

function appThrowing(error: () => unknown) {
  const app = express();
  app.use((req, _res, next) => {
    req.log = createLogger('silent');
    next();
  });
  app.get('/boom', () => error());
  app.use(errorHandler);
  return app;
}

describe('errorHandler', () => {
  it('maps AppError to its status and code', async () => {
    const app = appThrowing(() => {
      throw new AppError(409, 'SLOT_TAKEN', 'Slot is already booked', { courtId: 1 });
    });

    const res = await request(app).get('/boom');

    expect(res.status).toBe(409);
    expect(res.body).toEqual({
      error: { code: 'SLOT_TAKEN', message: 'Slot is already booked', details: { courtId: 1 } },
    });
  });

  it('maps zod validation errors to 400 with field paths', async () => {
    const app = appThrowing(() => parse(z.object({ date: z.iso.date() }), { date: 'nope' }));

    const res = await request(app).get('/boom');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toEqual([{ path: 'date', message: expect.any(String) }]);
  });

  it('hides unexpected errors behind a generic 500', async () => {
    const app = appThrowing(() => {
      throw new Error('db password is hunter2');
    });

    const res = await request(app).get('/boom');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
    });
  });
});

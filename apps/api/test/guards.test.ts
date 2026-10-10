import cookieParser from 'cookie-parser';
import express from 'express';
import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createLogger } from '../src/core/logger';
import { errorHandler } from '../src/http/errors';
import { authUser, createAuthGuards } from '../src/modules/auth/middleware';
import { createUsersRepository } from '../src/modules/auth/repository';
import { sessionCookie, testTokenSigner } from './helpers/app';
import { createTestDb, resetDb } from './helpers/db';
import { createUser } from './helpers/factories';

const db = createTestDb();
const { requireAuth, requireRole } = createAuthGuards({
  users: createUsersRepository(db),
  tokenSigner: testTokenSigner(),
});

const app = express();
app.use((req, _res, next) => {
  req.log = createLogger('silent');
  next();
});
app.use(cookieParser());
app.get('/admin-only', requireAuth, requireRole('ADMIN'), (req, res) => {
  res.json({ id: authUser(req).id });
});
app.get('/users-only', requireAuth, requireRole('USER'), (_req, res) => {
  res.json({ ok: true });
});
app.use(errorHandler);

beforeEach(() => resetDb(db));
afterAll(() => db.$disconnect());

describe('role guards', () => {
  it('returns 401 without a session and 403 for the wrong role', async () => {
    const user = await createUser(db, { role: 'USER' });

    const anonymous = await request(app).get('/admin-only');
    const wrongRole = await request(app)
      .get('/admin-only')
      .set('Cookie', await sessionCookie(user.id));

    expect(anonymous.status).toBe(401);
    expect(wrongRole.status).toBe(403);
    expect(wrongRole.body.error.code).toBe('FORBIDDEN');
  });

  it('lets the matching role through', async () => {
    const admin = await createUser(db, { role: 'ADMIN' });

    const res = await request(app)
      .get('/admin-only')
      .set('Cookie', await sessionCookie(admin.id));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: admin.id });
  });

  it('keeps admins out of user-only routes', async () => {
    const admin = await createUser(db, { role: 'ADMIN' });

    const res = await request(app)
      .get('/users-only')
      .set('Cookie', await sessionCookie(admin.id));

    expect(res.status).toBe(403);
  });

  it('applies a role change immediately because the role is read from the database', async () => {
    const user = await createUser(db, { role: 'ADMIN' });
    const cookie = await sessionCookie(user.id);
    expect((await request(app).get('/admin-only').set('Cookie', cookie)).status).toBe(200);

    await db.user.update({ where: { id: user.id }, data: { role: 'USER' } });

    expect((await request(app).get('/admin-only').set('Cookie', cookie)).status).toBe(403);
  });
});

import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, sessionCookie } from './helpers/app';
import { createTestDb, resetDb } from './helpers/db';
import { createUser } from './helpers/factories';

const db = createTestDb();
const app = createTestApp(db);

beforeEach(() => resetDb(db));
afterAll(() => db.$disconnect());

type Method = 'get' | 'post' | 'patch';

const ADMIN_ROUTES: [Method, string][] = [
  ['get', '/api/admin/courts'],
  ['post', '/api/admin/courts'],
  ['patch', '/api/admin/courts/1'],
];

const USER_ROUTES: [Method, string][] = [
  ['get', '/api/bookings/me'],
  ['post', '/api/bookings'],
  ['post', '/api/bookings/1/cancel'],
];

const SHARED_ROUTES: [Method, string][] = [
  ['get', '/api/courts'],
  ['get', '/api/courts/1/availability?date=2026-12-16'],
];

const call = (method: Method, path: string, cookie?: string) => {
  const req = cookie
    ? request(app)[method](path).set('Cookie', cookie)
    : request(app)[method](path);
  return method === 'get' ? req : req.send({});
};

const cookieFor = async (role: 'USER' | 'ADMIN') =>
  sessionCookie((await createUser(db, { role })).id);

describe('role checks on the API', () => {
  it.each([...ADMIN_ROUTES, ...USER_ROUTES, ...SHARED_ROUTES])(
    '%s %s requires a session',
    async (method, path) => {
      expect((await call(method, path)).status).toBe(401);
    },
  );

  it.each(ADMIN_ROUTES)('%s %s is forbidden for users', async (method, path) => {
    expect((await call(method, path, await cookieFor('USER'))).status).toBe(403);
  });

  it.each(USER_ROUTES)('%s %s is forbidden for admins', async (method, path) => {
    expect((await call(method, path, await cookieFor('ADMIN'))).status).toBe(403);
  });

  it('applies a role change immediately because the role is read from the database', async () => {
    const admin = await createUser(db, { role: 'ADMIN' });
    const cookie = await sessionCookie(admin.id);
    expect((await call('get', '/api/admin/courts', cookie)).status).toBe(200);

    await db.user.update({ where: { id: admin.id }, data: { role: 'USER' } });

    expect((await call('get', '/api/admin/courts', cookie)).status).toBe(403);
  });
});

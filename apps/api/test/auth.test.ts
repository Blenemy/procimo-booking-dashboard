import { SignJWT } from 'jose';
import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { SESSION_COOKIE } from '../src/modules/auth/lib/session-cookie';
import { createTestApp, sessionCookie, testConfig } from './helpers/app';
import { createTestDb, resetDb } from './helpers/db';
import { DEFAULT_PASSWORD, createUser } from './helpers/factories';

const db = createTestDb();
const app = createTestApp(db);

beforeEach(() => resetDb(db));
afterAll(() => db.$disconnect());

const login = (email: string, password: string) =>
  request(app).post('/api/auth/login').send({ email, password });

describe('POST /api/auth/login', () => {
  it('sets an httpOnly session cookie and returns the user without secrets', async () => {
    const user = await createUser(db, { email: 'alice@courtly.test' });

    const res = await login('alice@courtly.test', DEFAULT_PASSWORD);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: user.id, email: user.email, name: user.name, role: 'USER' });
    const cookie = res.headers['set-cookie']?.[0] ?? '';
    expect(cookie).toMatch(new RegExp(`^${SESSION_COOKIE}=`));
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain('Path=/');
  });

  it('normalizes the email before lookup', async () => {
    await createUser(db, { email: 'alice@courtly.test' });

    const res = await login('  Alice@Courtly.TEST ', DEFAULT_PASSWORD);

    expect(res.status).toBe(200);
  });

  it('returns the same 401 for a wrong password and an unknown email', async () => {
    await createUser(db, { email: 'alice@courtly.test' });

    const wrongPassword = await login('alice@courtly.test', 'nope');
    const unknownEmail = await login('nobody@courtly.test', DEFAULT_PASSWORD);

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body).toEqual(unknownEmail.body);
    expect(wrongPassword.body.error.code).toBe('INVALID_CREDENTIALS');
    expect(wrongPassword.headers['set-cookie']).toBeUndefined();
  });

  it('rejects a non-JSON body with 415', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .type('form')
      .send({ email: 'a@b.test', password: 'x' });

    expect(res.status).toBe(415);
    expect(res.body.error.code).toBe('UNSUPPORTED_MEDIA_TYPE');
  });
});

describe('GET /api/auth/me', () => {
  it('requires a session', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('returns the current user for the cookie set at login', async () => {
    await createUser(db, { email: 'alice@courtly.test' });
    const agent = request.agent(app);
    await agent
      .post('/api/auth/login')
      .send({ email: 'alice@courtly.test', password: DEFAULT_PASSWORD });

    const res = await agent.get('/api/auth/me');

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('alice@courtly.test');
  });

  it.each([
    ['a garbage token', () => Promise.resolve('not-a-jwt')],
    [
      'a token signed with another secret',
      () =>
        new SignJWT()
          .setProtectedHeader({ alg: 'HS256' })
          .setSubject('1')
          .setExpirationTime('1h')
          .sign(new TextEncoder().encode('another-secret-that-is-32-characters-long!!')),
    ],
    [
      'an expired token',
      () =>
        new SignJWT()
          .setProtectedHeader({ alg: 'HS256' })
          .setSubject('1')
          .setIssuedAt(Math.floor(Date.now() / 1000) - 7200)
          .setExpirationTime(Math.floor(Date.now() / 1000) - 3600)
          .sign(new TextEncoder().encode(testConfig().jwtSecret)),
    ],
    [
      'an unsigned token',
      () =>
        Promise.resolve(
          `${Buffer.from('{"alg":"none"}').toString('base64url')}.${Buffer.from('{"sub":"1"}').toString('base64url')}.`,
        ),
    ],
  ])('rejects %s', async (_label, makeToken) => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', `${SESSION_COOKIE}=${await makeToken()}`);

    expect(res.status).toBe(401);
  });

  it('rejects a valid token whose user no longer exists', async () => {
    const user = await createUser(db);
    const cookie = await sessionCookie(user.id);
    await db.user.delete({ where: { id: user.id } });

    const res = await request(app).get('/api/auth/me').set('Cookie', cookie);

    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('clears the session cookie', async () => {
    const res = await request(app).post('/api/auth/logout').set('Content-Type', 'application/json');

    expect(res.status).toBe(204);
    expect(res.headers['set-cookie']?.[0]).toMatch(
      new RegExp(`^${SESSION_COOKIE}=;.*Expires=Thu, 01 Jan 1970`),
    );
  });
});

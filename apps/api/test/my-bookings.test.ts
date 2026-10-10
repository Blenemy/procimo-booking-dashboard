import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, fixedClock, sessionCookie } from './helpers/app';
import { createTestDb, resetDb } from './helpers/db';
import { createBooking, createCourt, createUser } from './helpers/factories';

const db = createTestDb();
const clock = fixedClock('2026-12-15T10:20:00.000Z');
const app = createTestApp(db, { clock });

beforeEach(async () => {
  await resetDb(db);
  clock.set('2026-12-15T10:20:00.000Z');
});
afterAll(() => db.$disconnect());

const myBookings = async (userId: number, query = '') =>
  request(app)
    .get(`/api/bookings/me${query}`)
    .set('Cookie', await sessionCookie(userId));

const starts = (body: { startsAt: string; status: string }[]) =>
  body.map((b) => `${b.startsAt} ${b.status}`);

const seed = async () => {
  const me = await createUser(db);
  const other = await createUser(db);
  const court = await createCourt(db);
  const mine = (startsAt: string, status: 'CONFIRMED' | 'CANCELLED' = 'CONFIRMED') =>
    createBooking(db, { userId: me.id, courtId: court.id, startsAt, status });

  await mine('2026-12-13T10:00:00.000Z', 'CANCELLED');
  await mine('2026-12-14T10:00:00.000Z');
  await mine('2026-12-15T09:00:00.000Z');
  await mine('2026-12-15T10:00:00.000Z');
  await mine('2026-12-16T10:00:00.000Z');
  await mine('2026-12-17T10:00:00.000Z', 'CANCELLED');
  await createBooking(db, {
    userId: other.id,
    courtId: court.id,
    startsAt: '2026-12-16T12:00:00.000Z',
  });
  return { me, court };
};

describe('GET /api/bookings/me', () => {
  it('requires a session and is not available to admins', async () => {
    const admin = await createUser(db, { role: 'ADMIN' });

    expect((await request(app).get('/api/bookings/me')).status).toBe(401);
    expect((await myBookings(admin.id)).status).toBe(403);
  });

  it('lists upcoming bookings by default, soonest first, including the one in progress', async () => {
    const { me } = await seed();

    const res = await myBookings(me.id);

    expect(res.status).toBe(200);
    expect(starts(res.body)).toEqual([
      '2026-12-15T10:00:00.000Z CONFIRMED',
      '2026-12-16T10:00:00.000Z CONFIRMED',
      '2026-12-17T10:00:00.000Z CANCELLED',
    ]);
  });

  it('lists past bookings most recent first', async () => {
    const { me } = await seed();

    const res = await myBookings(me.id, '?scope=past');

    expect(starts(res.body)).toEqual([
      '2026-12-15T09:00:00.000Z CONFIRMED',
      '2026-12-14T10:00:00.000Z CONFIRMED',
      '2026-12-13T10:00:00.000Z CANCELLED',
    ]);
  });

  it('moves a booking to past the moment it ends', async () => {
    const { me } = await seed();
    clock.set('2026-12-15T11:00:00.000Z');

    const upcoming = await myBookings(me.id, '?scope=upcoming');
    const past = await myBookings(me.id, '?scope=past');

    expect(upcoming.body[0].startsAt).toBe('2026-12-16T10:00:00.000Z');
    expect(past.body[0].startsAt).toBe('2026-12-15T10:00:00.000Z');
  });

  it('returns the court and the cancellation deadline with each booking', async () => {
    const { me, court } = await seed();

    const [first] = (await myBookings(me.id)).body;

    expect(first).toMatchObject({
      court: { id: court.id, name: court.name, sportType: court.sportType },
      cancellableUntil: '2026-12-15T08:00:00.000Z',
    });
  });

  it('rejects an unknown scope', async () => {
    const user = await createUser(db);

    const res = await myBookings(user.id, '?scope=all');

    expect(res.status).toBe(400);
  });
});

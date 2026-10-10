import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, fixedClock, sessionCookie } from './helpers/app';
import { createTestDb, resetDb } from './helpers/db';
import { createBooking, createCourt, createUser } from './helpers/factories';

const db = createTestDb();
const clock = fixedClock('2026-07-20T12:00:00.000Z');
const app = createTestApp(db, { clock });

beforeEach(() => resetDb(db));
afterAll(() => db.$disconnect());

const dayOverview = async (date: string) =>
  request(app)
    .get(`/api/admin/bookings?date=${date}`)
    .set('Cookie', await sessionCookie((await createUser(db, { role: 'ADMIN' })).id));

describe('admin day revenue', () => {
  it('counts confirmed bookings at their booked price and lists cancelled ones without counting them', async () => {
    const user = await createUser(db);
    const court = await createCourt(db, { hourlyPriceCents: 2500 });
    const at = (startsAt: string, extra: object = {}) =>
      createBooking(db, { userId: user.id, courtId: court.id, startsAt, ...extra });
    await at('2026-07-15T08:00:00.000Z', { totalPriceCents: 2500 });
    await at('2026-07-15T09:00:00.000Z', { durationHours: 2, totalPriceCents: 5000 });
    await at('2026-07-15T12:00:00.000Z', { status: 'CANCELLED', totalPriceCents: 2500 });
    await db.court.update({ where: { id: court.id }, data: { hourlyPriceCents: 9900 } });

    const res = await dayOverview('2026-07-15');

    expect(res.status).toBe(200);
    expect(res.body.totalRevenueCents).toBe(7500);
    expect(res.body.currency).toBe('EUR');
    expect(res.body.courts).toHaveLength(1);
    expect(res.body.courts[0].revenueCents).toBe(7500);
    expect(
      res.body.courts[0].bookings.map((b: { status: string; user: { id: number } }) => [
        b.status,
        b.user.id,
      ]),
    ).toEqual([
      ['CONFIRMED', user.id],
      ['CONFIRMED', user.id],
      ['CANCELLED', user.id],
    ]);
  });

  it('groups bookings by the facility day rather than the UTC day', async () => {
    const user = await createUser(db);
    const court = await createCourt(db, { hourlyPriceCents: 2500, openHour: 0, closeHour: 24 });
    const at = (startsAt: string) =>
      createBooking(db, { userId: user.id, courtId: court.id, startsAt });
    await at('2026-07-14T23:00:00.000Z');
    await at('2026-07-15T22:00:00.000Z');
    await at('2026-07-15T23:00:00.000Z');

    const res = await dayOverview('2026-07-15');

    expect(res.body.courts[0].bookings.map((b: { startsAt: string }) => b.startsAt)).toEqual([
      '2026-07-14T23:00:00.000Z',
      '2026-07-15T22:00:00.000Z',
    ]);
    expect(res.body.totalRevenueCents).toBe(5000);
  });
});

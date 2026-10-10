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

const START = '2026-12-15T14:00:00.000Z';

const cancel = async (userId: number, bookingId: number | string) =>
  request(app)
    .post(`/api/bookings/${bookingId}/cancel`)
    .set('Cookie', await sessionCookie(userId))
    .send({});

const setup = async (overrides: Partial<Parameters<typeof createBooking>[1]> = {}) => {
  const owner = await createUser(db);
  const court = await createCourt(db);
  const booking = await createBooking(db, {
    userId: owner.id,
    courtId: court.id,
    startsAt: START,
    ...overrides,
  });
  return { owner, court, booking };
};

const stored = async (bookingId: number) => ({
  status: (await db.booking.findUniqueOrThrow({ where: { id: bookingId } })).status,
  slots: await db.bookingSlot.count({ where: { bookingId } }),
});

describe('POST /api/bookings/:id/cancel', () => {
  it('requires a session and is not available to admins', async () => {
    const { booking } = await setup();
    const admin = await createUser(db, { role: 'ADMIN' });

    const anonymous = await request(app).post(`/api/bookings/${booking.id}/cancel`).send({});
    const asAdmin = await cancel(admin.id, booking.id);

    expect(anonymous.status).toBe(401);
    expect(asAdmin.status).toBe(403);
    expect(await stored(booking.id)).toEqual({ status: 'CONFIRMED', slots: 1 });
  });

  it('cancels the booking, keeps it as history and frees its slots', async () => {
    const { owner, booking } = await setup({ durationHours: 2 });

    const res = await cancel(owner.id, booking.id);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: booking.id,
      status: 'CANCELLED',
      cancelledAt: '2026-12-15T10:20:00.000Z',
      startsAt: START,
      totalPriceCents: booking.totalPriceCents,
    });
    expect(await stored(booking.id)).toEqual({ status: 'CANCELLED', slots: 0 });
  });

  it('makes the slot bookable again', async () => {
    const { owner, court, booking } = await setup();
    const other = await createUser(db);

    await cancel(owner.id, booking.id);
    const rebooked = await request(app)
      .post('/api/bookings')
      .set('Cookie', await sessionCookie(other.id))
      .send({ courtId: court.id, startsAt: START, durationHours: 1 });

    expect(rebooked.status).toBe(201);
  });

  it.each([
    [200, 'well before the cutoff', '2026-12-15T10:20:00.000Z'],
    [200, 'one millisecond before the cutoff', '2026-12-15T11:59:59.999Z'],
    [200, 'exactly at the cutoff', '2026-12-15T12:00:00.000Z'],
    [409, 'one millisecond after the cutoff', '2026-12-15T12:00:00.001Z'],
    [409, 'an hour before the start', '2026-12-15T13:00:00.000Z'],
    [409, 'while the game is being played', '2026-12-15T14:30:00.000Z'],
    [409, 'after the game is over', '2026-12-16T09:00:00.000Z'],
  ])('returns %i for a request made %s', async (status, _label, now) => {
    const { owner, booking } = await setup();
    clock.set(now);

    const res = await cancel(owner.id, booking.id);

    expect(res.status).toBe(status);
    if (status === 409) {
      expect(res.body.error.code).toBe('CANCELLATION_WINDOW_CLOSED');
      expect(await stored(booking.id)).toEqual({ status: 'CONFIRMED', slots: 1 });
    }
  });

  it('rejects cancelling twice', async () => {
    const { owner, booking } = await setup({ status: 'CANCELLED' });

    const res = await cancel(owner.id, booking.id);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('ALREADY_CANCELLED');
  });

  it('lets only one of two simultaneous cancellations through', async () => {
    const { owner, booking } = await setup();

    const responses = await Promise.all([
      cancel(owner.id, booking.id),
      cancel(owner.id, booking.id),
    ]);

    expect(responses.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(responses.find((r) => r.status === 409)?.body.error.code).toBe('ALREADY_CANCELLED');
    expect(await stored(booking.id)).toEqual({ status: 'CANCELLED', slots: 0 });
  });

  it("hides other users' bookings behind a 404", async () => {
    const { booking } = await setup();
    const stranger = await createUser(db);

    const res = await cancel(stranger.id, booking.id);

    expect(res.status).toBe(404);
    expect(await stored(booking.id)).toEqual({ status: 'CONFIRMED', slots: 1 });
  });

  it('returns 404 for an unknown booking and 400 for a malformed id', async () => {
    const user = await createUser(db);

    expect((await cancel(user.id, 999999)).status).toBe(404);
    expect((await cancel(user.id, 'abc')).status).toBe(400);
  });

  it('still allows cancelling on a court that has been deactivated', async () => {
    const { owner, court, booking } = await setup();
    await db.court.update({ where: { id: court.id }, data: { isActive: false } });

    const res = await cancel(owner.id, booking.id);

    expect(res.status).toBe(200);
  });
});

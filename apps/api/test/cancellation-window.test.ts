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

const cancel = async (userId: number, bookingId: number) =>
  request(app)
    .post(`/api/bookings/${bookingId}/cancel`)
    .set('Cookie', await sessionCookie(userId))
    .send({});

const setup = async () => {
  const owner = await createUser(db);
  const court = await createCourt(db);
  const booking = await createBooking(db, { userId: owner.id, courtId: court.id, startsAt: START });
  return { owner, court, booking };
};

const stored = async (bookingId: number) => ({
  status: (await db.booking.findUniqueOrThrow({ where: { id: bookingId } })).status,
  slots: await db.bookingSlot.count({ where: { bookingId } }),
});

describe('cancellation window for a booking at 14:00', () => {
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

  it('keeps the cancelled booking as history and frees the slot for others', async () => {
    const { owner, court, booking } = await setup();
    const other = await createUser(db);

    const res = await cancel(owner.id, booking.id);
    const rebooked = await request(app)
      .post('/api/bookings')
      .set('Cookie', await sessionCookie(other.id))
      .send({ courtId: court.id, startsAt: START, durationHours: 1 });

    expect(res.body).toMatchObject({
      status: 'CANCELLED',
      cancelledAt: '2026-12-15T10:20:00.000Z',
    });
    expect(await stored(booking.id)).toEqual({ status: 'CANCELLED', slots: 0 });
    expect(rebooked.status).toBe(201);
  });

  it('lets only one of two simultaneous cancellations through', async () => {
    const { owner, booking } = await setup();

    const responses = await Promise.all([
      cancel(owner.id, booking.id),
      cancel(owner.id, booking.id),
    ]);

    expect(responses.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(responses.find((r) => r.status === 409)?.body.error.code).toBe('ALREADY_CANCELLED');
  });

  it("does not let a user cancel someone else's booking", async () => {
    const { booking } = await setup();
    const stranger = await createUser(db);

    const res = await cancel(stranger.id, booking.id);

    expect(res.status).toBe(404);
    expect(await stored(booking.id)).toEqual({ status: 'CONFIRMED', slots: 1 });
  });
});

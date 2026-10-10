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

const asUser = async () => sessionCookie((await createUser(db)).id);

const book = (cookie: string, body: object) =>
  request(app).post('/api/bookings').set('Cookie', cookie).send(body);

const storedSlots = async () =>
  (await db.bookingSlot.findMany({ orderBy: { slotStart: 'asc' } })).map((s) =>
    s.slotStart.toISOString(),
  );

describe('POST /api/bookings', () => {
  it('requires a session and is not available to admins', async () => {
    const court = await createCourt(db);
    const admin = await createUser(db, { role: 'ADMIN' });
    const body = { courtId: court.id, startsAt: '2026-12-16T10:00:00.000Z', durationHours: 1 };

    const anonymous = await request(app).post('/api/bookings').send(body);
    const asAdmin = await book(await sessionCookie(admin.id), body);

    expect(anonymous.status).toBe(401);
    expect(asAdmin.status).toBe(403);
    expect(await db.booking.count()).toBe(0);
  });

  it('creates a one-hour booking priced by the server', async () => {
    const court = await createCourt(db, { name: 'Padel 1', hourlyPriceCents: 2500 });

    const res = await book(await asUser(), {
      courtId: court.id,
      startsAt: '2026-12-16T10:00:00.000Z',
      durationHours: 1,
    });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      id: expect.any(Number),
      court: { id: court.id, name: 'Padel 1', sportType: 'PADEL' },
      startsAt: '2026-12-16T10:00:00.000Z',
      endsAt: '2026-12-16T11:00:00.000Z',
      durationHours: 1,
      status: 'CONFIRMED',
      totalPriceCents: 2500,
      createdAt: expect.any(String),
      cancelledAt: null,
      cancellableUntil: '2026-12-16T08:00:00.000Z',
    });
    expect(await storedSlots()).toEqual(['2026-12-16T10:00:00.000Z']);
  });

  it('takes two consecutive slots for a two-hour booking', async () => {
    const court = await createCourt(db, { hourlyPriceCents: 2500 });

    const res = await book(await asUser(), {
      courtId: court.id,
      startsAt: '2026-12-16T21:00:00.000Z',
      durationHours: 2,
    });

    expect(res.status).toBe(201);
    expect(res.body.endsAt).toBe('2026-12-16T23:00:00.000Z');
    expect(res.body.totalPriceCents).toBe(5000);
    expect(await storedSlots()).toEqual(['2026-12-16T21:00:00.000Z', '2026-12-16T22:00:00.000Z']);
  });

  it('accepts the start time with any UTC offset', async () => {
    clock.set('2026-07-01T00:00:00.000Z');
    const court = await createCourt(db, { openHour: 8, closeHour: 10 });

    const res = await book(await asUser(), {
      courtId: court.id,
      startsAt: '2026-07-15T09:00:00+01:00',
      durationHours: 1,
    });

    expect(res.status).toBe(201);
    expect(res.body.startsAt).toBe('2026-07-15T08:00:00.000Z');
  });

  it('books a slot taken from availability and then shows it as mine', async () => {
    const court = await createCourt(db);
    const cookie = await asUser();
    const availability = () =>
      request(app)
        .get(`/api/courts/${court.id}/availability?date=2026-12-16`)
        .set('Cookie', cookie);
    const slot = (await availability()).body.slots[3];

    const res = await book(cookie, {
      courtId: court.id,
      startsAt: slot.startsAt,
      durationHours: 1,
    });
    const after = (await availability()).body.slots[3];

    expect(res.status).toBe(201);
    expect(after).toMatchObject({ startsAt: slot.startsAt, status: 'BOOKED', mine: true });
  });

  it.each([
    [409, 'the same slot', '2026-12-16T11:00:00.000Z', 1],
    [409, 'a two-hour booking ending in it', '2026-12-16T10:00:00.000Z', 2],
    [409, 'a two-hour booking starting in it', '2026-12-16T11:00:00.000Z', 2],
    [201, 'the slot right before it', '2026-12-16T10:00:00.000Z', 1],
    [201, 'two hours right after it', '2026-12-16T12:00:00.000Z', 2],
  ])('returns %i for %s next to an existing booking', async (status, _label, startsAt, hours) => {
    const owner = await createUser(db);
    const court = await createCourt(db);
    await createBooking(db, {
      userId: owner.id,
      courtId: court.id,
      startsAt: '2026-12-16T11:00:00.000Z',
    });

    const res = await book(await asUser(), { courtId: court.id, startsAt, durationHours: hours });

    expect(res.status).toBe(status);
    if (status === 409) expect(res.body.error.code).toBe('SLOT_TAKEN');
  });

  it('does not let a cancelled booking block the slot', async () => {
    const owner = await createUser(db);
    const court = await createCourt(db);
    await createBooking(db, {
      userId: owner.id,
      courtId: court.id,
      startsAt: '2026-12-16T11:00:00.000Z',
      status: 'CANCELLED',
    });

    const res = await book(await asUser(), {
      courtId: court.id,
      startsAt: '2026-12-16T11:00:00.000Z',
      durationHours: 1,
    });

    expect(res.status).toBe(201);
  });

  it.each([
    ['an inactive court', { isActive: false }, '2026-12-16T10:00:00.000Z', 1, 'COURT_INACTIVE'],
    ['a start off the hour', {}, '2026-12-16T10:30:00.000Z', 1, 'SLOT_NOT_ALIGNED'],
    ['a start before opening', {}, '2026-12-16T07:00:00.000Z', 1, 'OUTSIDE_OPENING_HOURS'],
    ['an end after closing', {}, '2026-12-16T22:00:00.000Z', 2, 'OUTSIDE_OPENING_HOURS'],
    ['a slot already in progress', {}, '2026-12-15T10:00:00.000Z', 1, 'BOOKING_IN_PAST'],
    ['a slot yesterday', {}, '2026-12-14T12:00:00.000Z', 1, 'BOOKING_IN_PAST'],
  ])('rejects %s with 422', async (_label, courtOverrides, startsAt, hours, code) => {
    const court = await createCourt(db, { openHour: 8, closeHour: 23, ...courtOverrides });

    const res = await book(await asUser(), { courtId: court.id, startsAt, durationHours: hours });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe(code);
    expect(await db.booking.count()).toBe(0);
  });

  it('returns 404 for an unknown court', async () => {
    const res = await book(await asUser(), {
      courtId: 999999,
      startsAt: '2026-12-16T10:00:00.000Z',
      durationHours: 1,
    });

    expect(res.status).toBe(404);
  });

  it.each([
    ['a three-hour duration', { durationHours: 3 }],
    ['a duration sent as text', { durationHours: '1' }],
    ['a start without an offset', { startsAt: '2026-12-16T10:00:00' }],
    ['a client-supplied price', { totalPriceCents: 1 }],
    ['a missing court', { courtId: undefined }],
  ])('rejects %s with 400', async (_label, override) => {
    const court = await createCourt(db);

    const res = await book(await asUser(), {
      courtId: court.id,
      startsAt: '2026-12-16T10:00:00.000Z',
      durationHours: 1,
      ...override,
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

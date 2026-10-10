import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { FacilityCalendar } from '../src/domain/facility-calendar';
import { createTestApp, fixedClock, sessionCookie } from './helpers/app';
import { createTestDb, resetDb } from './helpers/db';
import { createCourt, createUser } from './helpers/factories';

const db = createTestDb();
const clock = fixedClock('2026-12-15T10:20:00.000Z');
const app = createTestApp(db, { clock });
const lisbon = new FacilityCalendar('Europe/Lisbon');

beforeEach(async () => {
  await resetDb(db);
  clock.set('2026-12-15T10:20:00.000Z');
});
afterAll(() => db.$disconnect());

const book = async (courtId: number, startsAt: string, durationHours: number) =>
  request(app)
    .post('/api/bookings')
    .set('Cookie', await sessionCookie((await createUser(db)).id))
    .send({ courtId, startsAt, durationHours });

describe('opening hours across daylight saving changes', () => {
  it('keeps the local opening hour when the UTC offset changes', () => {
    const before = lisbon.openingSlots('2026-10-24', { openHour: 8, closeHour: 9 });
    const after = lisbon.openingSlots('2026-10-25', { openHour: 8, closeHour: 9 });

    expect(before.map((s) => s.toISOString())).toEqual(['2026-10-24T07:00:00.000Z']);
    expect(after.map((s) => s.toISOString())).toEqual(['2026-10-25T08:00:00.000Z']);
  });

  it('has 25 bookable hours when clocks go back and 23 when they go forward', () => {
    const allDay = { openHour: 0, closeHour: 24 };

    expect(lisbon.openingSlots('2026-10-25', allDay)).toHaveLength(25);
    expect(lisbon.openingSlots('2027-03-28', allDay)).toHaveLength(23);
  });
});

describe('booking time validation for a court open 08:00-23:00', () => {
  it.each([
    ['the first hour', '2026-12-16T08:00:00.000Z', 1],
    ['the last hour', '2026-12-16T22:00:00.000Z', 1],
    ['two hours ending exactly at closing', '2026-12-16T21:00:00.000Z', 2],
  ])('accepts %s', async (_label, startsAt, durationHours) => {
    const court = await createCourt(db, { openHour: 8, closeHour: 23 });

    expect((await book(court.id, startsAt, durationHours)).status).toBe(201);
  });

  it.each([
    ['a start before opening', '2026-12-16T07:00:00.000Z', 1, 'OUTSIDE_OPENING_HOURS'],
    ['two hours running past closing', '2026-12-16T22:00:00.000Z', 2, 'OUTSIDE_OPENING_HOURS'],
    ['a start that is not on the hour', '2026-12-16T10:30:00.000Z', 1, 'SLOT_NOT_ALIGNED'],
    ['an hour that has already started', '2026-12-15T10:00:00.000Z', 1, 'BOOKING_IN_PAST'],
    ['a day in the past', '2026-12-14T12:00:00.000Z', 1, 'BOOKING_IN_PAST'],
  ])('rejects %s with 422', async (_label, startsAt, durationHours, code) => {
    const court = await createCourt(db, { openHour: 8, closeHour: 23 });

    const res = await book(court.id, startsAt, durationHours);

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe(code);
  });

  it('applies opening hours in facility time, not in UTC', async () => {
    clock.set('2026-07-01T00:00:00.000Z');
    const court = await createCourt(db, { openHour: 8, closeHour: 23 });

    expect((await book(court.id, '2026-07-15T07:00:00.000Z', 1)).status).toBe(201);
    expect((await book(court.id, '2026-07-15T06:00:00.000Z', 1)).status).toBe(422);
  });
});

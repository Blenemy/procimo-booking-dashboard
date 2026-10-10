import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createTestDb, resetDb } from './helpers/db';
import { createBooking, createCourt, createUser } from './helpers/factories';

const db = createTestDb();

beforeEach(() => resetDb(db));
afterAll(() => db.$disconnect());

const START = new Date('2026-12-16T10:00:00.000Z');

const setup = async () => {
  const user = await createUser(db);
  const court = await createCourt(db);
  const booking = await createBooking(db, {
    userId: user.id,
    courtId: court.id,
    startsAt: START.toISOString(),
  });
  return { user, court, booking };
};

describe('database constraints', () => {
  it('refuses a second booking slot for the same court and hour', async () => {
    const { user, court } = await setup();
    const other = await db.booking.create({
      data: {
        userId: user.id,
        courtId: court.id,
        startsAt: START,
        endsAt: new Date('2026-12-16T11:00:00.000Z'),
        durationHours: 1,
        totalPriceCents: 2500,
      },
    });

    await expect(
      db.bookingSlot.create({
        data: { courtId: court.id, slotStart: START, bookingId: other.id },
      }),
    ).rejects.toMatchObject({ code: 'P2002', meta: { modelName: 'BookingSlot' } });
  });

  it('refuses a slot that points at a booking on another court', async () => {
    const { booking } = await setup();
    const otherCourt = await createCourt(db);

    await expect(
      db.bookingSlot.create({
        data: {
          courtId: otherCourt.id,
          slotStart: new Date('2026-12-16T12:00:00.000Z'),
          bookingId: booking.id,
        },
      }),
    ).rejects.toMatchObject({ code: 'P2003' });
  });

  it('refuses a slot that does not start on the hour', async () => {
    const { court, booking } = await setup();

    await expect(
      db.bookingSlot.create({
        data: {
          courtId: court.id,
          slotStart: new Date('2026-12-16T12:30:00.000Z'),
          bookingId: booking.id,
        },
      }),
    ).rejects.toThrow(/booking_slots_hour_aligned_check/);
  });

  it.each([
    [
      'an unsupported duration',
      { durationHours: 3, endsAt: new Date('2026-12-16T17:00:00.000Z') },
      'bookings_duration_check',
    ],
    [
      'an end that does not match the duration',
      { endsAt: new Date('2026-12-16T12:00:00.000Z') },
      'bookings_ends_at_check',
    ],
    ['a negative price', { totalPriceCents: -1 }, 'bookings_total_price_check'],
  ])('refuses a booking with %s', async (_label, override, constraint) => {
    const { user, court } = await setup();

    await expect(
      db.booking.create({
        data: {
          userId: user.id,
          courtId: court.id,
          startsAt: new Date('2026-12-16T14:00:00.000Z'),
          endsAt: new Date('2026-12-16T15:00:00.000Z'),
          durationHours: 1,
          totalPriceCents: 2500,
          ...override,
        },
      }),
    ).rejects.toThrow(constraint);
  });

  it('refuses a court that closes before it opens', async () => {
    await expect(createCourt(db, { openHour: 20, closeHour: 8 })).rejects.toThrow(
      /courts_opening_hours_check/,
    );
  });
});

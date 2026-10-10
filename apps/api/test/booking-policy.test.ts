import { describe, expect, it } from 'vitest';
import { BookingPolicy } from '../src/domain/booking-policy';
import type { BookableCourt, BookingRequest } from '../src/domain/booking-policy';
import { FacilityCalendar } from '../src/domain/facility-calendar';

const policy = new BookingPolicy(new FacilityCalendar('Europe/Lisbon'));

const court: BookableCourt = { isActive: true, openHour: 8, closeHour: 23, hourlyPriceCents: 2500 };
const at = (iso: string) => new Date(iso);

const request = (overrides: Partial<BookingRequest> = {}): BookingRequest => ({
  court,
  startsAt: at('2026-12-15T10:00:00.000Z'),
  durationHours: 1,
  now: at('2026-12-14T12:00:00.000Z'),
  ...overrides,
});

describe('BookingPolicy.validate', () => {
  it('accepts a valid booking', () => {
    expect(policy.validate(request())).toBeNull();
  });

  it('rejects an inactive court before anything else', () => {
    expect(
      policy.validate(
        request({ court: { ...court, isActive: false }, startsAt: at('2020-01-01T03:17:00Z') }),
      ),
    ).toBe('COURT_INACTIVE');
  });

  it('rejects a start that is not on the hour', () => {
    expect(policy.validate(request({ startsAt: at('2026-12-15T10:30:00.000Z') }))).toBe(
      'SLOT_NOT_ALIGNED',
    );
  });

  describe('opening hours (08:00-23:00, winter so local time = UTC)', () => {
    it.each([
      ['the first slot', '2026-12-15T08:00:00.000Z', 1, null],
      ['the last slot', '2026-12-15T22:00:00.000Z', 1, null],
      ['two hours ending exactly at close', '2026-12-15T21:00:00.000Z', 2, null],
      ['a start before opening', '2026-12-15T07:00:00.000Z', 1, 'OUTSIDE_OPENING_HOURS'],
      ['a start at closing time', '2026-12-15T23:00:00.000Z', 1, 'OUTSIDE_OPENING_HOURS'],
      ['two hours spilling past close', '2026-12-15T22:00:00.000Z', 2, 'OUTSIDE_OPENING_HOURS'],
    ] as const)('%s', (_label, startsAt, durationHours, expected) => {
      expect(policy.validate(request({ startsAt: at(startsAt), durationHours }))).toBe(expected);
    });

    it('uses local time in summer (08:00 Lisbon = 07:00 UTC)', () => {
      const summerNow = at('2026-07-01T00:00:00.000Z');

      expect(
        policy.validate(request({ startsAt: at('2026-07-15T07:00:00.000Z'), now: summerNow })),
      ).toBeNull();
      expect(
        policy.validate(request({ startsAt: at('2026-07-15T06:00:00.000Z'), now: summerNow })),
      ).toBe('OUTSIDE_OPENING_HOURS');
    });

    it('does not let a court open until midnight take an overnight booking', () => {
      const lateCourt = { ...court, closeHour: 24 };

      expect(
        policy.validate(request({ court: lateCourt, startsAt: at('2026-12-15T23:00:00.000Z') })),
      ).toBeNull();
      expect(
        policy.validate(
          request({ court: lateCourt, startsAt: at('2026-12-15T23:00:00.000Z'), durationHours: 2 }),
        ),
      ).toBe('OUTSIDE_OPENING_HOURS');
    });
  });

  describe('past bookings', () => {
    const startsAt = at('2026-12-15T10:00:00.000Z');

    it('rejects a booking that starts exactly now', () => {
      expect(policy.validate(request({ startsAt, now: startsAt }))).toBe('BOOKING_IN_PAST');
    });

    it('rejects the current hour once it has started', () => {
      expect(policy.validate(request({ startsAt, now: at('2026-12-15T10:20:00.000Z') }))).toBe(
        'BOOKING_IN_PAST',
      );
    });

    it('accepts a booking one millisecond in the future', () => {
      expect(
        policy.validate(request({ startsAt, now: at('2026-12-15T09:59:59.999Z') })),
      ).toBeNull();
    });
  });
});

describe('BookingPolicy slots, end and price', () => {
  const startsAt = at('2026-12-15T10:00:00.000Z');

  it('occupies one slot per booked hour', () => {
    expect(policy.slotsFor(startsAt, 2).map((s) => s.toISOString())).toEqual([
      '2026-12-15T10:00:00.000Z',
      '2026-12-15T11:00:00.000Z',
    ]);
  });

  it('computes the end instant', () => {
    expect(policy.endsAt(startsAt, 2).toISOString()).toBe('2026-12-15T12:00:00.000Z');
  });

  it('charges the hourly price per hour', () => {
    expect(policy.totalPriceCents(court, 2)).toBe(5000);
  });
});

describe('BookingPolicy cancellation window', () => {
  const startsAt = at('2026-12-15T16:00:00.000Z');

  it('ends two hours before the start', () => {
    expect(policy.cancellableUntil(startsAt).toISOString()).toBe('2026-12-15T14:00:00.000Z');
  });

  it.each([
    ['a day before', '2026-12-14T16:00:00.000Z', true],
    ['exactly two hours before', '2026-12-15T14:00:00.000Z', true],
    ['one millisecond inside the window', '2026-12-15T14:00:00.001Z', false],
    ['one hour before', '2026-12-15T15:00:00.000Z', false],
    ['after the start', '2026-12-15T17:00:00.000Z', false],
  ])('%s -> %s', (_label, now, expected) => {
    expect(policy.canCancel(startsAt, at(now))).toBe(expected);
  });
});

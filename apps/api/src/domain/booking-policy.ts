import { ERROR_CODES } from '@courtly/shared';
import type { BookingDuration } from '@courtly/shared';
import type { FacilityCalendar, OpeningHours } from './facility-calendar';
import { DateTime } from './luxon';

export const CANCELLATION_CUTOFF_HOURS = 2;

export interface BookableCourt extends OpeningHours {
  isActive: boolean;
  hourlyPriceCents: number;
}

export interface BookingRequest {
  court: BookableCourt;
  startsAt: Date;
  durationHours: BookingDuration;
  now: Date;
}

export const BOOKING_VIOLATIONS = {
  [ERROR_CODES.COURT_INACTIVE]: 'This court is not accepting bookings',
  [ERROR_CODES.SLOT_NOT_ALIGNED]: 'Bookings must start on the hour',
  [ERROR_CODES.OUTSIDE_OPENING_HOURS]: 'The booking must fit within the court opening hours',
  [ERROR_CODES.BOOKING_IN_PAST]: 'Bookings cannot start in the past',
} as const;

export type BookingViolation = keyof typeof BOOKING_VIOLATIONS;

export class BookingPolicy {
  constructor(private readonly calendar: FacilityCalendar) {}

  validate({ court, startsAt, durationHours, now }: BookingRequest): BookingViolation | null {
    if (!court.isActive) return ERROR_CODES.COURT_INACTIVE;
    if (!this.calendar.isHourAligned(startsAt)) return ERROR_CODES.SLOT_NOT_ALIGNED;

    const openSlots = this.calendar
      .openingSlots(this.calendar.localDate(startsAt), court)
      .map((slot) => slot.getTime());
    const fitsOpeningHours = this.slotsFor(startsAt, durationHours).every((slot) =>
      openSlots.includes(slot.getTime()),
    );
    if (!fitsOpeningHours) return ERROR_CODES.OUTSIDE_OPENING_HOURS;

    if (startsAt <= now) return ERROR_CODES.BOOKING_IN_PAST;
    return null;
  }

  slotsFor(startsAt: Date, durationHours: BookingDuration): Date[] {
    const start = DateTime.fromJSDate(startsAt);
    return Array.from({ length: durationHours }, (_, hour) =>
      start.plus({ hours: hour }).toJSDate(),
    );
  }

  endsAt(startsAt: Date, durationHours: BookingDuration): Date {
    return DateTime.fromJSDate(startsAt).plus({ hours: durationHours }).toJSDate();
  }

  totalPriceCents(court: Pick<BookableCourt, 'hourlyPriceCents'>, durationHours: number): number {
    return court.hourlyPriceCents * durationHours;
  }

  cancellableUntil(startsAt: Date): Date {
    return DateTime.fromJSDate(startsAt).minus({ hours: CANCELLATION_CUTOFF_HOURS }).toJSDate();
  }

  canCancel(startsAt: Date, now: Date): boolean {
    return now <= this.cancellableUntil(startsAt);
  }
}

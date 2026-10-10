import { ERROR_CODES } from '@courtly/shared';
import type { BookingDto, CreateBookingRequest } from '@courtly/shared';
import type { Clock } from '../../core/clock';
import { BOOKING_VIOLATIONS } from '../../domain/booking-policy';
import type { BookingPolicy } from '../../domain/booking-policy';
import { AppError, notFound } from '../../http/errors';
import type { CourtsRepository } from '../courts/repository';
import type { BookingWithCourt, BookingsRepository } from './repository';

const slotTaken = () =>
  new AppError(ERROR_CODES.SLOT_TAKEN, 'This time slot has already been booked');

export function createBookingsService({
  repository,
  courts,
  policy,
  clock,
}: {
  repository: BookingsRepository;
  courts: CourtsRepository;
  policy: BookingPolicy;
  clock: Clock;
}) {
  const toBookingDto = (booking: BookingWithCourt): BookingDto => ({
    id: booking.id,
    court: booking.court,
    startsAt: booking.startsAt.toISOString(),
    endsAt: booking.endsAt.toISOString(),
    durationHours: booking.durationHours,
    status: booking.status,
    totalPriceCents: booking.totalPriceCents,
    createdAt: booking.createdAt.toISOString(),
    cancelledAt: booking.cancelledAt?.toISOString() ?? null,
    cancellableUntil: policy.cancellableUntil(booking.startsAt).toISOString(),
  });

  return {
    async create(userId: number, request: CreateBookingRequest): Promise<BookingDto> {
      const court = await courts.findById(request.courtId);
      if (!court) throw notFound('Court not found');

      const startsAt = new Date(request.startsAt);
      const { durationHours } = request;
      const violation = policy.validate({ court, startsAt, durationHours, now: clock.now() });
      if (violation) throw new AppError(violation, BOOKING_VIOLATIONS[violation]);

      const slots = policy.slotsFor(startsAt, durationHours);
      const taken = await repository.findTakenSlots(court.id, slots);
      if (taken.length > 0) throw slotTaken();

      const booking = await repository.createWithSlots({
        userId,
        courtId: court.id,
        startsAt,
        endsAt: policy.endsAt(startsAt, durationHours),
        durationHours,
        totalPriceCents: policy.totalPriceCents(court, durationHours),
        slots,
      });
      if (!booking) throw slotTaken();
      return toBookingDto(booking);
    },
  };
}

export type BookingsService = ReturnType<typeof createBookingsService>;

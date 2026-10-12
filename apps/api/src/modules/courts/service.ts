import { ERROR_CODES, OPEN_BEFORE_CLOSE_ISSUE } from '@courtly/shared';
import type {
  AvailabilityDto,
  CourtDto,
  CreateCourtInput,
  SlotDto,
  SlotStatus,
  UpdateCourtRequest,
  UpdateCourtResultDto,
} from '@courtly/shared';
import type { Clock } from '../../core/clock';
import { BOOKING_VIOLATIONS } from '../../domain/booking-policy';
import type { BookingPolicy } from '../../domain/booking-policy';
import { SLOT_LENGTH_HOURS } from '../../domain/facility-calendar';
import type { FacilityCalendar } from '../../domain/facility-calendar';
import type { Court } from '../../generated/prisma/client';
import { AppError, notFound } from '../../http/errors';
import type { CourtsRepository } from './repository';

export const toCourtDto = (court: Court): CourtDto => ({
  id: court.id,
  name: court.name,
  sportType: court.sportType,
  hourlyPriceCents: court.hourlyPriceCents,
  openHour: court.openHour,
  closeHour: court.closeHour,
  isActive: court.isActive,
});

export function createCourtsService({
  repository,
  calendar,
  policy,
  clock,
}: {
  repository: CourtsRepository;
  calendar: FacilityCalendar;
  policy: BookingPolicy;
  clock: Clock;
}) {
  const requireCourt = async (id: number) => {
    const court = await repository.findById(id);
    if (!court) throw notFound('Court not found');
    return court;
  };

  const countAffectedFutureBookings = async (court: Court) => {
    const future = await repository.findFutureConfirmedBookings(court.id, clock.now());
    if (!court.isActive) return future.length;
    return future.filter((b) => !policy.fitsOpeningHours(court, b.startsAt, b.durationHours))
      .length;
  };

  const slotStatus = (startsAt: Date, bookedBy: number | undefined, now: Date): SlotStatus => {
    if (bookedBy !== undefined) return 'BOOKED';
    return policy.hasStarted(startsAt, now) ? 'PAST' : 'AVAILABLE';
  };

  return {
    async listActive(): Promise<CourtDto[]> {
      return (await repository.listActive()).map(toCourtDto);
    },

    async listAll(): Promise<CourtDto[]> {
      return (await repository.listAll()).map(toCourtDto);
    },

    async create(input: CreateCourtInput): Promise<CourtDto> {
      return toCourtDto(await repository.create(input));
    },

    async update(id: number, changes: UpdateCourtRequest): Promise<UpdateCourtResultDto> {
      const current = await requireCourt(id);
      const openHour = changes.openHour ?? current.openHour;
      const closeHour = changes.closeHour ?? current.closeHour;
      if (openHour >= closeHour) {
        throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Invalid request', [
          {
            path: OPEN_BEFORE_CLOSE_ISSUE.path.join('.'),
            message: OPEN_BEFORE_CLOSE_ISSUE.message,
          },
        ]);
      }

      const court = await repository.update(id, changes);
      return {
        court: toCourtDto(court),
        warnings: { affectedFutureBookings: await countAffectedFutureBookings(court) },
      };
    },

    async availability(courtId: number, date: string, viewerId: number): Promise<AvailabilityDto> {
      const court = await requireCourt(courtId);
      if (!court.isActive) {
        throw new AppError(ERROR_CODES.COURT_INACTIVE, BOOKING_VIOLATIONS.COURT_INACTIVE);
      }

      const now = clock.now();
      const taken = await repository.findTakenSlots(court.id, calendar.dayRange(date));
      const bookedBy = new Map(taken.map((s) => [s.slotStart.getTime(), s.booking.userId]));

      const slots = calendar.openingSlots(date, court).map((startsAt): SlotDto => {
        const owner = bookedBy.get(startsAt.getTime());
        return {
          startsAt: startsAt.toISOString(),
          endsAt: policy.endsAt(startsAt, SLOT_LENGTH_HOURS).toISOString(),
          localTime: calendar.localTime(startsAt),
          status: slotStatus(startsAt, owner, now),
          mine: owner === viewerId,
        };
      });

      return { court: toCourtDto(court), date, slots };
    },
  };
}

export type CourtsService = ReturnType<typeof createCourtsService>;

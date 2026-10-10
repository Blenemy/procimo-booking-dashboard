import type { CreateCourtInput, UpdateCourtRequest } from '@courtly/shared';
import type { Db } from '../../db/client';

export const createCourtsRepository = (db: Db) => ({
  listActive: () => db.court.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),

  listAll: () => db.court.findMany({ orderBy: { id: 'asc' } }),

  findById: (id: number) => db.court.findUnique({ where: { id } }),

  create: (data: CreateCourtInput) => db.court.create({ data }),

  update: (id: number, data: UpdateCourtRequest) => db.court.update({ where: { id }, data }),

  findFutureConfirmedBookings: (courtId: number, now: Date) =>
    db.booking.findMany({
      where: { courtId, status: 'CONFIRMED', startsAt: { gt: now } },
      select: { startsAt: true, durationHours: true },
    }),

  findTakenSlots: (courtId: number, range: { start: Date; end: Date }) =>
    db.bookingSlot.findMany({
      where: { courtId, slotStart: { gte: range.start, lt: range.end } },
      select: { slotStart: true, booking: { select: { userId: true } } },
    }),
});

export type CourtsRepository = ReturnType<typeof createCourtsRepository>;

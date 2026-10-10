import type { Db } from '../../db/client';
import { isUniqueViolation } from '../../db/errors';
import type { TransactionRetry } from '../../db/transaction-retry';
import { Prisma } from '../../generated/prisma/client';

export interface NewBooking {
  userId: number;
  courtId: number;
  startsAt: Date;
  endsAt: Date;
  durationHours: number;
  totalPriceCents: number;
  slots: Date[];
}

const withCourt = {
  court: { select: { id: true, name: true, sportType: true } },
} satisfies Prisma.BookingInclude;

const ascending = (slots: Date[]) => [...slots].sort((a, b) => a.getTime() - b.getTime());

export const createBookingsRepository = (db: Db, retry: TransactionRetry) => ({
  findTakenSlots: (courtId: number, slots: Date[]): Promise<{ slotStart: Date }[]> =>
    db.bookingSlot.findMany({
      where: { courtId, slotStart: { in: slots } },
      select: { slotStart: true },
    }),

  createWithSlots: async ({ slots, ...booking }: NewBooking) => {
    try {
      return await retry.run(() =>
        db.booking.create({
          data: {
            ...booking,
            slots: { createMany: { data: ascending(slots).map((slotStart) => ({ slotStart })) } },
          },
          include: withCourt,
        }),
      );
    } catch (error) {
      if (isUniqueViolation(error, Prisma.ModelName.BookingSlot)) return null;
      throw error;
    }
  },
});

export type BookingsRepository = ReturnType<typeof createBookingsRepository>;
export type BookingWithCourt = NonNullable<
  Awaited<ReturnType<BookingsRepository['createWithSlots']>>
>;

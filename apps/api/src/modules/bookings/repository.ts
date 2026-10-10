import type { BookingScope } from '@courtly/shared';
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

export type BookingWithCourt = Prisma.BookingGetPayload<{ include: typeof withCourt }>;

const ascending = (slots: Date[]) => [...slots].sort((a, b) => a.getTime() - b.getTime());

export const createBookingsRepository = (db: Db, retry: TransactionRetry) => ({
  findTakenSlots: (courtId: number, slots: Date[]): Promise<{ slotStart: Date }[]> =>
    db.bookingSlot.findMany({
      where: { courtId, slotStart: { in: slots } },
      select: { slotStart: true },
    }),

  findOwned: (id: number, userId: number) =>
    db.booking.findFirst({ where: { id, userId }, include: withCourt }),

  listForUser: (userId: number, scope: BookingScope, now: Date) => {
    const upcoming = scope === 'upcoming';
    return db.booking.findMany({
      where: { userId, endsAt: upcoming ? { gt: now } : { lte: now } },
      orderBy: { startsAt: upcoming ? 'asc' : 'desc' },
      include: withCourt,
    });
  },

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

  cancel: (id: number, userId: number, now: Date) =>
    retry.run(() =>
      db.$transaction(async (tx) => {
        const { count } = await tx.booking.updateMany({
          where: { id, userId, status: 'CONFIRMED' },
          data: { status: 'CANCELLED', cancelledAt: now },
        });
        if (count === 0) return null;
        await tx.bookingSlot.deleteMany({ where: { bookingId: id } });
        return tx.booking.findUniqueOrThrow({ where: { id }, include: withCourt });
      }),
    ),
});

export type BookingsRepository = ReturnType<typeof createBookingsRepository>;

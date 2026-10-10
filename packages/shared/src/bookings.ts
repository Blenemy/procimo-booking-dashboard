import { z } from 'zod';
import { isoDateTimeSchema } from './common';
import { BOOKING_DURATIONS } from './constants';
import type { BookingStatus, SportType } from './constants';

export const createBookingSchema = z.strictObject({
  courtId: z.int().positive(),
  startsAt: isoDateTimeSchema,
  durationHours: z.literal(BOOKING_DURATIONS),
});
export type CreateBookingRequest = z.infer<typeof createBookingSchema>;

export const myBookingsQuerySchema = z.object({
  scope: z.enum(['upcoming', 'past']).default('upcoming'),
});
export type MyBookingsQuery = z.infer<typeof myBookingsQuerySchema>;
export type BookingScope = MyBookingsQuery['scope'];

export interface BookingDto {
  id: number;
  court: {
    id: number;
    name: string;
    sportType: SportType;
  };
  startsAt: string;
  endsAt: string;
  durationHours: number;
  status: BookingStatus;
  totalPriceCents: number;
  createdAt: string;
  cancelledAt: string | null;
  cancellableUntil: string;
}

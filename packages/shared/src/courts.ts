import { z } from 'zod';
import {
  COURT_NAME_MAX_LENGTH,
  HOURS_PER_DAY,
  LAST_HOUR_OF_DAY,
  MAX_HOURLY_PRICE_CENTS,
  SPORT_TYPES,
} from './constants';
import type { SlotStatus, SportType } from './constants';

export const courtFieldsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Enter a court name')
    .max(COURT_NAME_MAX_LENGTH, 'Name is too long'),
  sportType: z.enum(SPORT_TYPES),
  hourlyPriceCents: z
    .int()
    .min(0, 'Price cannot be negative')
    .max(MAX_HOURLY_PRICE_CENTS, 'Price is too high'),
  openHour: z.int().min(0).max(LAST_HOUR_OF_DAY),
  closeHour: z.int().min(1).max(HOURS_PER_DAY),
});

export const openBeforeClose = (c: { openHour?: number; closeHour?: number }) =>
  c.openHour === undefined || c.closeHour === undefined || c.openHour < c.closeHour;

export const OPEN_BEFORE_CLOSE_ISSUE = {
  message: 'Closing time must be after opening time',
  path: ['closeHour'],
};

export const createCourtSchema = z
  .strictObject({ ...courtFieldsSchema.shape, isActive: z.boolean().default(true) })
  .refine(openBeforeClose, OPEN_BEFORE_CLOSE_ISSUE);
export type CreateCourtRequest = z.input<typeof createCourtSchema>;
export type CreateCourtInput = z.output<typeof createCourtSchema>;

export const updateCourtSchema = z
  .strictObject({ ...courtFieldsSchema.shape, isActive: z.boolean() })
  .partial()
  .refine((c) => Object.keys(c).length > 0, { message: 'Nothing to update' })
  .refine(openBeforeClose, OPEN_BEFORE_CLOSE_ISSUE);
export type UpdateCourtRequest = z.infer<typeof updateCourtSchema>;

export interface CourtDto {
  id: number;
  name: string;
  sportType: SportType;
  hourlyPriceCents: number;
  openHour: number;
  closeHour: number;
  isActive: boolean;
}

export interface UpdateCourtResultDto {
  court: CourtDto;
  warnings: {
    affectedFutureBookings: number;
  };
}

export interface SlotDto {
  startsAt: string;
  endsAt: string;
  localTime: string;
  status: SlotStatus;
  mine: boolean;
}

export interface AvailabilityDto {
  court: CourtDto;
  date: string;
  slots: SlotDto[];
}

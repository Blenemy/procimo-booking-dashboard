import { z } from 'zod';
import {
  COURT_NAME_MAX_LENGTH,
  HOURS_PER_DAY,
  LAST_HOUR_OF_DAY,
  MAX_HOURLY_PRICE_CENTS,
  SPORT_TYPES,
} from './constants';
import type { SlotStatus, SportType } from './constants';

const courtFields = {
  name: z.string().trim().min(1).max(COURT_NAME_MAX_LENGTH),
  sportType: z.enum(SPORT_TYPES),
  hourlyPriceCents: z.int().min(0).max(MAX_HOURLY_PRICE_CENTS),
  openHour: z.int().min(0).max(LAST_HOUR_OF_DAY),
  closeHour: z.int().min(1).max(HOURS_PER_DAY),
};

const openBeforeClose = (c: { openHour?: number; closeHour?: number }) =>
  c.openHour === undefined || c.closeHour === undefined || c.openHour < c.closeHour;

const openBeforeCloseIssue = {
  message: 'openHour must be before closeHour',
  path: ['closeHour'],
};

export const createCourtSchema = z
  .strictObject({ ...courtFields, isActive: z.boolean().default(true) })
  .refine(openBeforeClose, openBeforeCloseIssue);
export type CreateCourtRequest = z.input<typeof createCourtSchema>;

export const updateCourtSchema = z
  .strictObject({ ...courtFields, isActive: z.boolean() })
  .partial()
  .refine((c) => Object.keys(c).length > 0, { message: 'Nothing to update' })
  .refine(openBeforeClose, openBeforeCloseIssue);
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

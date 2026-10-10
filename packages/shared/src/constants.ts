export const ROLES = ['USER', 'ADMIN'] as const;
export type Role = (typeof ROLES)[number];

export const SPORT_TYPES = ['PADEL', 'TENNIS', 'SQUASH', 'PICKLEBALL'] as const;
export type SportType = (typeof SPORT_TYPES)[number];

export const BOOKING_STATUSES = ['CONFIRMED', 'CANCELLED'] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const MIN_BOOKING_HOURS = 1;
export const MAX_BOOKING_HOURS = 2;
export const BOOKING_DURATIONS = [MIN_BOOKING_HOURS, MAX_BOOKING_HOURS] as const;
export type BookingDuration = (typeof BOOKING_DURATIONS)[number];

export const SLOT_STATUSES = ['AVAILABLE', 'BOOKED', 'PAST'] as const;
export type SlotStatus = (typeof SLOT_STATUSES)[number];

export const HOURS_PER_DAY = 24;
export const LAST_HOUR_OF_DAY = HOURS_PER_DAY - 1;

export const COURT_NAME_MAX_LENGTH = 100;
export const MAX_HOURLY_PRICE_CENTS = 1_000_000;
export const PASSWORD_MAX_LENGTH = 200;

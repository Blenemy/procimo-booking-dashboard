export const ROLES = ['USER', 'ADMIN'] as const;
export type Role = (typeof ROLES)[number];

export const SPORT_TYPES = ['PADEL', 'TENNIS', 'SQUASH', 'PICKLEBALL'] as const;
export type SportType = (typeof SPORT_TYPES)[number];

export const BOOKING_STATUSES = ['CONFIRMED', 'CANCELLED'] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const BOOKING_DURATIONS = [1, 2] as const;
export type BookingDuration = (typeof BOOKING_DURATIONS)[number];

export const SLOT_STATUSES = ['AVAILABLE', 'BOOKED', 'PAST'] as const;
export type SlotStatus = (typeof SLOT_STATUSES)[number];

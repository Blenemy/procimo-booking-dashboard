import type { Role } from '@courtly/shared';

export const PATHS = {
  login: '/login',
  book: '/book',
  myBookings: '/bookings',
  adminCourts: '/admin/courts',
  adminDay: '/admin/day',
} as const;

const HOME_PATHS: Record<Role, string> = {
  USER: PATHS.book,
  ADMIN: PATHS.adminDay,
};

export const homePathFor = (role: Role) => HOME_PATHS[role];

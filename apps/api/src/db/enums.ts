import type { BookingStatus, Role, SportType } from '@courtly/shared';
import type {
  BookingStatus as DbBookingStatus,
  Role as DbRole,
  SportType as DbSportType,
} from '../generated/prisma/enums';

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never;

export const enumsInSync: [
  Same<Role, DbRole>,
  Same<SportType, DbSportType>,
  Same<BookingStatus, DbBookingStatus>,
] = [true, true, true];

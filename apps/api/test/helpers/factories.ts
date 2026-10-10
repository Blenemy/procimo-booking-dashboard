import type { BookingStatus, Role, SportType } from '@courtly/shared';
import { MILLISECONDS_PER_HOUR } from '../../src/core/time';
import type { Db } from '../../src/db/client';
import { PasswordHasher } from '../../src/modules/auth/lib/password-hasher';

const DEFAULT_PASSWORD = 'password123';

const passwordHasher = new PasswordHasher();
let sequence = 0;

export async function createUser(
  db: Db,
  overrides: { email?: string; name?: string; role?: Role; password?: string } = {},
) {
  sequence += 1;
  return db.user.create({
    data: {
      email: overrides.email ?? `user${sequence}@courtly.test`,
      name: overrides.name ?? `User ${sequence}`,
      role: overrides.role ?? 'USER',
      passwordHash: await passwordHasher.hash(overrides.password ?? DEFAULT_PASSWORD),
    },
  });
}

export function createCourt(
  db: Db,
  overrides: Partial<{
    name: string;
    sportType: SportType;
    hourlyPriceCents: number;
    openHour: number;
    closeHour: number;
    isActive: boolean;
  }> = {},
) {
  sequence += 1;
  return db.court.create({
    data: {
      name: `Court ${sequence}`,
      sportType: 'PADEL',
      hourlyPriceCents: 2500,
      openHour: 8,
      closeHour: 23,
      isActive: true,
      ...overrides,
    },
  });
}

export function createBooking(
  db: Pick<Db, 'booking'>,
  {
    userId,
    courtId,
    startsAt,
    durationHours = 1,
    status = 'CONFIRMED',
    totalPriceCents = 2500 * durationHours,
  }: {
    userId: number;
    courtId: number;
    startsAt: string;
    durationHours?: 1 | 2;
    status?: BookingStatus;
    totalPriceCents?: number;
  },
) {
  const start = new Date(startsAt);
  const slots = Array.from({ length: durationHours }, (_, hour) => ({
    slotStart: new Date(start.getTime() + hour * MILLISECONDS_PER_HOUR),
  }));
  return db.booking.create({
    data: {
      userId,
      courtId,
      startsAt: start,
      endsAt: new Date(start.getTime() + durationHours * MILLISECONDS_PER_HOUR),
      durationHours,
      status,
      totalPriceCents,
      cancelledAt: status === 'CANCELLED' ? start : null,
      slots: status === 'CONFIRMED' ? { create: slots } : undefined,
    },
  });
}

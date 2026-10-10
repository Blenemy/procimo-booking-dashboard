import type { Role } from '@courtly/shared';
import { systemClock } from './core/clock';
import { loadSeedConfig } from './core/config';
import { createLogger } from './core/logger';
import { createPrismaClient } from './db/client';
import { TransactionRetry } from './db/transaction-retry';
import { BookingPolicy } from './domain/booking-policy';
import { FacilityCalendar } from './domain/facility-calendar';
import { DateTime } from './domain/luxon';
import { PasswordHasher } from './modules/auth/lib/password-hasher';
import { createUsersRepository } from './modules/auth/repository';
import { createBookingsRepository } from './modules/bookings/repository';
import { createCourtsRepository } from './modules/courts/repository';

const SEED_PASSWORD = 'password123';
const SEED_DB_CONNECTIONS = 1;

const config = loadSeedConfig();
const logger = createLogger(config.logLevel);
const db = createPrismaClient(config.databaseUrl, SEED_DB_CONNECTIONS);

const users = createUsersRepository(db);
const courts = createCourtsRepository(db);
const bookings = createBookingsRepository(db, new TransactionRetry());
const policy = new BookingPolicy(new FacilityCalendar(config.timezone));
const passwordHasher = new PasswordHasher();

async function seed() {
  if ((await users.count()) > 0) {
    logger.info('Database already has data, skipping seed');
    return;
  }

  const now = systemClock.now();
  const today = DateTime.fromJSDate(now, { zone: config.timezone }).startOf('day');
  const passwordHash = await passwordHasher.hash(SEED_PASSWORD);
  const createUser = (email: string, name: string, role: Role) =>
    users.create({ email, name, role, passwordHash });

  await createUser('admin@courtly.test', 'Ada Admin', 'ADMIN');
  const alice = await createUser('alice@courtly.test', 'Alice Martins', 'USER');
  const bob = await createUser('bob@courtly.test', 'Bob Silva', 'USER');

  const padel1 = await courts.create({
    name: 'Padel 1',
    sportType: 'PADEL',
    hourlyPriceCents: 2500,
    openHour: 8,
    closeHour: 23,
    isActive: true,
  });
  const padel2 = await courts.create({
    name: 'Padel 2',
    sportType: 'PADEL',
    hourlyPriceCents: 2500,
    openHour: 8,
    closeHour: 23,
    isActive: true,
  });
  const tennis = await courts.create({
    name: 'Centre Court',
    sportType: 'TENNIS',
    hourlyPriceCents: 3000,
    openHour: 7,
    closeHour: 22,
    isActive: true,
  });
  const squash = await courts.create({
    name: 'Squash 1',
    sportType: 'SQUASH',
    hourlyPriceCents: 1800,
    openHour: 9,
    closeHour: 21,
    isActive: true,
  });

  const plan = [
    { user: alice, court: padel1, dayOffset: -1, hour: 18, durationHours: 2 },
    { user: bob, court: squash, dayOffset: -1, hour: 10, durationHours: 1 },
    { user: bob, court: padel2, dayOffset: 0, hour: 19, durationHours: 1 },
    { user: alice, court: tennis, dayOffset: 0, hour: 20, durationHours: 1 },
    { user: alice, court: padel1, dayOffset: 1, hour: 10, durationHours: 1 },
    { user: bob, court: tennis, dayOffset: 1, hour: 17, durationHours: 2 },
    { user: alice, court: padel2, dayOffset: 1, hour: 12, durationHours: 1, cancelled: true },
  ];

  for (const { user, court, dayOffset, hour, durationHours, cancelled } of plan) {
    const startsAt = today.plus({ days: dayOffset }).set({ hour }).toJSDate();
    const booking = await bookings.createWithSlots({
      userId: user.id,
      courtId: court.id,
      startsAt,
      endsAt: policy.endsAt(startsAt, durationHours),
      durationHours,
      totalPriceCents: policy.totalPriceCents(court, durationHours),
      slots: policy.slotsFor(startsAt, durationHours),
    });
    if (booking && cancelled) await bookings.cancel(booking.id, user.id, now);
  }

  await courts.update(squash.id, { isActive: false });

  logger.info({ bookings: plan.length }, 'Seeded demo data');
}

try {
  await seed();
} finally {
  await db.$disconnect();
}

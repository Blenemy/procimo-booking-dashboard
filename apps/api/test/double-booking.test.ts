import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { EventBus } from '../src/core/event-bus';
import { isTransactionConflict } from '../src/db/errors';
import { DEFAULT_TRANSACTION_RETRY, TransactionRetry } from '../src/db/transaction-retry';
import { BookingPolicy } from '../src/domain/booking-policy';
import { FacilityCalendar } from '../src/domain/facility-calendar';
import { AppError } from '../src/http/errors';
import { createBookingsRepository } from '../src/modules/bookings/repository';
import type { BookingsRepository } from '../src/modules/bookings/repository';
import { createBookingsService } from '../src/modules/bookings/service';
import { createCourtsRepository } from '../src/modules/courts/repository';
import { createTestApp, fixedClock, sessionCookie, testConfig } from './helpers/app';
import { createTestDb, resetDb } from './helpers/db';
import { createBooking, createCourt, createUser } from './helpers/factories';
import { holdSlot, waitForBlockedSlotInserts } from './helpers/locks';

const db = createTestDb();
const clock = fixedClock('2026-12-15T10:20:00.000Z');
const app = createTestApp(db, { clock });
const { timezone, currency } = testConfig();
const calendar = new FacilityCalendar(timezone);
const policy = new BookingPolicy(calendar);

beforeEach(() => resetDb(db));
afterAll(() => db.$disconnect());

const SLOT = '2026-12-16T10:00:00.000Z';

const createUsers = (count: number) =>
  Promise.all(Array.from({ length: count }, () => createUser(db)));

const book = async (userId: number, body: object) =>
  request(app)
    .post('/api/bookings')
    .set('Cookie', await sessionCookie(userId))
    .send(body);

const statuses = (responses: { status: number }[]) =>
  responses.map((r) => r.status).sort((a, b) => a - b);

const ledger = async () => ({
  bookings: await db.booking.count(),
  slots: (await db.bookingSlot.findMany({ orderBy: { slotStart: 'asc' } })).map((s) =>
    s.slotStart.toISOString(),
  ),
});

const buildService = ({
  retry = new TransactionRetry(),
  repository = createBookingsRepository(db, retry),
}: { retry?: TransactionRetry; repository?: BookingsRepository } = {}) =>
  createBookingsService({
    repository,
    courts: createCourtsRepository(db),
    calendar,
    policy,
    clock,
    currency,
    events: new EventBus(),
  });

const outcome = (attempt: Promise<unknown>) =>
  attempt.then(
    () => 'created',
    (error: unknown) => {
      if (error instanceof AppError) return error.code;
      if (isTransactionConflict(error)) return 'DEADLOCK';
      throw error;
    },
  );

const barrier = (parties: number) => {
  let arrived = 0;
  let open!: () => void;
  const opened = new Promise<void>((resolve) => {
    open = resolve;
  });
  return () => {
    arrived += 1;
    if (arrived === parties) open();
    return opened;
  };
};

describe('overlapping bookings', () => {
  it.each([
    [409, 'the same hour', '2026-12-16T11:00:00.000Z', 1],
    [409, 'two hours ending inside it', '2026-12-16T10:00:00.000Z', 2],
    [409, 'two hours starting inside it', '2026-12-16T11:00:00.000Z', 2],
    [201, 'the hour right before it', '2026-12-16T10:00:00.000Z', 1],
    [201, 'two hours right after it', '2026-12-16T12:00:00.000Z', 2],
  ])(
    'returns %i for %s next to an existing 11:00 booking',
    async (status, _label, startsAt, durationHours) => {
      const [owner, other] = await createUsers(2);
      const court = await createCourt(db);
      await createBooking(db, {
        userId: owner!.id,
        courtId: court.id,
        startsAt: '2026-12-16T11:00:00.000Z',
      });

      const res = await book(other!.id, { courtId: court.id, startsAt, durationHours });

      expect(res.status).toBe(status);
    },
  );
});

describe('concurrent requests', () => {
  it('lets exactly one of ten simultaneous requests take a slot', async () => {
    const court = await createCourt(db);
    const users = await createUsers(10);

    const responses = await Promise.all(
      users.map((u) => book(u.id, { courtId: court.id, startsAt: SLOT, durationHours: 1 })),
    );

    expect(statuses(responses)).toEqual([201, ...Array<number>(9).fill(409)]);
    expect(await ledger()).toEqual({ bookings: 1, slots: [SLOT] });
  });

  it('lets only one of ten overlapping two-hour requests win', async () => {
    const court = await createCourt(db);
    const users = await createUsers(10);

    const responses = await Promise.all(
      users.map((u, i) =>
        book(u.id, {
          courtId: court.id,
          startsAt: i % 2 === 0 ? '2026-12-16T10:00:00.000Z' : '2026-12-16T11:00:00.000Z',
          durationHours: 2,
        }),
      ),
    );

    expect(statuses(responses)).toEqual([201, ...Array<number>(9).fill(409)]);
    const { bookings, slots } = await ledger();
    expect(bookings).toBe(1);
    expect(slots).toHaveLength(2);
  });
});

describe('database guarantee', () => {
  it('picks a single winner even when every pre-check sees the slot free', async () => {
    const court = await createCourt(db);
    const users = await createUsers(8);
    const repository = createBookingsRepository(db, new TransactionRetry());
    const arrive = barrier(users.length);
    const preChecks: number[] = [];
    const service = buildService({
      repository: {
        ...repository,
        findTakenSlots: async (...args) => {
          const taken = await repository.findTakenSlots(...args);
          preChecks.push(taken.length);
          await arrive();
          return taken;
        },
      },
    });

    const outcomes = await Promise.all(
      users.map((u) =>
        outcome(service.create(u.id, { courtId: court.id, startsAt: SLOT, durationHours: 1 })),
      ),
    );

    expect(preChecks).toEqual(Array<number>(users.length).fill(0));
    expect(outcomes.sort()).toEqual([...Array<string>(7).fill('SLOT_TAKEN'), 'created']);
    expect(await ledger()).toEqual({ bookings: 1, slots: [SLOT] });
  });

  it('refuses a duplicate slot row even when the application is bypassed', async () => {
    const user = await createUser(db);
    const court = await createCourt(db);
    await createBooking(db, { userId: user.id, courtId: court.id, startsAt: SLOT });
    const other = await createBooking(db, {
      userId: user.id,
      courtId: court.id,
      startsAt: '2026-12-16T12:00:00.000Z',
    });

    await expect(
      db.bookingSlot.create({
        data: { courtId: court.id, slotStart: new Date(SLOT), bookingId: other.id },
      }),
    ).rejects.toMatchObject({ code: 'P2002' });
  });

  it('keeps slot keys canonical by refusing times that are not on the hour', async () => {
    const user = await createUser(db);
    const court = await createCourt(db);
    const booking = await createBooking(db, { userId: user.id, courtId: court.id, startsAt: SLOT });

    await expect(
      db.bookingSlot.create({
        data: {
          courtId: court.id,
          slotStart: new Date('2026-12-16T10:00:00.001Z'),
          bookingId: booking.id,
        },
      }),
    ).rejects.toThrow(/booking_slots_hour_aligned_check/);
  });
});

describe('deadlock retry', () => {
  it('reproduces the deadlock that the retry exists for', async () => {
    const court = await createCourt(db);
    const [holder, ...racers] = await createUsers(3);
    const service = buildService({
      retry: new TransactionRetry({ ...DEFAULT_TRANSACTION_RETRY, maxAttempts: 1 }),
    });
    const lock = await holdSlot(db, { userId: holder!.id, courtId: court.id, startsAt: SLOT });

    const outcomes = racers.map((u) =>
      outcome(service.create(u.id, { courtId: court.id, startsAt: SLOT, durationHours: 1 })),
    );
    await waitForBlockedSlotInserts(db, racers.length);
    await lock.rollback();

    expect((await Promise.all(outcomes)).sort()).toEqual(['DEADLOCK', 'created']);
  });

  it('answers clients caught in that deadlock with 201 and 409, never 500', async () => {
    const court = await createCourt(db);
    const [holder, ...racers] = await createUsers(3);
    const lock = await holdSlot(db, { userId: holder!.id, courtId: court.id, startsAt: SLOT });

    const pending = racers.map((u) =>
      book(u.id, { courtId: court.id, startsAt: SLOT, durationHours: 1 }),
    );
    await waitForBlockedSlotInserts(db, racers.length);
    await lock.rollback();

    expect(statuses(await Promise.all(pending))).toEqual([201, 409]);
    expect(await ledger()).toEqual({ bookings: 1, slots: [SLOT] });
  });
});

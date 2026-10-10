import type { CreateBookingRequest } from '@courtly/shared';
import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
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
import { createCourt, createUser } from './helpers/factories';
import { holdSlot, waitForBlockedSlotInserts } from './helpers/locks';

const db = createTestDb();
const clock = fixedClock('2026-12-15T10:20:00.000Z');
const app = createTestApp(db, { clock });
const policy = new BookingPolicy(new FacilityCalendar(testConfig().timezone));

beforeEach(() => resetDb(db));
afterAll(() => db.$disconnect());

const SLOT = '2026-12-16T10:00:00.000Z';

const createUsers = (count: number) =>
  Promise.all(Array.from({ length: count }, () => createUser(db)));

const book = async (userId: number, body: CreateBookingRequest) =>
  request(app)
    .post('/api/bookings')
    .set('Cookie', await sessionCookie(userId))
    .send(body);

const statuses = (responses: { status: number }[]) =>
  responses.map((r) => r.status).sort((a, b) => a - b);

const buildService = ({
  retry = new TransactionRetry(),
  repository = createBookingsRepository(db, retry),
}: { retry?: TransactionRetry; repository?: BookingsRepository } = {}) =>
  createBookingsService({ repository, courts: createCourtsRepository(db), policy, clock });

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

const ledger = async () => ({
  bookings: await db.booking.count(),
  slots: (await db.bookingSlot.findMany({ orderBy: { slotStart: 'asc' } })).map((s) =>
    s.slotStart.toISOString(),
  ),
});

describe('concurrent booking requests', () => {
  it('lets exactly one of ten simultaneous requests take a slot', async () => {
    const court = await createCourt(db);
    const users = await createUsers(10);

    const responses = await Promise.all(
      users.map((u) => book(u.id, { courtId: court.id, startsAt: SLOT, durationHours: 1 })),
    );

    expect(statuses(responses)).toEqual([201, ...Array<number>(9).fill(409)]);
    expect(await ledger()).toEqual({ bookings: 1, slots: [SLOT] });
  });

  it('lets only one of overlapping two-hour requests win', async () => {
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

  it('accepts adjacent requests made at the same time', async () => {
    const court = await createCourt(db);
    const [a, b, c] = await createUsers(3);

    const responses = await Promise.all([
      book(a!.id, { courtId: court.id, startsAt: '2026-12-16T10:00:00.000Z', durationHours: 1 }),
      book(b!.id, { courtId: court.id, startsAt: '2026-12-16T11:00:00.000Z', durationHours: 1 }),
      book(c!.id, { courtId: court.id, startsAt: '2026-12-16T12:00:00.000Z', durationHours: 2 }),
    ]);

    expect(statuses(responses)).toEqual([201, 201, 201]);
    expect((await ledger()).slots).toHaveLength(4);
  });

  it('never double-books or fails under a burst of mixed requests', async () => {
    const court = await createCourt(db);
    const users = await createUsers(4);
    const requests = users.flatMap((u) =>
      [10, 11, 12, 13].flatMap((hour) =>
        ([1, 2] as const).map((durationHours) => ({
          userId: u.id,
          body: {
            courtId: court.id,
            startsAt: `2026-12-16T${hour}:00:00.000Z`,
            durationHours,
          },
        })),
      ),
    );

    const responses = await Promise.all(requests.map((r) => book(r.userId, r.body)));

    expect(responses.every((r) => r.status === 201 || r.status === 409)).toBe(true);
    const created = responses.filter((r) => r.status === 201).map((r) => r.body);
    const bookedHours = created.reduce((sum, b) => sum + b.durationHours, 0);
    const { bookings, slots } = await ledger();
    expect(bookings).toBe(created.length);
    expect(slots).toHaveLength(bookedHours);
    expect(new Set(slots).size).toBe(slots.length);
  });
});

describe('database guarantee', () => {
  it('rejects all but one request even when every pre-check sees the slot free', async () => {
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

  it('makes a request wait for an uncommitted booking and then rejects it', async () => {
    const court = await createCourt(db);
    const [holder, challenger] = await createUsers(2);
    const lock = await holdSlot(db, { userId: holder!.id, courtId: court.id, startsAt: SLOT });

    const pending = book(challenger!.id, { courtId: court.id, startsAt: SLOT, durationHours: 1 });
    await waitForBlockedSlotInserts(db, 1);
    await lock.commit();

    expect((await pending).status).toBe(409);
    expect(await ledger()).toEqual({ bookings: 1, slots: [SLOT] });
  });

  it('lets the waiting request through when the holder rolls back', async () => {
    const court = await createCourt(db);
    const [holder, challenger] = await createUsers(2);
    const lock = await holdSlot(db, { userId: holder!.id, courtId: court.id, startsAt: SLOT });

    const pending = book(challenger!.id, { courtId: court.id, startsAt: SLOT, durationHours: 1 });
    await waitForBlockedSlotInserts(db, 1);
    await lock.rollback();

    expect((await pending).status).toBe(201);
    expect(await ledger()).toEqual({ bookings: 1, slots: [SLOT] });
  });
});

describe('deadlock retry', () => {
  const raceAfterRollback = async (service: ReturnType<typeof buildService>) => {
    const court = await createCourt(db);
    const [holder, ...racers] = await createUsers(3);
    const lock = await holdSlot(db, { userId: holder!.id, courtId: court.id, startsAt: SLOT });

    const outcomes = racers.map((u) =>
      outcome(service.create(u.id, { courtId: court.id, startsAt: SLOT, durationHours: 1 })),
    );
    await waitForBlockedSlotInserts(db, racers.length);
    await lock.rollback();
    return (await Promise.all(outcomes)).sort();
  };

  it('produces a deadlock when two waiters are released at once', async () => {
    const noRetry = new TransactionRetry({ ...DEFAULT_TRANSACTION_RETRY, maxAttempts: 1 });

    expect(await raceAfterRollback(buildService({ retry: noRetry }))).toEqual([
      'DEADLOCK',
      'created',
    ]);
    expect(await ledger()).toEqual({ bookings: 1, slots: [SLOT] });
  });

  it('retries that deadlock and answers with a clean conflict', async () => {
    expect(await raceAfterRollback(buildService())).toEqual(['SLOT_TAKEN', 'created']);
    expect(await ledger()).toEqual({ bookings: 1, slots: [SLOT] });
  });

  it('never returns a 500 to clients in that situation', async () => {
    const court = await createCourt(db);
    const [holder, a, b] = await createUsers(3);
    const lock = await holdSlot(db, { userId: holder!.id, courtId: court.id, startsAt: SLOT });

    const pending = [a!, b!].map((u) =>
      book(u.id, { courtId: court.id, startsAt: SLOT, durationHours: 1 }),
    );
    await waitForBlockedSlotInserts(db, 2);
    await lock.rollback();

    expect(statuses(await Promise.all(pending))).toEqual([201, 409]);
  });
});

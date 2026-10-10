import { expect, vi } from 'vitest';
import type { Db } from '../../src/db/client';
import { createBooking } from './factories';

const HOLD_TIMEOUT_MS = 15_000;
const WAIT_TIMEOUT_MS = 5_000;
const POLL_INTERVAL_MS = 20;

class Rollback extends Error {}

export async function holdSlot(db: Db, booking: Parameters<typeof createBooking>[1]) {
  let decide!: (commit: boolean) => void;
  const decision = new Promise<boolean>((resolve) => {
    decide = resolve;
  });
  let markLocked!: () => void;
  const locked = new Promise<void>((resolve) => {
    markLocked = resolve;
  });

  const finished = db
    .$transaction(
      async (tx) => {
        await createBooking(tx, booking);
        markLocked();
        if (!(await decision)) throw new Rollback();
      },
      { timeout: HOLD_TIMEOUT_MS },
    )
    .catch((error: unknown) => {
      if (!(error instanceof Rollback)) throw error;
    });

  await Promise.race([locked, finished]);
  return {
    commit: () => {
      decide(true);
      return finished;
    },
    rollback: () => {
      decide(false);
      return finished;
    },
  };
}

export async function waitForBlockedSlotInserts(db: Db, count: number) {
  await vi.waitFor(
    async () => {
      const [row] = await db.$queryRaw<{ blocked: bigint }[]>`
        SELECT COUNT(*) AS blocked FROM information_schema.PROCESSLIST
        WHERE DB = DATABASE() AND INFO LIKE 'INSERT INTO%booking_slots%'`;
      expect(Number(row?.blocked)).toBe(count);
    },
    { timeout: WAIT_TIMEOUT_MS, interval: POLL_INTERVAL_MS },
  );
}

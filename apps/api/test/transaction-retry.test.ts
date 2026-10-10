import { describe, expect, it, vi } from 'vitest';
import { TransactionRetry } from '../src/db/transaction-retry';
import { Prisma } from '../src/generated/prisma/client';

const prismaError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError(code, { code, clientVersion: 'test' });

const deadlock = () => prismaError('P2034');

const retry = new TransactionRetry({ maxAttempts: 3, minDelayMs: 0, maxDelayMs: 0 });

describe('TransactionRetry', () => {
  it('returns the first successful result without retrying', async () => {
    const work = vi.fn().mockResolvedValue('done');

    expect(await retry.run(work)).toBe('done');
    expect(work).toHaveBeenCalledTimes(1);
  });

  it('runs the work again after a transaction conflict', async () => {
    const work = vi.fn().mockRejectedValueOnce(deadlock()).mockResolvedValue('done');

    expect(await retry.run(work)).toBe('done');
    expect(work).toHaveBeenCalledTimes(2);
  });

  it('gives up after the last attempt and rethrows the conflict', async () => {
    const work = vi.fn().mockRejectedValue(deadlock());

    await expect(retry.run(work)).rejects.toMatchObject({ code: 'P2034' });
    expect(work).toHaveBeenCalledTimes(3);
  });

  it.each([
    ['a unique violation', prismaError('P2002')],
    ['an unrelated error', new Error('boom')],
  ])('does not retry %s', async (_label, error) => {
    const work = vi.fn().mockRejectedValue(error);

    await expect(retry.run(work)).rejects.toBe(error);
    expect(work).toHaveBeenCalledTimes(1);
  });
});

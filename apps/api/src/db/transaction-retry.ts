import { setTimeout as sleep } from 'node:timers/promises';
import { isTransactionConflict } from './errors';

export interface TransactionRetryOptions {
  maxAttempts: number;
  minDelayMs: number;
  maxDelayMs: number;
}

export const DEFAULT_TRANSACTION_RETRY: TransactionRetryOptions = {
  maxAttempts: 3,
  minDelayMs: 10,
  maxDelayMs: 50,
};

export class TransactionRetry {
  constructor(private readonly options: TransactionRetryOptions = DEFAULT_TRANSACTION_RETRY) {}

  async run<T>(work: () => Promise<T>): Promise<T> {
    for (let attempt = 1; ; attempt += 1) {
      try {
        return await work();
      } catch (error) {
        if (!isTransactionConflict(error) || attempt >= this.options.maxAttempts) throw error;
        await sleep(this.jitter());
      }
    }
  }

  private jitter(): number {
    const { minDelayMs, maxDelayMs } = this.options;
    return minDelayMs + Math.random() * (maxDelayMs - minDelayMs);
  }
}

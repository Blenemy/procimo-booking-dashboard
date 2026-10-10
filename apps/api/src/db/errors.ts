import { Prisma } from '../generated/prisma/client';

const UNIQUE_VIOLATION = 'P2002';
const TRANSACTION_CONFLICT = 'P2034';

const isKnownError = (
  error: unknown,
  code: string,
): error is Prisma.PrismaClientKnownRequestError =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;

export const isUniqueViolation = (error: unknown, model: Prisma.ModelName): boolean =>
  isKnownError(error, UNIQUE_VIOLATION) && error.meta?.modelName === model;

export const isTransactionConflict = (error: unknown): boolean =>
  isKnownError(error, TRANSACTION_CONFLICT);

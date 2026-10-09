import { ERROR_CODES } from '@courtly/shared';
import type { ApiErrorBody, ErrorCode } from '@courtly/shared';
import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const notFound = (message = 'Resource not found') =>
  new AppError(404, ERROR_CODES.NOT_FOUND, message);

const body = (code: ErrorCode, message: string, details?: unknown): ApiErrorBody => ({
  error: details === undefined ? { code, message } : { code, message, details },
});

const isBodyParserError = (err: unknown): err is { status: number; type: string } =>
  typeof err === 'object' && err !== null && 'type' in err && 'status' in err;

export const notFoundHandler: RequestHandler = (_req, _res, next) => {
  next(notFound('Route not found'));
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json(body(err.code, err.message, err.details));
    return;
  }
  if (err instanceof ZodError) {
    const details = err.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
    res.status(400).json(body(ERROR_CODES.VALIDATION_ERROR, 'Invalid request', details));
    return;
  }
  if (isBodyParserError(err) && err.status < 500) {
    res.status(err.status).json(body(ERROR_CODES.VALIDATION_ERROR, 'Malformed request body'));
    return;
  }
  req.log.error({ err }, 'Unhandled error');
  res.status(500).json(body(ERROR_CODES.INTERNAL_ERROR, 'Something went wrong'));
};

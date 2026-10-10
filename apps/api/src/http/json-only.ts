import { ERROR_CODES } from '@courtly/shared';
import type { RequestHandler } from 'express';
import { AppError } from './errors';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const JSON_MEDIA_TYPE = 'application/json';

export const requireJsonForMutations: RequestHandler = (req, _res, next) => {
  const [mediaType] = (req.headers['content-type'] ?? '').split(';');
  if (MUTATING_METHODS.has(req.method) && mediaType?.trim().toLowerCase() !== JSON_MEDIA_TYPE) {
    throw new AppError(
      ERROR_CODES.UNSUPPORTED_MEDIA_TYPE,
      `Content-Type must be ${JSON_MEDIA_TYPE}`,
    );
  }
  next();
};

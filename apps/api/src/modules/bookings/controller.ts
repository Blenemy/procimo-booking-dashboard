import { createBookingSchema } from '@courtly/shared';
import type { RequestHandler } from 'express';
import { HTTP_STATUS } from '../../http/status';
import { parse } from '../../http/validate';
import { authUser } from '../auth/middleware';
import type { BookingsService } from './service';

export function createBookingsController({ service }: { service: BookingsService }) {
  const create: RequestHandler = async (req, res) => {
    const input = parse(createBookingSchema, req.body);
    res.status(HTTP_STATUS.CREATED).json(await service.create(authUser(req).id, input));
  };

  return { create };
}

export type BookingsController = ReturnType<typeof createBookingsController>;

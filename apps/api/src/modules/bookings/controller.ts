import { createBookingSchema, idParamSchema, myBookingsQuerySchema } from '@courtly/shared';
import type { RequestHandler } from 'express';
import { HTTP_STATUS } from '../../http/status';
import { parse } from '../../http/validate';
import { authUser } from '../auth/middleware';
import type { BookingsService } from './service';

export function createBookingsController({ service }: { service: BookingsService }) {
  const listMine: RequestHandler = async (req, res) => {
    const { scope } = parse(myBookingsQuerySchema, req.query);
    res.json(await service.listMine(authUser(req).id, scope));
  };

  const create: RequestHandler = async (req, res) => {
    const input = parse(createBookingSchema, req.body);
    res.status(HTTP_STATUS.CREATED).json(await service.create(authUser(req).id, input));
  };

  const cancel: RequestHandler = async (req, res) => {
    const { id } = parse(idParamSchema, req.params);
    res.json(await service.cancel(authUser(req).id, id));
  };

  return { listMine, create, cancel };
}

export type BookingsController = ReturnType<typeof createBookingsController>;

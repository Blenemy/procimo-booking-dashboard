import {
  createCourtSchema,
  dateQuerySchema,
  idParamSchema,
  updateCourtSchema,
} from '@courtly/shared';
import type { RequestHandler } from 'express';
import { HTTP_STATUS } from '../../http/status';
import { parse } from '../../http/validate';
import { authUser } from '../auth/middleware';
import type { CourtsService } from './service';

export function createCourtsController({ service }: { service: CourtsService }) {
  const listActive: RequestHandler = async (_req, res) => {
    res.json(await service.listActive());
  };

  const availability: RequestHandler = async (req, res) => {
    const { id } = parse(idParamSchema, req.params);
    const { date } = parse(dateQuerySchema, req.query);
    res.json(await service.availability(id, date, authUser(req).id));
  };

  const listAll: RequestHandler = async (_req, res) => {
    res.json(await service.listAll());
  };

  const create: RequestHandler = async (req, res) => {
    const input = parse(createCourtSchema, req.body);
    res.status(HTTP_STATUS.CREATED).json(await service.create(input));
  };

  const update: RequestHandler = async (req, res) => {
    const { id } = parse(idParamSchema, req.params);
    const changes = parse(updateCourtSchema, req.body);
    res.json(await service.update(id, changes));
  };

  return { listActive, availability, listAll, create, update };
}

export type CourtsController = ReturnType<typeof createCourtsController>;

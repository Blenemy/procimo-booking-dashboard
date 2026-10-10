import type { AppConfigDto } from '@courtly/shared';
import type { RequestHandler } from 'express';
import type { Config } from '../../core/config';
import type { SystemRepository } from './repository';

export function createSystemController({
  config,
  repository,
}: {
  config: Config;
  repository: SystemRepository;
}) {
  const health: RequestHandler = async (_req, res) => {
    await repository.ping();
    res.json({ status: 'ok' });
  };

  const appConfig: RequestHandler = (_req, res) => {
    const body: AppConfigDto = { timezone: config.timezone, currency: config.currency };
    res.json(body);
  };

  return { health, appConfig };
}

export type SystemController = ReturnType<typeof createSystemController>;

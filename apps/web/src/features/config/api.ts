import type { AppConfigDto } from '@courtly/shared';
import { api } from '@/lib/api-client';

export const configApi = {
  get: () => api.get<AppConfigDto>('/config'),
};

import { queryOptions } from '@tanstack/react-query';
import { adminApi } from './api';

export const adminKeys = {
  all: ['admin'] as const,
  days: () => [...adminKeys.all, 'day'] as const,
  day: (date: string) => [...adminKeys.days(), date] as const,
};

export const adminQueries = {
  day: (date: string) =>
    queryOptions({ queryKey: adminKeys.day(date), queryFn: () => adminApi.day(date) }),
};

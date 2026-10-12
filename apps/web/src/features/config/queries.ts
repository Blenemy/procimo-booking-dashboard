import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { isoDateIn, todayIn } from '@/lib/dates';
import { formatMoney, formatTime, formatTimeRange } from '@/lib/format';
import { configApi } from './api';

export const configQueries = {
  app: () => queryOptions({ queryKey: ['config'], queryFn: configApi.get, staleTime: Infinity }),
};

export function useFacility() {
  const { data } = useSuspenseQuery(configQueries.app());
  const { timezone, currency } = data;

  return useMemo(
    () => ({
      timezone,
      currency,
      today: () => todayIn(timezone),
      dateOf: (instant: string) => isoDateIn(timezone, new Date(instant)),
      money: (cents: number) => formatMoney(cents, currency),
      time: (instant: string) => formatTime(instant, timezone),
      timeRange: (start: string, end: string) => formatTimeRange(start, end, timezone),
    }),
    [timezone, currency],
  );
}

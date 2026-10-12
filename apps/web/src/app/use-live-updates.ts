import { AVAILABILITY_CHANGED_EVENT } from '@courtly/shared';
import type { AvailabilityChangedEvent } from '@courtly/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { adminKeys } from '@/features/admin/queries';
import { courtKeys } from '@/features/courts/queries';

const EVENTS_URL = '/api/events';
const BASE_RECONNECT_DELAY_MS = 1_000;
const MAX_RECONNECT_DELAY_MS = 30_000;
const BACKOFF_FACTOR = 2;

const reconnectDelay = (attempt: number) =>
  Math.min(MAX_RECONNECT_DELAY_MS, BASE_RECONNECT_DELAY_MS * BACKOFF_FACTOR ** attempt);

const isAvailabilityChange = (value: unknown): value is AvailabilityChangedEvent =>
  typeof value === 'object' &&
  value !== null &&
  'courtId' in value &&
  typeof value.courtId === 'number' &&
  'date' in value &&
  typeof value.date === 'string';

export function useLiveUpdates() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let source: EventSource | undefined;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let failedAttempts = 0;
    let connectedBefore = false;

    const refreshEverythingLive = () => {
      void queryClient.invalidateQueries({ queryKey: courtKeys.availabilities() });
      void queryClient.invalidateQueries({ queryKey: adminKeys.days() });
    };

    const onAvailabilityChanged = (event: MessageEvent<string>) => {
      const change: unknown = JSON.parse(event.data);
      if (!isAvailabilityChange(change)) return;
      void queryClient.invalidateQueries({
        queryKey: courtKeys.availability(change.courtId, change.date),
      });
      void queryClient.invalidateQueries({ queryKey: adminKeys.day(change.date) });
    };

    const connect = () => {
      const current = new EventSource(EVENTS_URL);
      source = current;

      current.addEventListener('open', () => {
        failedAttempts = 0;
        if (connectedBefore) refreshEverythingLive();
        connectedBefore = true;
      });
      current.addEventListener(AVAILABILITY_CHANGED_EVENT, onAvailabilityChanged);
      current.addEventListener('error', () => {
        if (current.readyState !== EventSource.CLOSED) return;
        reconnectTimer = setTimeout(connect, reconnectDelay(failedAttempts));
        failedAttempts += 1;
      });
    };

    connect();
    return () => {
      clearTimeout(reconnectTimer);
      source?.close();
    };
  }, [queryClient]);
}

import { BOOKING_DURATIONS, MIN_BOOKING_HOURS } from '@courtly/shared';
import type { BookingDuration, SlotDto } from '@courtly/shared';

export interface SlotSelection {
  startsAt: string | null;
  duration: BookingDuration;
}

export interface ResolvedSelection {
  duration: BookingDuration;
  durations: readonly BookingDuration[];
  range: SlotDto[];
  lost: boolean;
}

export const EMPTY_SELECTION: SlotSelection = { startsAt: null, duration: MIN_BOOKING_HOURS };

const isFree = (slot: SlotDto) => slot.status === 'AVAILABLE';

export function bookableRange(slots: SlotDto[], startsAt: string, duration: number): SlotDto[] {
  const start = slots.findIndex((slot) => slot.startsAt === startsAt);
  if (start === -1) return [];

  const range = slots.slice(start, start + duration);
  const contiguous = range.every(
    (slot, index) => index === 0 || range[index - 1]?.endsAt === slot.startsAt,
  );
  return range.length === duration && contiguous && range.every(isFree) ? range : [];
}

export function resolveSelection(slots: SlotDto[], selection: SlotSelection): ResolvedSelection {
  const unselected = { duration: selection.duration, durations: BOOKING_DURATIONS, range: [] };
  if (selection.startsAt === null) return { ...unselected, lost: false };

  const { startsAt } = selection;
  const durations = BOOKING_DURATIONS.filter(
    (option) => bookableRange(slots, startsAt, option).length > 0,
  );
  const duration = durations.includes(selection.duration) ? selection.duration : durations[0];
  if (duration === undefined) return { ...unselected, lost: true };

  return { duration, durations, range: bookableRange(slots, startsAt, duration), lost: false };
}

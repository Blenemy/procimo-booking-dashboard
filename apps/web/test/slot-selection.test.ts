import type { SlotDto, SlotStatus } from '@courtly/shared';
import { describe, expect, it } from 'vitest';
import { resolveSelection } from '@/features/bookings/book/slot-selection';

const HOUR_MS = 60 * 60 * 1000;
const OPENING = Date.parse('2026-06-13T07:00:00.000Z');

const day = (...statuses: SlotStatus[]): SlotDto[] =>
  statuses.map((status, hour) => ({
    startsAt: new Date(OPENING + hour * HOUR_MS).toISOString(),
    endsAt: new Date(OPENING + (hour + 1) * HOUR_MS).toISOString(),
    localTime: '',
    status,
    mine: false,
  }));

const startOf = (slots: SlotDto[], hour: number) => slots[hour]?.startsAt ?? '';

describe('slot selection', () => {
  it('offers two hours only when the following slot is also free', () => {
    const slots = day('AVAILABLE', 'AVAILABLE', 'BOOKED');

    const free = resolveSelection(slots, { startsAt: startOf(slots, 0), duration: 2 });
    expect(free.durations).toEqual([1, 2]);
    expect(free.range.map((slot) => slot.startsAt)).toEqual([startOf(slots, 0), startOf(slots, 1)]);

    const blocked = resolveSelection(slots, { startsAt: startOf(slots, 1), duration: 2 });
    expect(blocked.durations).toEqual([1]);
    expect(blocked.duration).toBe(1);
    expect(blocked.range).toHaveLength(1);
  });

  it('never lets a two-hour booking run past closing time', () => {
    const slots = day('AVAILABLE', 'AVAILABLE');

    const lastSlot = resolveSelection(slots, { startsAt: startOf(slots, 1), duration: 2 });
    expect(lastSlot.durations).toEqual([1]);
    expect(lastSlot.duration).toBe(1);
  });

  it('drops the selection once another player books that slot', () => {
    const slots = day('BOOKED', 'AVAILABLE');

    const taken = resolveSelection(slots, { startsAt: startOf(slots, 0), duration: 1 });
    expect(taken.range).toEqual([]);
    expect(taken.lost).toBe(true);
  });
});

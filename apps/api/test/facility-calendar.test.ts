import { describe, expect, it } from 'vitest';
import { FacilityCalendar } from '../src/domain/facility-calendar';

const lisbon = new FacilityCalendar('Europe/Lisbon');
const iso = (dates: Date[]) => dates.map((d) => d.toISOString());

describe('FacilityCalendar', () => {
  describe('dayRange', () => {
    it('uses the local midnight in summer (UTC+1)', () => {
      const { start, end } = lisbon.dayRange('2026-07-15');

      expect(start.toISOString()).toBe('2026-07-14T23:00:00.000Z');
      expect(end.toISOString()).toBe('2026-07-15T23:00:00.000Z');
    });

    it('uses the local midnight in winter (UTC+0)', () => {
      const { start, end } = lisbon.dayRange('2026-12-15');

      expect(start.toISOString()).toBe('2026-12-15T00:00:00.000Z');
      expect(end.toISOString()).toBe('2026-12-16T00:00:00.000Z');
    });

    it('spans 25 hours on the autumn DST change', () => {
      const { start, end } = lisbon.dayRange('2026-10-25');

      expect((end.getTime() - start.getTime()) / 3_600_000).toBe(25);
    });
  });

  describe('openingSlots', () => {
    it('returns one slot per opening hour, the last one ending at close', () => {
      const slots = lisbon.openingSlots('2026-07-15', { openHour: 8, closeHour: 23 });

      expect(slots).toHaveLength(15);
      expect(slots[0]?.toISOString()).toBe('2026-07-15T07:00:00.000Z');
      expect(slots.at(-1)?.toISOString()).toBe('2026-07-15T21:00:00.000Z');
    });

    it('shifts UTC instants across the DST change but keeps local hours', () => {
      const before = lisbon.openingSlots('2026-10-24', { openHour: 8, closeHour: 9 });
      const after = lisbon.openingSlots('2026-10-25', { openHour: 8, closeHour: 9 });

      expect(iso(before)).toEqual(['2026-10-24T07:00:00.000Z']);
      expect(iso(after)).toEqual(['2026-10-25T08:00:00.000Z']);
    });

    it('includes both repeated 01:00 hours when clocks go back', () => {
      const slots = lisbon.openingSlots('2026-10-25', { openHour: 0, closeHour: 24 });

      expect(slots).toHaveLength(25);
      expect(slots.filter((s) => lisbon.localTime(s) === '01:00')).toHaveLength(2);
    });

    it('skips the missing 01:00 hour when clocks go forward', () => {
      const slots = lisbon.openingSlots('2027-03-28', { openHour: 0, closeHour: 24 });

      expect(slots).toHaveLength(23);
      expect(slots.map((s) => lisbon.localTime(s))).not.toContain('01:00');
    });

    it('supports courts open until midnight', () => {
      const slots = lisbon.openingSlots('2026-12-15', { openHour: 22, closeHour: 24 });

      expect(iso(slots)).toEqual(['2026-12-15T22:00:00.000Z', '2026-12-15T23:00:00.000Z']);
    });
  });

  describe('local date and time', () => {
    it('reports the facility date, not the UTC or process date', () => {
      const instant = new Date('2026-07-14T23:30:00.000Z');

      expect(lisbon.localDate(instant)).toBe('2026-07-15');
      expect(lisbon.localTime(instant)).toBe('00:30');
    });
  });

  describe('isHourAligned', () => {
    it.each([
      ['2026-07-15T09:00:00.000Z', true],
      ['2026-07-15T09:30:00.000Z', false],
      ['2026-07-15T09:00:01.000Z', false],
      ['2026-07-15T09:00:00.001Z', false],
    ])('%s -> %s', (instant, expected) => {
      expect(lisbon.isHourAligned(new Date(instant))).toBe(expected);
    });
  });
});

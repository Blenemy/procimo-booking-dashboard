import { DateTime } from './luxon';

export interface OpeningHours {
  openHour: number;
  closeHour: number;
}

const LOCAL_TIME_FORMAT = 'HH:mm';

export class FacilityCalendar {
  constructor(readonly timezone: string) {}

  dayRange(date: string): { start: Date; end: Date } {
    const start = this.startOfDay(date);
    return { start: start.toJSDate(), end: start.plus({ days: 1 }).toJSDate() };
  }

  openingSlots(date: string, { openHour, closeHour }: OpeningHours): Date[] {
    const dayStart = this.startOfDay(date);
    const dayEnd = dayStart.plus({ days: 1 });
    const slots: Date[] = [];
    for (let slot = dayStart; slot < dayEnd; slot = slot.plus({ hours: 1 })) {
      if (slot.hour >= openHour && slot.hour < closeHour) slots.push(slot.toJSDate());
    }
    return slots;
  }

  localDate(instant: Date): string {
    return this.inZone(instant).toISODate();
  }

  localTime(instant: Date): string {
    return this.inZone(instant).toFormat(LOCAL_TIME_FORMAT);
  }

  today(now: Date): string {
    return this.localDate(now);
  }

  isHourAligned(instant: Date): boolean {
    const local = this.inZone(instant);
    return local.minute === 0 && local.second === 0 && local.millisecond === 0;
  }

  private startOfDay(date: string): DateTime {
    return DateTime.fromISO(date, { zone: this.timezone }).startOf('day');
  }

  private inZone(instant: Date): DateTime {
    return DateTime.fromJSDate(instant, { zone: this.timezone });
  }
}

import { HOURS_PER_DAY } from '@courtly/shared';

const ISO_DATE_LENGTH = 10;
const DATE_PART_WIDTH = 2;
const MS_PER_SECOND = 1_000;
const SECONDS_PER_MINUTE = 60;
export const MINUTES_PER_HOUR = 60;
export const MS_PER_MINUTE = MS_PER_SECOND * SECONDS_PER_MINUTE;
export const MS_PER_HOUR = MS_PER_MINUTE * MINUTES_PER_HOUR;
export const MS_PER_DAY = MS_PER_HOUR * HOURS_PER_DAY;

export const isoDateToUtc = (isoDate: string) => new Date(`${isoDate}T00:00:00.000Z`);

export function addDays(isoDate: string, days: number): string {
  const date = isoDateToUtc(isoDate);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, ISO_DATE_LENGTH);
}

export const daysBetween = (from: string, to: string) =>
  Math.round((isoDateToUtc(to).getTime() - isoDateToUtc(from).getTime()) / MS_PER_DAY);

export function isoDateIn(timeZone: string, instant: Date): string {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((candidate) => candidate.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export const todayIn = (timeZone: string) => isoDateIn(timeZone, new Date());

export const hourIn = (timeZone: string, instant: Date) =>
  Number(
    new Intl.DateTimeFormat('en', { timeZone, hour: 'numeric', hourCycle: 'h23' }).format(instant),
  );

export function isoDateToLocal(isoDate: string): Date {
  const utc = isoDateToUtc(isoDate);
  return new Date(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate());
}

export function localToIsoDate(date: Date): string {
  const pad = (value: number) => String(value).padStart(DATE_PART_WIDTH, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

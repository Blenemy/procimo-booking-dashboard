import { MINUTES_PER_HOUR, MS_PER_DAY, MS_PER_MINUTE, isoDateToUtc } from './dates';

const LOCALE = 'en-GB';
const HOUR_WIDTH = 2;
const MAX_INITIALS = 2;
export const CENTS_PER_UNIT = 100;

const pluralRules = new Intl.PluralRules(LOCALE);

export const pluralize = (count: number, one: string, other: string) =>
  `${count} ${pluralRules.select(count) === 'one' ? one : other}`;

export const formatMoney = (cents: number, currency: string) =>
  new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency,
    trailingZeroDisplay: 'stripIfInteger',
  }).format(cents / CENTS_PER_UNIT);

export const formatHour = (hour: number) => `${String(hour).padStart(HOUR_WIDTH, '0')}:00`;

export const formatHourRange = (from: number, to: number) =>
  `${formatHour(from)} – ${formatHour(to)}`;

export const formatTime = (instant: string, timeZone: string) =>
  new Intl.DateTimeFormat(LOCALE, { timeZone, hour: '2-digit', minute: '2-digit' }).format(
    new Date(instant),
  );

export const formatTimeRange = (start: string, end: string, timeZone: string) =>
  `${formatTime(start, timeZone)} – ${formatTime(end, timeZone)}`;

const formatIsoDate = (isoDate: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(LOCALE, { timeZone: 'UTC', ...options }).format(isoDateToUtc(isoDate));

export const formatDay = (isoDate: string) =>
  formatIsoDate(isoDate, { weekday: 'long', day: 'numeric', month: 'long' });

export const formatShortDay = (isoDate: string) =>
  formatIsoDate(isoDate, { weekday: 'short', day: 'numeric', month: 'short' });

export const formatDayMonth = (isoDate: string) =>
  formatIsoDate(isoDate, { day: 'numeric', month: 'long' });

export const formatWeekday = (isoDate: string, weekday: 'long' | 'short' = 'long') =>
  formatIsoDate(isoDate, { weekday });

export const formatDayOfMonth = (isoDate: string) => formatIsoDate(isoDate, { day: 'numeric' });

export const formatHours = (hours: number) => pluralize(hours, 'hr', 'hrs');

export function formatCountdown(ms: number): string {
  if (ms >= MS_PER_DAY) return pluralize(Math.floor(ms / MS_PER_DAY), 'day', 'days');
  const totalMinutes = Math.max(1, Math.ceil(ms / MS_PER_MINUTE));
  const hours = Math.floor(totalMinutes / MINUTES_PER_HOUR);
  const minutes = totalMinutes % MINUTES_PER_HOUR;
  if (hours === 0) return `${minutes}m`;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

export const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, MAX_INITIALS)
    .toUpperCase();

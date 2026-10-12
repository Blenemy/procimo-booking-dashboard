import type { BookingDto } from '@courtly/shared';
import { formatCountdown } from '@/lib/format';

export type BookingPhase = 'cancelled' | 'completed' | 'inProgress' | 'cancellable' | 'locked';

const instant = (iso: string) => new Date(iso).getTime();

export function bookingPhase(booking: BookingDto, now: Date): BookingPhase {
  if (booking.status === 'CANCELLED') return 'cancelled';
  const time = now.getTime();
  if (instant(booking.endsAt) <= time) return 'completed';
  if (instant(booking.startsAt) <= time) return 'inProgress';
  return time <= instant(booking.cancellableUntil) ? 'cancellable' : 'locked';
}

const startsIn = (booking: BookingDto, now: Date) =>
  `Starts in ${formatCountdown(instant(booking.startsAt) - now.getTime())}`;

export const PHASE_VIEWS: Record<
  BookingPhase,
  { tone: string; label: (booking: BookingDto, now: Date) => string }
> = {
  cancelled: { tone: 'text-muted-foreground', label: () => 'Cancelled' },
  completed: { tone: 'text-muted-foreground', label: () => 'Completed' },
  inProgress: { tone: 'text-success', label: () => 'In progress' },
  cancellable: { tone: 'text-success', label: startsIn },
  locked: { tone: 'text-warning', label: startsIn },
};

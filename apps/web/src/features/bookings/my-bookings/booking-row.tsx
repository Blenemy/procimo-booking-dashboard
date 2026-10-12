import type { BookingDto } from '@courtly/shared';
import { cn } from 'cn';
import { CalendarIcon, ClockIcon, Grid3x3Icon } from 'lucide-react';
import { useFacility } from '@/features/config/queries';
import { SportBadge } from '@/features/courts/sport-badge';
import { daysBetween } from '@/lib/dates';
import { formatDayMonth, formatWeekday } from '@/lib/format';
import { PHASE_VIEWS, bookingPhase } from './booking-phase';
import { CancelBookingButton } from './cancel-booking-button';

const RELATIVE_DAYS: Partial<Record<number, string>> = {
  [-1]: 'Yesterday',
  0: 'Today',
  1: 'Tomorrow',
};

const dayLabel = (day: string, today: string) =>
  `${RELATIVE_DAYS[daysBetween(today, day)] ?? formatWeekday(day)}, ${formatDayMonth(day)}`;

interface BookingRowProps {
  booking: BookingDto;
  now: Date;
  today: string;
}

export function BookingRow({ booking, now, today }: BookingRowProps) {
  const facility = useFacility();
  const phase = bookingPhase(booking, now);
  const view = PHASE_VIEWS[phase];
  const day = dayLabel(facility.dateOf(booking.startsAt), today);
  const time = facility.timeRange(booking.startsAt, booking.endsAt);
  const canManage = phase === 'cancellable' || phase === 'locked';

  return (
    <article className="flex flex-wrap items-center gap-4 rounded-2xl border bg-card p-4 sm:flex-nowrap sm:px-5">
      <span
        className={cn(
          'flex size-12 shrink-0 items-center justify-center rounded-xl',
          phase === 'cancelled' ? 'bg-muted text-faint' : 'bg-success-soft text-success',
        )}
      >
        <Grid3x3Icon className="size-5" />
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-base font-semibold">{booking.court.name}</h3>
          <SportBadge sport={booking.court.sportType} />
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CalendarIcon className="size-3.5" />
            {day}
          </span>
          <span className="flex items-center gap-1.5">
            <ClockIcon className="size-3.5" />
            {time}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-0.5 text-right">
        <span
          className={cn(
            'text-lg font-bold',
            phase === 'cancelled' && 'text-muted-foreground line-through',
          )}
        >
          {facility.money(booking.totalPriceCents)}
        </span>
        <span className={cn('text-xs font-semibold', view.tone)}>{view.label(booking, now)}</span>
      </div>

      {canManage && (
        <CancelBookingButton
          booking={booking}
          when={`${day}, ${time}`}
          locked={phase === 'locked'}
        />
      )}
    </article>
  );
}

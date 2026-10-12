import type { AdminBookingDto } from '@courtly/shared';
import { cn } from 'cn';
import { CalendarX2Icon } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { UserAvatar } from '@/components/user-avatar';
import { useFacility } from '@/features/config/queries';
import { SportBadge } from '@/features/courts/sport-badge';
import { formatHours, formatWeekday, pluralize } from '@/lib/format';

interface DayScheduleProps {
  date: string;
  bookings: AdminBookingDto[];
}

function ScheduleRow({ booking }: { booking: AdminBookingDto }) {
  const facility = useFacility();
  const cancelled = booking.status === 'CANCELLED';

  return (
    <li
      className={cn(
        'grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-5 py-4 sm:grid-cols-[4.5rem_minmax(0,1fr)_minmax(0,1fr)_4rem_5rem]',
        cancelled && 'opacity-55',
      )}
    >
      <span className="text-base font-bold tabular-nums">{facility.time(booking.startsAt)}</span>
      <div className="grid gap-0.5">
        <span className="truncate text-sm font-semibold">{booking.court.name}</span>
        <SportBadge sport={booking.court.sportType} tone="text" />
      </div>
      <div className="col-span-2 col-start-2 row-start-2 flex min-w-0 items-center gap-2.5 sm:col-span-1 sm:col-start-auto sm:row-start-auto">
        <UserAvatar name={booking.user.name} size="sm" />
        <span className="truncate text-sm font-medium" title={booking.user.email}>
          {booking.user.name}
        </span>
      </div>
      <span className="hidden text-xs text-muted-foreground sm:block">
        {cancelled ? 'Cancelled' : formatHours(booking.durationHours)}
      </span>
      <span
        className={cn(
          'col-start-3 row-start-1 text-right text-sm font-bold tabular-nums sm:col-start-auto sm:row-start-auto',
          cancelled && 'line-through',
        )}
      >
        {facility.money(booking.totalPriceCents)}
      </span>
    </li>
  );
}

export function DaySchedule({ date, bookings }: DayScheduleProps) {
  const confirmed = bookings.filter((booking) => booking.status === 'CONFIRMED');
  const courtsInUse = new Set(confirmed.map((booking) => booking.court.id)).size;

  return (
    <section className="overflow-hidden rounded-2xl border bg-card">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4">
        <div className="grid gap-1">
          <h2 className="text-base font-semibold">{formatWeekday(date)}&apos;s schedule</h2>
          <p className="text-xs text-faint">
            {pluralize(confirmed.length, 'confirmed booking', 'confirmed bookings')} ·{' '}
            {pluralize(courtsInUse, 'court', 'courts')}
          </p>
        </div>
        <span className="flex items-center gap-1.5 rounded-md bg-success-soft px-2.5 py-1 text-[0.625rem] font-bold tracking-wider text-success uppercase">
          <span className="size-1.5 animate-pulse rounded-full bg-success" />
          Live schedule
        </span>
      </div>

      {bookings.length === 0 ? (
        <div className="p-5">
          <EmptyState
            icon={CalendarX2Icon}
            title="No bookings on this day"
            description="New bookings will appear here instantly."
          />
        </div>
      ) : (
        <ul className="divide-y">
          {bookings.map((booking) => (
            <ScheduleRow key={booking.id} booking={booking} />
          ))}
        </ul>
      )}
    </section>
  );
}

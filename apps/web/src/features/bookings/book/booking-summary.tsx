import type { BookingDuration, CourtDto } from '@courtly/shared';
import { cn } from 'cn';
import { ChevronRightIcon, ShieldCheckIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFacility } from '@/features/config/queries';
import { CourtArt } from '@/features/courts/court-art';
import { SPORTS } from '@/features/courts/sports';
import { errorMessage } from '@/lib/api-client';
import { formatShortDay } from '@/lib/format';
import { DurationToggle } from './duration-toggle';
import type { ResolvedSelection } from './slot-selection';

const LOST_SELECTION_MESSAGE = 'That time was just booked by someone else. Pick another slot.';

interface BookingSummaryProps {
  court: CourtDto;
  date: string;
  selection: ResolvedSelection;
  onDurationChange: (duration: BookingDuration) => void;
  onConfirm: () => void;
  isPending: boolean;
  error: Error | null;
}

export function BookingSummary({
  court,
  date,
  selection,
  onDurationChange,
  onConfirm,
  isPending,
  error,
}: BookingSummaryProps) {
  const facility = useFacility();
  const first = selection.range[0];
  const last = selection.range.at(-1);
  const time = first && last ? facility.timeRange(first.startsAt, last.endsAt) : null;
  const problem = error ? errorMessage(error) : selection.lost ? LOST_SELECTION_MESSAGE : null;

  const details = [
    { label: 'Date', value: formatShortDay(date), placeholder: false },
    { label: 'Time', value: time ?? 'Pick a start time', placeholder: time === null },
  ];

  return (
    <aside
      aria-label="Your booking"
      className="flex flex-col gap-5 rounded-2xl bg-panel p-6 text-panel-foreground lg:sticky lg:top-[calc(var(--header-height)+1.5rem)]"
    >
      <p className="text-xs font-bold tracking-[0.18em] text-lime uppercase">Your booking</p>

      <div className="flex items-center gap-3">
        <span className="size-12 shrink-0 overflow-hidden rounded-lg">
          <CourtArt sport={court.sportType} className="size-full" />
        </span>
        <div className="grid gap-0.5">
          <p className="text-base font-semibold">{court.name}</p>
          <p className="text-xs text-panel-muted">
            {SPORTS[court.sportType].label} · {facility.money(court.hourlyPriceCents)}/hr
          </p>
        </div>
      </div>

      <dl className="grid gap-3 border-y border-panel-border py-5 text-sm">
        {details.map((detail) => (
          <div key={detail.label} className="flex items-center justify-between gap-4">
            <dt className="text-panel-muted">{detail.label}</dt>
            <dd
              className={cn('font-semibold', detail.placeholder && 'font-normal text-panel-muted')}
            >
              {detail.value}
            </dd>
          </div>
        ))}
        <div className="flex flex-col gap-2 pt-2">
          <dt className="text-xs font-semibold">Duration</dt>
          <dd>
            <DurationToggle
              value={selection.duration}
              allowed={selection.durations}
              onChange={onDurationChange}
            />
          </dd>
        </div>
      </dl>

      <div className="flex items-end justify-between gap-4">
        <span className="text-sm text-panel-muted">Total</span>
        <span className="text-3xl font-bold tracking-tight">
          {facility.money(court.hourlyPriceCents * selection.duration)}
        </span>
      </div>

      <Button
        variant="highlight"
        className="h-12 rounded-xl text-sm font-bold"
        disabled={time === null || isPending}
        onClick={onConfirm}
      >
        {isPending ? 'Confirming…' : 'Confirm booking'}
        <ChevronRightIcon data-icon="inline-end" />
      </Button>

      {problem && (
        <p role="alert" className="text-center text-xs text-red-300">
          {problem}
        </p>
      )}

      <p className="flex items-center justify-center gap-1.5 text-[0.6875rem] text-panel-muted">
        <ShieldCheckIcon className="size-3.5" />
        Slot is checked again at confirmation
      </p>
    </aside>
  );
}

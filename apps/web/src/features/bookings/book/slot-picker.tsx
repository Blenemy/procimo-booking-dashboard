import type { CourtDto, SlotDto } from '@courtly/shared';
import { cn } from 'cn';
import { CalendarX2Icon } from 'lucide-react';
import { Notice } from '@/components/notice';
import { useFacility } from '@/features/config/queries';
import { formatHourRange } from '@/lib/format';
import { DayStrip } from './day-strip';

type SlotLook = 'available' | 'selected' | 'mine' | 'taken' | 'past';

const SLOT_LOOKS: Record<SlotLook, { className: string; description: string }> = {
  available: {
    className: 'border-border bg-card hover:border-foreground/40',
    description: 'available',
  },
  selected: {
    className: 'border-primary bg-primary text-primary-foreground',
    description: 'selected',
  },
  mine: {
    className: 'border-lime-soft-border bg-lime-soft/60 text-foreground/70',
    description: 'your booking',
  },
  taken: {
    className: 'border-transparent bg-muted/70 text-faint line-through',
    description: 'taken',
  },
  past: {
    className: 'border-transparent bg-muted/40 text-faint/70',
    description: 'no longer available',
  },
};

const LEGEND = [
  { label: 'Available', dot: 'bg-success' },
  { label: 'Taken', dot: 'bg-faint/60' },
  { label: 'Yours', dot: 'bg-lime' },
  { label: 'Selected', dot: 'bg-primary' },
];

const lookOf = (slot: SlotDto, selected: boolean): SlotLook => {
  if (selected) return 'selected';
  if (slot.status === 'AVAILABLE') return 'available';
  if (slot.mine) return 'mine';
  return slot.status === 'BOOKED' ? 'taken' : 'past';
};

interface SlotPickerProps {
  court: CourtDto;
  date: string;
  today: string;
  slots: SlotDto[];
  selected: SlotDto[];
  onSelect: (startsAt: string) => void;
  onDateChange: (date: string) => void;
}

export function SlotPicker({
  court,
  date,
  today,
  slots,
  selected,
  onSelect,
  onDateChange,
}: SlotPickerProps) {
  const facility = useFacility();
  const selectedStarts = new Set(selected.map((slot) => slot.startsAt));
  const hasAvailable = slots.some((slot) => slot.status === 'AVAILABLE');

  return (
    <section className="flex flex-col gap-5 rounded-2xl border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold tracking-tight">2. Pick a start time</h2>
          <p className="text-xs text-faint">
            {formatHourRange(court.openHour, court.closeHour)} · 1-hour slots
          </p>
        </div>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[0.6875rem] font-medium text-muted-foreground">
          {LEGEND.map((item) => (
            <li key={item.label} className="flex items-center gap-1.5">
              <span className={cn('size-1.5 rounded-full', item.dot)} />
              {item.label}
            </li>
          ))}
        </ul>
      </div>

      <div className="border-y py-3">
        <DayStrip value={date} today={today} onChange={onDateChange} />
      </div>

      {!hasAvailable && (
        <Notice tone="info" icon={CalendarX2Icon}>
          Nothing left to book on this day. Pick another date above.
        </Notice>
      )}

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-5">
        {slots.map((slot) => {
          const look = SLOT_LOOKS[lookOf(slot, selectedStarts.has(slot.startsAt))];
          return (
            <button
              key={slot.startsAt}
              type="button"
              disabled={slot.status !== 'AVAILABLE'}
              aria-pressed={selectedStarts.has(slot.startsAt)}
              aria-label={`${facility.time(slot.startsAt)}, ${look.description}`}
              onClick={() => onSelect(slot.startsAt)}
              className={cn(
                'h-11 rounded-xl border text-sm font-semibold tabular-nums transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed',
                look.className,
              )}
            >
              {slot.localTime}
            </button>
          );
        })}
      </div>

      <Notice tone="warning">
        Taken slots are disabled. For a 2-hour booking, both consecutive slots must be available.
      </Notice>
    </section>
  );
}

import { BOOKING_DURATIONS } from '@courtly/shared';
import type { BookingDuration } from '@courtly/shared';
import { cn } from 'cn';
import { pluralize } from '@/lib/format';

interface DurationToggleProps {
  value: BookingDuration;
  allowed: readonly BookingDuration[];
  onChange: (duration: BookingDuration) => void;
}

export function DurationToggle({ value, allowed, onChange }: DurationToggleProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Duration"
      className="grid grid-cols-2 gap-1 rounded-xl bg-panel-raised p-1"
    >
      {BOOKING_DURATIONS.map((duration) => {
        const checked = duration === value;
        return (
          <button
            key={duration}
            type="button"
            role="radio"
            aria-checked={checked}
            disabled={!allowed.includes(duration)}
            onClick={() => onChange(duration)}
            className={cn(
              'h-9 rounded-lg text-xs font-semibold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-lime/50 disabled:cursor-not-allowed disabled:opacity-35',
              checked
                ? 'bg-panel-foreground text-primary'
                : 'text-panel-foreground/70 hover:text-panel-foreground',
            )}
          >
            {pluralize(duration, 'hour', 'hours')}
          </button>
        );
      })}
    </div>
  );
}

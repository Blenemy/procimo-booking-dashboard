import type { CourtDto } from '@courtly/shared';
import { cn } from 'cn';
import { CheckIcon, ClockIcon } from 'lucide-react';
import { useFacility } from '@/features/config/queries';
import { CourtArt } from '@/features/courts/court-art';
import { SportBadge } from '@/features/courts/sport-badge';
import { formatHourRange } from '@/lib/format';

interface CourtPickerProps {
  courts: CourtDto[];
  selectedId: number;
  onSelect: (courtId: number) => void;
}

export function CourtPicker({ courts, selectedId, onSelect }: CourtPickerProps) {
  const facility = useFacility();

  return (
    <div role="radiogroup" aria-label="Court" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {courts.map((court) => {
        const selected = court.id === selectedId;
        return (
          <button
            key={court.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onSelect(court.id)}
            className={cn(
              'group overflow-hidden rounded-2xl border bg-card text-left transition-[border-color,box-shadow] outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
              selected
                ? 'border-primary shadow-[0_0_0_1px_var(--primary)]'
                : 'hover:border-foreground/25',
            )}
          >
            <div className="relative h-26">
              <CourtArt sport={court.sportType} className="size-full" />
              <span className="absolute top-3 left-3">
                <SportBadge sport={court.sportType} tone="overlay" />
              </span>
              {selected && (
                <span className="absolute top-3 right-3 flex size-6 items-center justify-center rounded-full bg-lime text-lime-foreground">
                  <CheckIcon className="size-3.5" strokeWidth="3" />
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1.5 p-4">
              <span className="text-[0.9375rem] font-semibold">{court.name}</span>
              <span className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <ClockIcon className="size-3.5" />
                  {formatHourRange(court.openHour, court.closeHour)}
                </span>
                <span>
                  <span className="text-sm font-bold text-foreground">
                    {facility.money(court.hourlyPriceCents)}
                  </span>
                  /hr
                </span>
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

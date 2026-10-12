import { cn } from 'cn';
import { addDays, daysBetween } from '@/lib/dates';
import { formatDay, formatDayOfMonth, formatWeekday } from '@/lib/format';

const VISIBLE_DAYS = 7;
const DAYS_BEFORE_SELECTED = 3;

const firstVisibleDay = (today: string, selected: string) =>
  daysBetween(today, selected) < VISIBLE_DAYS ? today : addDays(selected, -DAYS_BEFORE_SELECTED);

interface DayStripProps {
  value: string;
  today: string;
  onChange: (date: string) => void;
}

export function DayStrip({ value, today, onChange }: DayStripProps) {
  const first = firstVisibleDay(today, value);
  const days = Array.from({ length: VISIBLE_DAYS }, (_, offset) => addDays(first, offset));

  return (
    <div role="radiogroup" aria-label="Day" className="grid max-w-md grid-cols-7 gap-1">
      {days.map((day) => {
        const selected = day === value;
        return (
          <button
            key={day}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={formatDay(day)}
            onClick={() => onChange(day)}
            className={cn(
              'flex flex-col items-center gap-1 rounded-xl py-2.5 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
              selected
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <span className="text-[0.625rem] font-semibold tracking-wide uppercase">
              {formatWeekday(day, 'short')}
            </span>
            <span className="text-lg leading-none font-semibold">{formatDayOfMonth(day)}</span>
          </button>
        );
      })}
    </div>
  );
}

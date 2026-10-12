import { CalendarIcon, ChevronRightIcon } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { isoDateToLocal, localToIsoDate } from '@/lib/dates';
import { formatDay } from '@/lib/format';

const MONDAY = 1;

interface DatePickerButtonProps {
  value: string;
  onChange: (date: string) => void;
  min?: string;
}

export function DatePickerButton({ value, onChange, min }: DatePickerButtonProps) {
  const [open, setOpen] = useState(false);
  const selected = isoDateToLocal(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="h-11 gap-2.5 rounded-xl bg-card px-4 font-semibold shadow-xs"
          aria-label={`Change date, ${formatDay(value)}`}
        >
          <CalendarIcon />
          {formatDay(value)}
          <ChevronRightIcon className="text-muted-foreground transition-transform group-aria-expanded/button:rotate-90" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          weekStartsOn={MONDAY}
          disabled={min ? { before: isoDateToLocal(min) } : undefined}
          onSelect={(date) => {
            if (!date) return;
            onChange(localToIsoDate(date));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

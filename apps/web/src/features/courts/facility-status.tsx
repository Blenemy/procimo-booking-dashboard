import { useQuery } from '@tanstack/react-query';
import { cva } from 'class-variance-authority';
import { configQueries } from '@/features/config/queries';
import { useNow } from '@/hooks/use-now';
import { hourIn } from '@/lib/dates';
import { formatHour } from '@/lib/format';
import { courtQueries } from './queries';

const statusVariants = cva(
  'hidden items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold sm:inline-flex',
  {
    variants: {
      open: {
        true: 'bg-success-soft text-success',
        false: 'bg-muted text-muted-foreground',
      },
    },
  },
);

const dotVariants = cva('size-1.5 rounded-full', {
  variants: { open: { true: 'bg-success', false: 'bg-faint' } },
});

export function FacilityStatus() {
  const { data: config } = useQuery(configQueries.app());
  const { data: courts } = useQuery(courtQueries.active());
  const now = useNow();

  if (!config || !courts || courts.length === 0) return null;

  const opensAt = Math.min(...courts.map((court) => court.openHour));
  const closesAt = Math.max(...courts.map((court) => court.closeHour));
  const hour = hourIn(config.timezone, now);
  const open = hour >= opensAt && hour < closesAt;

  return (
    <span className={statusVariants({ open })}>
      <span className={dotVariants({ open })} />
      {open
        ? `Facility open until ${formatHour(closesAt)}`
        : `Closed · opens at ${formatHour(opensAt)}`}
    </span>
  );
}

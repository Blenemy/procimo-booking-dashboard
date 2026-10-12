import { isoDateSchema } from '@courtly/shared';
import type { AdminDayDto } from '@courtly/shared';
import { useSuspenseQuery } from '@tanstack/react-query';
import { ShieldCheckIcon } from 'lucide-react';
import { DatePickerButton } from '@/components/date-picker-button';
import { Page, PageHeader } from '@/components/page';
import { QueryBoundary } from '@/components/query-boundary';
import { StatGrid } from '@/components/stat-card';
import type { Stat } from '@/components/stat-card';
import { Skeleton } from '@/components/ui/skeleton';
import { useFacility } from '@/features/config/queries';
import { useSearchParam } from '@/hooks/use-search-param';
import { adminQueries } from '../queries';
import { DaySchedule } from './day-schedule';

const DATE_PARAM = 'date';

const validDate = (raw: string | null, fallback: string) =>
  raw !== null && isoDateSchema.safeParse(raw).success ? raw : fallback;

const bookingsOf = (day: AdminDayDto) =>
  day.courts
    .flatMap((court) => court.bookings)
    .sort(
      (a, b) => a.startsAt.localeCompare(b.startsAt) || a.court.name.localeCompare(b.court.name),
    );

function DayOverview({ date, today }: { date: string; today: string }) {
  const facility = useFacility();
  const { data: day } = useSuspenseQuery(adminQueries.day(date));
  const bookings = bookingsOf(day);
  const confirmed = bookings.filter((booking) => booking.status === 'CONFIRMED');
  const bookedHours = confirmed.reduce((sum, booking) => sum + booking.durationHours, 0);

  const stats: Stat[] = [
    { label: date === today ? 'Bookings today' : 'Bookings', value: String(confirmed.length) },
    { label: 'Booked hours', value: `${bookedHours}h` },
    {
      label: date < today ? 'Revenue' : 'Expected revenue',
      value: facility.money(day.totalRevenueCents),
      tone: 'inverse',
    },
  ];

  return (
    <>
      <StatGrid stats={stats} />
      <DaySchedule date={date} bookings={bookings} />
    </>
  );
}

function DaySkeleton() {
  return (
    <>
      <Skeleton className="h-24 rounded-2xl bg-foreground/5" />
      <Skeleton className="h-96 rounded-2xl bg-foreground/5" />
    </>
  );
}

export function DailyBookingsPage() {
  const facility = useFacility();
  const today = facility.today();
  const [date, setDate] = useSearchParam(DATE_PARAM, (raw) => validDate(raw, today));

  return (
    <Page>
      <PageHeader
        eyebrow="Admin"
        eyebrowIcon={ShieldCheckIcon}
        title="Daily bookings"
        description="All reservations across every court for the selected day."
        actions={<DatePickerButton value={date} onChange={setDate} />}
      />
      <QueryBoundary fallback={<DaySkeleton />}>
        <DayOverview date={date} today={today} />
      </QueryBoundary>
    </Page>
  );
}

import { isoDateSchema } from '@courtly/shared';
import type { CourtDto } from '@courtly/shared';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Grid3x3Icon } from 'lucide-react';
import { useState } from 'react';
import { DatePickerButton } from '@/components/date-picker-button';
import { EmptyState } from '@/components/empty-state';
import { Page, PageHeader, SectionHeading } from '@/components/page';
import { QueryBoundary } from '@/components/query-boundary';
import { Skeleton } from '@/components/ui/skeleton';
import { useFacility } from '@/features/config/queries';
import { courtQueries } from '@/features/courts/queries';
import { useSearchParam } from '@/hooks/use-search-param';
import { pluralize } from '@/lib/format';
import { useCreateBooking } from '../queries';
import { BookingSummary } from './booking-summary';
import { CourtPicker } from './court-picker';
import { SlotPicker } from './slot-picker';
import { EMPTY_SELECTION, resolveSelection } from './slot-selection';
import type { SlotSelection } from './slot-selection';

const DATE_PARAM = 'date';
const COURT_PARAM = 'court';
const SKELETON_COURTS = 3;
const BOOKING_GRID = 'grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]';

const bookableDate = (raw: string | null, today: string) =>
  raw !== null && isoDateSchema.safeParse(raw).success && raw >= today ? raw : today;

interface DayProps {
  date: string;
  today: string;
  onDateChange: (date: string) => void;
}

function SlotsSkeleton() {
  return (
    <div className={BOOKING_GRID}>
      <Skeleton className="h-96 rounded-2xl bg-foreground/5" />
      <Skeleton className="h-96 rounded-2xl bg-foreground/10" />
    </div>
  );
}

function BookingSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: SKELETON_COURTS }, (_, index) => (
          <Skeleton key={index} className="h-44 rounded-2xl bg-foreground/5" />
        ))}
      </div>
      <SlotsSkeleton />
    </div>
  );
}

function SlotBooking({ court, date, today, onDateChange }: DayProps & { court: CourtDto }) {
  const { data: availability } = useSuspenseQuery(courtQueries.availability(court.id, date));
  const [selection, setSelection] = useState<SlotSelection>(EMPTY_SELECTION);
  const createBooking = useCreateBooking();
  const resolved = resolveSelection(availability.slots, selection);

  const updateSelection = (change: Partial<SlotSelection>) => {
    createBooking.reset();
    setSelection((current) => ({ ...current, ...change }));
  };

  const confirm = () => {
    const [first] = resolved.range;
    if (!first) return;
    createBooking.mutate(
      { courtId: court.id, startsAt: first.startsAt, durationHours: resolved.duration },
      { onSuccess: () => setSelection((current) => ({ ...current, startsAt: null })) },
    );
  };

  return (
    <div className={BOOKING_GRID}>
      <SlotPicker
        court={court}
        date={date}
        today={today}
        slots={availability.slots}
        selected={resolved.range}
        onSelect={(startsAt) => updateSelection({ startsAt })}
        onDateChange={onDateChange}
      />
      <BookingSummary
        court={court}
        date={date}
        selection={resolved}
        onDurationChange={(duration) => updateSelection({ duration })}
        onConfirm={confirm}
        isPending={createBooking.isPending}
        error={createBooking.error}
      />
    </div>
  );
}

function CourtBooking({ date, today, onDateChange }: DayProps) {
  const { data: courts } = useSuspenseQuery(courtQueries.active());
  const [courtId, setCourtId] = useSearchParam(COURT_PARAM, (raw) => Number(raw));
  const court = courts.find((candidate) => candidate.id === courtId) ?? courts[0];

  if (!court) {
    return (
      <EmptyState
        icon={Grid3x3Icon}
        title="No courts are open for booking"
        description="Please check back later."
      />
    );
  }

  return (
    <>
      <section className="flex flex-col gap-4">
        <SectionHeading
          title="1. Choose your court"
          meta={`${pluralize(courts.length, 'court', 'courts')} available`}
        />
        <CourtPicker courts={courts} selectedId={court.id} onSelect={setCourtId} />
      </section>
      <QueryBoundary fallback={<SlotsSkeleton />}>
        <SlotBooking
          key={`${court.id}:${date}`}
          court={court}
          date={date}
          today={today}
          onDateChange={onDateChange}
        />
      </QueryBoundary>
    </>
  );
}

export function BookCourtPage() {
  const facility = useFacility();
  const today = facility.today();
  const [date, setDate] = useSearchParam(DATE_PARAM, (raw) => bookableDate(raw, today));

  return (
    <Page width="wide">
      <PageHeader
        eyebrow="Book a court"
        title="Ready for your next match?"
        documentTitle="Book a court"
        description="Choose a court, date, and an available start time."
        actions={<DatePickerButton value={date} min={today} onChange={setDate} />}
      />
      <QueryBoundary fallback={<BookingSkeleton />}>
        <CourtBooking date={date} today={today} onDateChange={setDate} />
      </QueryBoundary>
    </Page>
  );
}

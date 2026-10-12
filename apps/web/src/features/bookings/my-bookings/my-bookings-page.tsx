import type { BookingScope } from '@courtly/shared';
import { useSuspenseQueries } from '@tanstack/react-query';
import { CalendarCheckIcon, HistoryIcon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router';
import { EmptyState } from '@/components/empty-state';
import { Page, PageHeader } from '@/components/page';
import { QueryBoundary } from '@/components/query-boundary';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFacility } from '@/features/config/queries';
import { useNow } from '@/hooks/use-now';
import { useSearchParam } from '@/hooks/use-search-param';
import { PATHS } from '@/paths';
import { bookingQueries } from '../queries';
import { BookingRow } from './booking-row';

const TAB_PARAM = 'tab';
const SKELETON_ROWS = 2;

interface BookingTab {
  scope: BookingScope;
  label: string;
  empty: { icon: LucideIcon; title: string; description: string; cta?: boolean };
}

const TABS: BookingTab[] = [
  {
    scope: 'upcoming',
    label: 'Upcoming',
    empty: {
      icon: CalendarCheckIcon,
      title: 'No upcoming bookings',
      description: 'Find a free court and book your next match.',
      cta: true,
    },
  },
  {
    scope: 'past',
    label: 'Past',
    empty: {
      icon: HistoryIcon,
      title: 'No past bookings yet',
      description: 'Completed and cancelled bookings will show up here.',
    },
  },
];

const scopeOf = (raw: string | null): BookingScope =>
  TABS.find((tab) => tab.scope === raw)?.scope ?? 'upcoming';

function BookingTabs() {
  const facility = useFacility();
  const now = useNow();
  const today = facility.today();
  const [scope, setScope] = useSearchParam(TAB_PARAM, scopeOf);
  const results = useSuspenseQueries({
    queries: TABS.map((tab) => bookingQueries.mine(tab.scope)),
  });
  const tabs = TABS.map((tab, index) => ({ ...tab, bookings: results[index]?.data ?? [] }));

  return (
    <Tabs value={scope} onValueChange={setScope} className="gap-4">
      <TabsList
        variant="line"
        className="h-auto w-full justify-start gap-6 rounded-none border-b p-0"
      >
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.scope}
            value={tab.scope}
            className="flex-none px-1 pb-3 text-sm font-semibold group-data-horizontal/tabs:after:bottom-[-1px]"
          >
            {tab.label}
            <span className="rounded-full bg-muted px-1.5 text-[0.625rem] leading-4 font-bold text-muted-foreground">
              {tab.bookings.length}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent key={tab.scope} value={tab.scope} className="flex flex-col gap-3">
          {tab.bookings.length === 0 ? (
            <EmptyState
              icon={tab.empty.icon}
              title={tab.empty.title}
              description={tab.empty.description}
              action={
                tab.empty.cta && (
                  <Button asChild>
                    <Link to={PATHS.book}>Book a court</Link>
                  </Button>
                )
              }
            />
          ) : (
            tab.bookings.map((booking) => (
              <BookingRow key={booking.id} booking={booking} now={now} today={today} />
            ))
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}

function BookingsSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-10 w-48 bg-foreground/5" />
      {Array.from({ length: SKELETON_ROWS }, (_, index) => (
        <Skeleton key={index} className="h-20 rounded-2xl bg-foreground/5" />
      ))}
    </div>
  );
}

export function MyBookingsPage() {
  return (
    <Page>
      <PageHeader
        eyebrow="My account"
        title="My bookings"
        description="Manage upcoming matches and review your court history."
      />
      <QueryBoundary fallback={<BookingsSkeleton />}>
        <BookingTabs />
      </QueryBoundary>
    </Page>
  );
}

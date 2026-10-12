import type { CourtDto } from '@courtly/shared';
import { useSuspenseQuery } from '@tanstack/react-query';
import { HistoryIcon, PlusIcon, ShieldCheckIcon } from 'lucide-react';
import { useState } from 'react';
import { Notice } from '@/components/notice';
import { Page, PageHeader } from '@/components/page';
import { QueryBoundary } from '@/components/query-boundary';
import { StatGrid } from '@/components/stat-card';
import type { Stat } from '@/components/stat-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { courtQueries } from '@/features/courts/queries';
import { CourtFormDialog } from './court-form-dialog';
import { CourtsTable } from './courts-table';

type Editing = { mode: 'closed' } | { mode: 'create' } | { mode: 'edit'; court: CourtDto };

const courtStats = (courts: CourtDto[]): Stat[] => {
  const active = courts.filter((court) => court.isActive).length;
  return [
    { label: 'Total courts', value: String(courts.length) },
    { label: 'Active', value: String(active), tone: 'highlight' },
    { label: 'Inactive', value: String(courts.length - active) },
  ];
};

function CourtsOverview({ onEdit }: { onEdit: (court: CourtDto) => void }) {
  const { data: courts } = useSuspenseQuery(courtQueries.all());

  return (
    <>
      <StatGrid stats={courtStats(courts)} />
      <CourtsTable courts={courts} onEdit={onEdit} />
    </>
  );
}

function CourtsSkeleton() {
  return (
    <>
      <Skeleton className="h-24 rounded-2xl bg-foreground/5" />
      <Skeleton className="h-80 rounded-2xl bg-foreground/5" />
    </>
  );
}

export function ManageCourtsPage() {
  const [editing, setEditing] = useState<Editing>({ mode: 'closed' });
  const close = () => setEditing({ mode: 'closed' });

  return (
    <Page>
      <PageHeader
        eyebrow="Admin"
        eyebrowIcon={ShieldCheckIcon}
        title="Manage courts"
        description="Create, edit, and control which courts can receive bookings."
        actions={
          <Button
            className="h-11 rounded-xl px-5 font-semibold"
            onClick={() => setEditing({ mode: 'create' })}
          >
            <PlusIcon data-icon="inline-start" />
            Add court
          </Button>
        }
      />
      <QueryBoundary fallback={<CourtsSkeleton />}>
        <CourtsOverview onEdit={(court) => setEditing({ mode: 'edit', court })} />
      </QueryBoundary>
      <Notice tone="info" icon={HistoryIcon}>
        Deactivating a court prevents new bookings but keeps its full booking history.
      </Notice>
      <CourtFormDialog
        court={editing.mode === 'edit' ? editing.court : null}
        open={editing.mode !== 'closed'}
        onOpenChange={(open) => !open && close()}
      />
    </Page>
  );
}

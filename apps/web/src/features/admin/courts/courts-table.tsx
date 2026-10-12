import type { CourtDto } from '@courtly/shared';
import { cn } from 'cn';
import { SearchIcon, SearchXIcon } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { EmptyState } from '@/components/empty-state';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useFacility } from '@/features/config/queries';
import { CourtArt } from '@/features/courts/court-art';
import { SPORTS } from '@/features/courts/sports';
import { formatHourRange } from '@/lib/format';
import { CourtActions } from './court-actions';

const COURT_NUMBER_WIDTH = 2;

const STATUS_BADGES = {
  active: { label: 'Active', className: 'bg-success-soft text-success' },
  inactive: { label: 'Inactive', className: 'bg-muted text-muted-foreground' },
} as const;

interface Column {
  id: string;
  header: string;
  className?: string;
  cell: (court: CourtDto) => ReactNode;
}

function CourtCell({ court }: { court: CourtDto }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          'size-10 shrink-0 overflow-hidden rounded-lg',
          !court.isActive && 'grayscale',
        )}
      >
        <CourtArt sport={court.sportType} className="size-full" />
      </span>
      <div className="grid">
        <span className="font-semibold">{court.name}</span>
        <span className="text-xs text-faint">
          Court #{String(court.id).padStart(COURT_NUMBER_WIDTH, '0')}
        </span>
      </div>
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  const badge = STATUS_BADGES[active ? 'active' : 'inactive'];
  return (
    <span className={cn('rounded-full px-2 py-1 text-[0.6875rem] font-semibold', badge.className)}>
      {badge.label}
    </span>
  );
}

interface CourtsTableProps {
  courts: CourtDto[];
  onEdit: (court: CourtDto) => void;
}

export function CourtsTable({ courts, onEdit }: CourtsTableProps) {
  const facility = useFacility();
  const [search, setSearch] = useState('');
  const needle = search.trim().toLowerCase();
  const visible = courts.filter((court) =>
    `${court.name} ${SPORTS[court.sportType].label}`.toLowerCase().includes(needle),
  );

  const columns: Column[] = [
    { id: 'court', header: 'Court', cell: (court) => <CourtCell court={court} /> },
    { id: 'sport', header: 'Sport', cell: (court) => SPORTS[court.sportType].label },
    {
      id: 'hours',
      header: 'Opening hours',
      cell: (court) => formatHourRange(court.openHour, court.closeHour),
    },
    {
      id: 'price',
      header: 'Hourly price',
      className: 'font-semibold text-foreground',
      cell: (court) => facility.money(court.hourlyPriceCents),
    },
    { id: 'status', header: 'Status', cell: (court) => <StatusBadge active={court.isActive} /> },
    {
      id: 'actions',
      header: 'Actions',
      className: 'text-right',
      cell: (court) => <CourtActions court={court} onEdit={onEdit} />,
    },
  ];

  return (
    <section className="overflow-hidden rounded-2xl border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <h2 className="text-base font-semibold">All courts</h2>
        <label className="relative w-full sm:w-56">
          <span className="sr-only">Search courts</span>
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-faint" />
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search courts"
            className="h-9 rounded-lg pl-8 text-xs"
          />
        </label>
      </div>

      {visible.length === 0 ? (
        <div className="px-5 pb-5">
          <EmptyState
            icon={SearchXIcon}
            title="No courts match your search"
            description="Try another name or sport."
          />
        </div>
      ) : (
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent">
              {columns.map((column) => (
                <TableHead
                  key={column.id}
                  className={cn(
                    'h-10 px-5 text-[0.6875rem] font-semibold tracking-wider text-faint uppercase',
                    column.id === 'actions' && 'text-right',
                  )}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((court) => (
              <TableRow key={court.id} className={cn(!court.isActive && 'bg-muted/30')}>
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    className={cn('px-5 py-3.5 text-muted-foreground', column.className)}
                  >
                    {column.cell(court)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}

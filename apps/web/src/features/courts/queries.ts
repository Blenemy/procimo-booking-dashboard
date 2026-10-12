import type { UpdateCourtRequest, UpdateCourtResultDto } from '@courtly/shared';
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminKeys } from '@/features/admin/queries';
import { pluralize } from '@/lib/format';
import { courtsApi } from './api';

export const courtKeys = {
  all: ['courts'] as const,
  lists: () => [...courtKeys.all, 'list'] as const,
  list: (scope: 'active' | 'all') => [...courtKeys.lists(), scope] as const,
  availabilities: () => [...courtKeys.all, 'availability'] as const,
  availability: (courtId: number, date: string) =>
    [...courtKeys.availabilities(), courtId, date] as const,
};

export const courtQueries = {
  active: () => queryOptions({ queryKey: courtKeys.list('active'), queryFn: courtsApi.listActive }),
  all: () => queryOptions({ queryKey: courtKeys.list('all'), queryFn: courtsApi.listAll }),
  availability: (courtId: number, date: string) =>
    queryOptions({
      queryKey: courtKeys.availability(courtId, date),
      queryFn: () => courtsApi.availability(courtId, date),
    }),
};

function useInvalidateCourts() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: courtKeys.all }),
      queryClient.invalidateQueries({ queryKey: adminKeys.days() }),
    ]);
}

const announceKeptBookings = ({ warnings }: UpdateCourtResultDto) => {
  const kept = warnings.affectedFutureBookings;
  if (kept === 0) return;
  toast.warning(`${pluralize(kept, 'upcoming booking', 'upcoming bookings')} kept`, {
    description: 'Existing bookings stay valid. Only new bookings follow the change.',
  });
};

export function useCreateCourt() {
  const invalidate = useInvalidateCourts();
  return useMutation({
    mutationFn: courtsApi.create,
    meta: { successMessage: 'Court created', errorDisplay: 'inline' },
    onSuccess: invalidate,
  });
}

export function useUpdateCourt() {
  const invalidate = useInvalidateCourts();
  return useMutation({
    mutationFn: ({ courtId, changes }: { courtId: number; changes: UpdateCourtRequest }) =>
      courtsApi.update(courtId, changes),
    meta: { successMessage: 'Court updated', errorDisplay: 'inline' },
    onSuccess: (result) => {
      announceKeptBookings(result);
      return invalidate();
    },
  });
}

export function useSetCourtActive() {
  const invalidate = useInvalidateCourts();
  return useMutation({
    mutationFn: ({ courtId, isActive }: { courtId: number; isActive: boolean }) =>
      courtsApi.update(courtId, { isActive }),
    onSuccess: (result) => {
      toast.success(result.court.isActive ? 'Court activated' : 'Court deactivated');
      announceKeptBookings(result);
      return invalidate();
    },
  });
}

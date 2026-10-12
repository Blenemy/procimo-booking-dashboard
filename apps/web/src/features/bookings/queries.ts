import type { BookingScope } from '@courtly/shared';
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { courtKeys } from '@/features/courts/queries';
import { bookingsApi } from './api';

export const bookingKeys = {
  all: ['bookings'] as const,
  mine: (scope: BookingScope) => [...bookingKeys.all, 'mine', scope] as const,
};

export const bookingQueries = {
  mine: (scope: BookingScope) =>
    queryOptions({ queryKey: bookingKeys.mine(scope), queryFn: () => bookingsApi.mine(scope) }),
};

function useInvalidateBookings() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: bookingKeys.all }),
      queryClient.invalidateQueries({ queryKey: courtKeys.availabilities() }),
    ]);
}

export function useCreateBooking() {
  const invalidate = useInvalidateBookings();
  return useMutation({
    mutationFn: bookingsApi.create,
    meta: { successMessage: 'Booking confirmed', errorDisplay: 'inline' },
    onSettled: invalidate,
  });
}

export function useCancelBooking() {
  const invalidate = useInvalidateBookings();
  return useMutation({
    mutationFn: bookingsApi.cancel,
    meta: { successMessage: 'Booking cancelled' },
    onSettled: invalidate,
  });
}

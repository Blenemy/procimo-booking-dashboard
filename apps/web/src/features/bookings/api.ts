import type { BookingDto, BookingScope, CreateBookingRequest } from '@courtly/shared';
import { api } from '@/lib/api-client';

export const bookingsApi = {
  mine: (scope: BookingScope) =>
    api.get<BookingDto[]>(`/bookings/me?${new URLSearchParams({ scope })}`),
  create: (booking: CreateBookingRequest) => api.post<BookingDto>('/bookings', booking),
  cancel: (bookingId: number) => api.post<BookingDto>(`/bookings/${bookingId}/cancel`),
};

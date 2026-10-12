import type { AdminDayDto } from '@courtly/shared';
import { api } from '@/lib/api-client';

export const adminApi = {
  day: (date: string) => api.get<AdminDayDto>(`/admin/bookings?${new URLSearchParams({ date })}`),
};

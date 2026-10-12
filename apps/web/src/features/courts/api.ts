import type {
  AvailabilityDto,
  CourtDto,
  CreateCourtRequest,
  UpdateCourtRequest,
  UpdateCourtResultDto,
} from '@courtly/shared';
import { api } from '@/lib/api-client';

export const courtsApi = {
  listActive: () => api.get<CourtDto[]>('/courts'),
  availability: (courtId: number, date: string) =>
    api.get<AvailabilityDto>(`/courts/${courtId}/availability?${new URLSearchParams({ date })}`),
  listAll: () => api.get<CourtDto[]>('/admin/courts'),
  create: (court: CreateCourtRequest) => api.post<CourtDto>('/admin/courts', court),
  update: (courtId: number, changes: UpdateCourtRequest) =>
    api.patch<UpdateCourtResultDto>(`/admin/courts/${courtId}`, changes),
};

import type { LoginRequest, UserDto } from '@courtly/shared';
import { api } from '@/lib/api-client';

export const authApi = {
  me: () => api.get<UserDto>('/auth/me'),
  login: (credentials: LoginRequest) => api.post<UserDto>('/auth/login', credentials),
  logout: () => api.post<void>('/auth/logout'),
};

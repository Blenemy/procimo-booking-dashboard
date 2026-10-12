import { ERROR_CODES } from '@courtly/shared';
import type { UserDto } from '@courtly/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/api-client';
import { authApi } from './api';

export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
};

const fetchSessionUser = async (): Promise<UserDto | null> => {
  try {
    return await authApi.me();
  } catch (error) {
    if (error instanceof ApiError && error.code === ERROR_CODES.UNAUTHENTICATED) return null;
    throw error;
  }
};

export const useMe = () =>
  useQuery({ queryKey: authKeys.me(), queryFn: fetchSessionUser, staleTime: Infinity });

export function useSessionUser(): UserDto {
  const { data } = useMe();
  if (!data) throw new Error('useSessionUser must be used inside RequireSession');
  return data;
}

export function setSessionUser(queryClient: QueryClient, user: UserDto | null) {
  queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== authKeys.all[0] });
  queryClient.setQueryData(authKeys.me(), user);
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (user) => setSessionUser(queryClient, user),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => setSessionUser(queryClient, null),
  });
}

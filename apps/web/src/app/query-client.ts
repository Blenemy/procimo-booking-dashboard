import { ERROR_CODES } from '@courtly/shared';
import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { authKeys, setSessionUser } from '@/features/auth/queries';
import { ApiError, errorMessage } from '@/lib/api-client';

const NETWORK_RETRY_LIMIT = 2;
const SESSION_EXPIRED_MESSAGE = 'Your session has expired. Please sign in again.';

const isSessionExpired = (error: unknown) =>
  error instanceof ApiError && error.code === ERROR_CODES.UNAUTHENTICATED;

export function createQueryClient() {
  const queryClient: QueryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        if (isSessionExpired(error)) {
          endSession();
          return;
        }
        if (query.state.data !== undefined) toast.error(errorMessage(error));
      },
    }),
    mutationCache: new MutationCache({
      onSuccess: (_data, _variables, _context, mutation) => {
        const message = mutation.meta?.successMessage;
        if (message) toast.success(message);
      },
      onError: (error, _variables, _context, mutation) => {
        if (isSessionExpired(error)) {
          endSession();
          return;
        }
        if (mutation.meta?.errorDisplay !== 'inline') toast.error(errorMessage(error));
      },
    }),
    defaultOptions: {
      queries: {
        retry: (failureCount, error) =>
          !(error instanceof ApiError) && failureCount < NETWORK_RETRY_LIMIT,
      },
    },
  });

  function endSession() {
    const wasSignedIn = Boolean(queryClient.getQueryData(authKeys.me()));
    setSessionUser(queryClient, null);
    if (wasSignedIn) toast.info(SESSION_EXPIRED_MESSAGE);
  }

  return queryClient;
}

import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { Suspense } from 'react';
import type { ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import type { FallbackProps } from 'react-error-boundary';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { errorMessage } from '@/lib/api-client';
import { PageLoader } from './page-loader';

function QueryErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <Alert variant="destructive" className="flex items-center justify-between gap-4">
      <AlertDescription>{errorMessage(error)}</AlertDescription>
      <Button variant="outline" size="sm" onClick={resetErrorBoundary}>
        Try again
      </Button>
    </Alert>
  );
}

interface QueryBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  resetKeys?: unknown[];
}

export function QueryBoundary({
  children,
  fallback = <PageLoader />,
  resetKeys,
}: QueryBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary onReset={reset} resetKeys={resetKeys} FallbackComponent={QueryErrorFallback}>
          <Suspense fallback={fallback}>{children}</Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}

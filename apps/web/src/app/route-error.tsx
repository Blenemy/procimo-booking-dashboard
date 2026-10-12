import { Button } from '@/components/ui/button';

export function RouteError() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-4 text-center">
      <p className="text-lg font-medium">Something went wrong</p>
      <Button onClick={() => window.location.assign('/')}>Back to start</Button>
    </div>
  );
}

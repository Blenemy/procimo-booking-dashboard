import { useEffect, useState } from 'react';

const DEFAULT_TICK_MS = 15_000;

export function useNow(tickMs = DEFAULT_TICK_MS): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), tickMs);
    return () => clearInterval(timer);
  }, [tickMs]);

  return now;
}

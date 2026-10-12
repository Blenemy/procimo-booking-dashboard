import { useSyncExternalStore } from 'react';

const MOBILE_BREAKPOINT_PX = 768;
const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT_PX - 1}px)`;

const subscribe = (onChange: () => void) => {
  const query = window.matchMedia(MOBILE_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
};

const isMobileViewport = () => window.matchMedia(MOBILE_QUERY).matches;

export const useIsMobile = () => useSyncExternalStore(subscribe, isMobileViewport);

import type { CSSProperties } from 'react';
import { Outlet, useLocation } from 'react-router';
import { QueryBoundary } from '@/components/query-boundary';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useLiveUpdates } from '../use-live-updates';
import { AppSidebar } from './app-sidebar';
import { SiteHeader } from './site-header';

const LAYOUT_SIZES = {
  '--sidebar-width': 'calc(var(--spacing) * 58)',
  '--header-height': 'calc(var(--spacing) * 14)',
} as CSSProperties;

export function AppLayout() {
  const location = useLocation();
  useLiveUpdates();

  return (
    <SidebarProvider style={LAYOUT_SIZES}>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col px-4 py-8 lg:px-8 lg:py-10">
          <QueryBoundary resetKeys={[location.pathname]}>
            <Outlet />
          </QueryBoundary>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

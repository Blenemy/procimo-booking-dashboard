import { SidebarTrigger } from '@/components/ui/sidebar';
import { UserAvatar } from '@/components/user-avatar';
import { BRAND } from '@/brand';
import { useSessionUser } from '@/features/auth/queries';
import { FacilityStatus } from '@/features/courts/facility-status';
import { ROLE_PROFILES } from './navigation';

export function SiteHeader() {
  const user = useSessionUser();

  return (
    <header className="sticky top-0 z-10 flex h-(--header-height) shrink-0 items-center gap-3 border-b bg-card px-4 lg:px-8">
      <SidebarTrigger className="-ml-1 md:hidden" />
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs">
        <span className="text-faint">{BRAND.name}</span>
        <span aria-hidden className="text-faint">
          /
        </span>
        <span className="font-semibold">{ROLE_PROFILES[user.role].portal}</span>
      </nav>
      <div className="ml-auto flex items-center gap-3">
        <FacilityStatus />
        <UserAvatar name={user.name} tone="dark" />
      </div>
    </header>
  );
}

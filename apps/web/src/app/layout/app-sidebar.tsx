import { Grid3x3Icon, LogOutIcon } from 'lucide-react';
import { Link, useMatch } from 'react-router';
import { IconButton } from '@/components/icon-button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { UserAvatar } from '@/components/user-avatar';
import { BRAND } from '@/brand';
import { useLogout, useSessionUser } from '@/features/auth/queries';
import { homePathFor } from '@/paths';
import { NAVIGATION, ROLE_PROFILES } from './navigation';
import type { NavItem } from './navigation';

function NavLinkItem({ item }: { item: NavItem }) {
  const isActive = useMatch({ path: item.to, end: false }) !== null;
  const { setOpenMobile } = useSidebar();

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        className="h-10 rounded-lg px-3 font-medium data-active:bg-sidebar-primary data-active:font-semibold data-active:text-sidebar-primary-foreground data-active:hover:bg-sidebar-primary/90 data-active:hover:text-sidebar-primary-foreground"
      >
        <Link to={item.to} onClick={() => setOpenMobile(false)}>
          <item.icon />
          <span>{item.label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function SessionUserCard() {
  const user = useSessionUser();
  const logout = useLogout();

  return (
    <div className="flex items-center gap-3 p-1">
      <UserAvatar name={user.name} tone="sky" />
      <div className="grid min-w-0 flex-1 leading-tight">
        <span className="truncate text-sm font-semibold text-sidebar-accent-foreground">
          {user.name}
        </span>
        <span className="truncate text-xs">{ROLE_PROFILES[user.role].account}</span>
      </div>
      <IconButton
        label="Log out"
        icon={LogOutIcon}
        variant="ghost"
        className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        disabled={logout.isPending}
        onClick={() => logout.mutate()}
      />
    </div>
  );
}

export function AppSidebar() {
  const user = useSessionUser();
  const navigation = NAVIGATION[user.role];

  return (
    <Sidebar>
      <SidebarHeader className="px-4 pt-4 pb-6">
        <Link to={homePathFor(user.role)} className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-lime text-lime-foreground">
            <Grid3x3Icon className="size-5" />
          </span>
          <span className="flex flex-col gap-1 leading-none">
            <span className="text-base font-extrabold tracking-tight text-white uppercase">
              {BRAND.name}
            </span>
            <span className="text-[0.625rem] font-semibold tracking-[0.25em] uppercase opacity-70">
              {BRAND.tagline}
            </span>
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[0.625rem] font-bold tracking-[0.2em] uppercase opacity-60">
            {navigation.label}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {navigation.items.map((item) => (
                <NavLinkItem key={item.to} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <SessionUserCard />
      </SidebarFooter>
    </Sidebar>
  );
}

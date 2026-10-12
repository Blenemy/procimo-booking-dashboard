import type { Role } from '@courtly/shared';
import { CalendarIcon, Grid3x3Icon, LayoutGridIcon, SearchIcon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PATHS } from '@/paths';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const NAVIGATION: Record<Role, NavSection> = {
  USER: {
    label: 'Play',
    items: [
      { to: PATHS.book, label: 'Book a court', icon: SearchIcon },
      { to: PATHS.myBookings, label: 'My bookings', icon: CalendarIcon },
    ],
  },
  ADMIN: {
    label: 'Operations',
    items: [
      { to: PATHS.adminCourts, label: 'Manage courts', icon: Grid3x3Icon },
      { to: PATHS.adminDay, label: 'Daily bookings', icon: LayoutGridIcon },
    ],
  },
};

export const ROLE_PROFILES: Record<Role, { account: string; portal: string }> = {
  USER: { account: 'User account', portal: 'User portal' },
  ADMIN: { account: 'Admin account', portal: 'Admin portal' },
};

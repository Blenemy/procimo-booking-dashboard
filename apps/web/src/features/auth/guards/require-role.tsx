import type { Role } from '@courtly/shared';
import { Navigate, Outlet } from 'react-router';
import { homePathFor } from '@/paths';
import { useSessionUser } from '../queries';

export function RequireRole({ role }: { role: Role }) {
  const user = useSessionUser();
  if (user.role !== role) return <Navigate to={homePathFor(user.role)} replace />;
  return <Outlet />;
}

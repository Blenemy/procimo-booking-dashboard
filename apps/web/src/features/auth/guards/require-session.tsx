import { Navigate, Outlet, useLocation } from 'react-router';
import { PageLoader } from '@/components/page-loader';
import { PATHS } from '@/paths';
import { useMe } from '../queries';

export function RequireSession() {
  const { data: user, isPending } = useMe();
  const location = useLocation();

  if (isPending) return <PageLoader />;
  if (!user) return <Navigate to={PATHS.login} replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

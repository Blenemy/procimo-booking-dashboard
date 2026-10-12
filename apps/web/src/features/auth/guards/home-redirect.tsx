import { Navigate } from 'react-router';
import { PageLoader } from '@/components/page-loader';
import { PATHS, homePathFor } from '@/paths';
import { useMe } from '../queries';

export function HomeRedirect() {
  const { data: user, isPending } = useMe();
  if (isPending) return <PageLoader />;
  return <Navigate to={user ? homePathFor(user.role) : PATHS.login} replace />;
}

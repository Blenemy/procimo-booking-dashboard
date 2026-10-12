import { Navigate, useLocation } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { homePathFor } from '@/paths';
import { useMe } from '../queries';
import { LoginForm } from './login-form';

const redirectTarget = (state: unknown) =>
  typeof state === 'object' && state !== null && 'from' in state && typeof state.from === 'string'
    ? state.from
    : null;

export function LoginPage() {
  const { data: user } = useMe();
  const location = useLocation();

  if (user) {
    return <Navigate to={redirectTarget(location.state) ?? homePathFor(user.role)} replace />;
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Courtly</CardTitle>
          <CardDescription>Sign in to book a court</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}

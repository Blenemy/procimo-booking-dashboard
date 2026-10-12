import { loginRequestSchema } from '@courtly/shared';
import type { LoginRequest } from '@courtly/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';
import { TextField } from '@/components/form/text-field';
import type { TextFieldConfig } from '@/components/form/text-field';
import { Button } from '@/components/ui/button';
import { useLogin } from '../queries';
import { DemoAccounts } from './demo-accounts';

const LOGIN_FIELDS: TextFieldConfig<LoginRequest>[] = [
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'username' },
  { name: 'password', label: 'Password', type: 'password', autoComplete: 'current-password' },
];

const EMPTY_CREDENTIALS: LoginRequest = { email: '', password: '' };

export function LoginForm() {
  const login = useLogin();
  const form = useForm({
    resolver: zodResolver(loginRequestSchema),
    defaultValues: EMPTY_CREDENTIALS,
  });

  const onSubmit = form.handleSubmit((credentials) => login.mutate(credentials));

  return (
    <FormProvider {...form}>
      <form className="flex flex-col gap-4" onSubmit={(event) => void onSubmit(event)} noValidate>
        {LOGIN_FIELDS.map((field) => (
          <TextField key={field.name} {...field} />
        ))}
        <Button type="submit" disabled={login.isPending}>
          {login.isPending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
      <DemoAccounts />
    </FormProvider>
  );
}

import type { LoginRequest } from '@courtly/shared';
import { useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';

const DEMO_PASSWORD = 'password123';

const DEMO_ACCOUNTS = [
  { label: 'Alice (user)', email: 'alice@courtly.test' },
  { label: 'Bob (user)', email: 'bob@courtly.test' },
  { label: 'Admin', email: 'admin@courtly.test' },
];

export function DemoAccounts() {
  const { reset } = useFormContext<LoginRequest>();

  return (
    <div className="mt-6 flex flex-col gap-2 border-t pt-4">
      <p className="text-xs text-muted-foreground">Demo accounts (password {DEMO_PASSWORD})</p>
      <div className="flex flex-wrap gap-2">
        {DEMO_ACCOUNTS.map((account) => (
          <Button
            key={account.email}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => reset({ email: account.email, password: DEMO_PASSWORD })}
          >
            {account.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

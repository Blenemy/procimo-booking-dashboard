import { cva } from 'class-variance-authority';
import type { VariantProps } from 'class-variance-authority';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

const noticeVariants = cva(
  'flex items-start gap-2.5 rounded-xl border px-4 py-3 text-xs leading-5',
  {
    variants: {
      tone: {
        warning: 'border-warning-border bg-warning-soft text-warning-foreground',
        info: 'border-info-border bg-info-soft text-info',
      },
    },
    defaultVariants: { tone: 'info' },
  },
);

interface NoticeProps extends VariantProps<typeof noticeVariants> {
  icon?: LucideIcon;
  children: ReactNode;
}

export function Notice({ tone, icon: Icon, children }: NoticeProps) {
  return (
    <div className={noticeVariants({ tone })}>
      {Icon && <Icon className="mt-0.5 size-4 shrink-0" />}
      <p>{children}</p>
    </div>
  );
}

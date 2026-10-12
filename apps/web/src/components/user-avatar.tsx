import { cva } from 'class-variance-authority';
import type { VariantProps } from 'class-variance-authority';
import { initialsOf } from '@/lib/format';

const userAvatarVariants = cva(
  'flex shrink-0 items-center justify-center rounded-full font-bold select-none',
  {
    variants: {
      tone: {
        sky: 'bg-avatar text-avatar-foreground',
        dark: 'bg-primary text-primary-foreground',
        muted: 'bg-muted text-foreground',
      },
      size: {
        sm: 'size-7 text-[0.625rem]',
        md: 'size-9 text-xs',
      },
    },
    defaultVariants: { tone: 'muted', size: 'md' },
  },
);

interface UserAvatarProps extends VariantProps<typeof userAvatarVariants> {
  name: string;
}

export function UserAvatar({ name, tone, size }: UserAvatarProps) {
  return (
    <span aria-hidden className={userAvatarVariants({ tone, size })}>
      {initialsOf(name)}
    </span>
  );
}

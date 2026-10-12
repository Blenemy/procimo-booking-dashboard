import type { SportType } from '@courtly/shared';
import { cva } from 'class-variance-authority';
import type { VariantProps } from 'class-variance-authority';
import { SPORTS } from './sports';

const sportBadgeVariants = cva('inline-flex items-center font-bold tracking-wider uppercase', {
  variants: {
    tone: {
      overlay: 'rounded-full bg-white/95 px-2.5 py-1 text-[0.625rem] text-foreground shadow-xs',
      muted: 'rounded-full bg-muted px-2 py-0.5 text-[0.625rem] text-muted-foreground',
      text: 'text-[0.6875rem] text-success',
    },
  },
  defaultVariants: { tone: 'muted' },
});

interface SportBadgeProps extends VariantProps<typeof sportBadgeVariants> {
  sport: SportType;
}

export function SportBadge({ sport, tone }: SportBadgeProps) {
  return <span className={sportBadgeVariants({ tone })}>{SPORTS[sport].label}</span>;
}

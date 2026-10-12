import { cva } from 'class-variance-authority';
import type { VariantProps } from 'class-variance-authority';

const statCardVariants = cva('flex flex-col gap-2 rounded-2xl border p-5', {
  variants: {
    tone: {
      default: 'bg-card',
      highlight: 'border-lime-soft-border bg-lime-soft',
      inverse: 'border-primary bg-primary text-primary-foreground',
    },
  },
  defaultVariants: { tone: 'default' },
});

const statLabelVariants = cva('text-xs font-semibold', {
  variants: {
    tone: {
      default: 'text-muted-foreground',
      highlight: 'text-foreground/70',
      inverse: 'text-primary-foreground/60',
    },
  },
  defaultVariants: { tone: 'default' },
});

const statValueVariants = cva('text-3xl font-bold tracking-tight', {
  variants: {
    tone: {
      default: '',
      highlight: '',
      inverse: 'text-lime',
    },
  },
  defaultVariants: { tone: 'default' },
});

export interface Stat extends VariantProps<typeof statCardVariants> {
  label: string;
  value: string;
}

export function StatCard({ label, value, tone }: Stat) {
  return (
    <div className={statCardVariants({ tone })}>
      <p className={statLabelVariants({ tone })}>{label}</p>
      <p className={statValueVariants({ tone })}>{value}</p>
    </div>
  );
}

export function StatGrid({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  );
}

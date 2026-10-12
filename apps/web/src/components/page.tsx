import { cn } from 'cn';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { BRAND } from '@/brand';

const PAGE_WIDTHS = {
  default: 'max-w-5xl',
  wide: 'max-w-6xl',
} as const;

interface PageProps {
  width?: keyof typeof PAGE_WIDTHS;
  children: ReactNode;
}

export function Page({ width = 'default', children }: PageProps) {
  return (
    <div className={cn('mx-auto flex w-full flex-col gap-6', PAGE_WIDTHS[width])}>{children}</div>
  );
}

interface PageHeaderProps {
  eyebrow: string;
  eyebrowIcon?: LucideIcon;
  title: string;
  documentTitle?: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({
  eyebrow,
  eyebrowIcon: EyebrowIcon,
  title,
  documentTitle = title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <title>{`${documentTitle} · ${BRAND.name}`}</title>
      <div className="flex flex-col gap-2">
        <p className="flex items-center gap-1.5 text-xs font-bold tracking-[0.18em] text-brand uppercase">
          {EyebrowIcon && <EyebrowIcon className="size-3.5" />}
          {eyebrow}
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}

interface SectionHeadingProps {
  title: string;
  meta?: ReactNode;
}

export function SectionHeading({ title, meta }: SectionHeadingProps) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {meta && <p className="text-xs font-medium text-faint">{meta}</p>}
    </div>
  );
}

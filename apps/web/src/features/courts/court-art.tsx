import type { SportType } from '@courtly/shared';
import { cn } from 'cn';
import { useId } from 'react';
import type { ReactNode } from 'react';
import { SPORTS } from './sports';

const MARKINGS: Record<SportType, ReactNode> = {
  TENNIS: (
    <>
      <rect x="40" y="24" width="240" height="132" />
      <line x1="40" y1="40" x2="280" y2="40" />
      <line x1="40" y1="140" x2="280" y2="140" />
      <line x1="100" y1="40" x2="100" y2="140" />
      <line x1="220" y1="40" x2="220" y2="140" />
      <line x1="100" y1="90" x2="220" y2="90" />
    </>
  ),
  PADEL: (
    <>
      <rect x="40" y="24" width="240" height="132" />
      <line x1="96" y1="24" x2="96" y2="156" />
      <line x1="224" y1="24" x2="224" y2="156" />
      <line x1="96" y1="90" x2="224" y2="90" />
      <rect x="32" y="16" width="256" height="148" rx="6" strokeOpacity="0.35" strokeWidth="6" />
    </>
  ),
  SQUASH: (
    <>
      <rect x="40" y="24" width="240" height="132" />
      <line x1="160" y1="24" x2="160" y2="156" />
      <line x1="40" y1="90" x2="160" y2="90" />
      <rect x="40" y="24" width="56" height="66" />
      <rect x="40" y="90" width="56" height="66" />
    </>
  ),
  PICKLEBALL: (
    <>
      <rect x="40" y="24" width="240" height="132" />
      <line x1="128" y1="24" x2="128" y2="156" />
      <line x1="192" y1="24" x2="192" y2="156" />
      <line x1="40" y1="90" x2="128" y2="90" />
      <line x1="192" y1="90" x2="280" y2="90" />
    </>
  ),
};

const HAS_NET: Record<SportType, boolean> = {
  TENNIS: true,
  PADEL: true,
  SQUASH: false,
  PICKLEBALL: true,
};

interface CourtArtProps {
  sport: SportType;
  className?: string;
}

export function CourtArt({ sport, className }: CourtArtProps) {
  const shineId = useId();
  const style = SPORTS[sport];

  return (
    <svg
      viewBox="0 0 320 180"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
      className={cn('block', className)}
    >
      <defs>
        <linearGradient id={shineId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.22" />
          <stop offset="0.55" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.18" />
        </linearGradient>
      </defs>
      <rect width="320" height="180" fill={style.surround} />
      <rect x="40" y="24" width="240" height="132" fill={style.surface} />
      <g fill="none" stroke={style.lines} strokeWidth="2.5">
        {MARKINGS[sport]}
      </g>
      {HAS_NET[sport] && (
        <>
          <line
            x1="160"
            y1="14"
            x2="160"
            y2="166"
            stroke="#0f1712"
            strokeOpacity="0.55"
            strokeWidth="4"
          />
          <circle cx="160" cy="14" r="3.5" fill="#0f1712" fillOpacity="0.6" />
          <circle cx="160" cy="166" r="3.5" fill="#0f1712" fillOpacity="0.6" />
        </>
      )}
      <rect width="320" height="180" fill={`url(#${shineId})`} />
    </svg>
  );
}

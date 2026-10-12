import { SPORT_TYPES } from '@courtly/shared';
import type { SportType } from '@courtly/shared';

export interface SportStyle {
  label: string;
  surface: string;
  surround: string;
  lines: string;
}

export const SPORTS: Record<SportType, SportStyle> = {
  PADEL: { label: 'Padel', surface: '#2f6db0', surround: '#1f4f85', lines: '#ffffff' },
  TENNIS: { label: 'Tennis', surface: '#c4553a', surround: '#9b3f2a', lines: '#ffffff' },
  SQUASH: { label: 'Squash', surface: '#d8ae78', surround: '#b98d55', lines: '#c0392b' },
  PICKLEBALL: { label: 'Pickleball', surface: '#3d8c5a', surround: '#2c6a43', lines: '#ffffff' },
};

export const SPORT_OPTIONS = SPORT_TYPES.map((sport) => ({
  value: sport,
  label: SPORTS[sport].label,
}));

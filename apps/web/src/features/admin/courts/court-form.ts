import {
  HOURS_PER_DAY,
  MAX_HOURLY_PRICE_CENTS,
  OPEN_BEFORE_CLOSE_ISSUE,
  courtFieldsSchema,
  openBeforeClose,
} from '@courtly/shared';
import type { CourtDto, CreateCourtRequest } from '@courtly/shared';
import { z } from 'zod';
import type { FieldConfig } from '@/components/form/form-fields';
import { SPORT_OPTIONS } from '@/features/courts/sports';
import type { ServerFieldMap } from '@/lib/form-errors';
import { CENTS_PER_UNIT, formatHour } from '@/lib/format';

const PRICE_STEP = '0.01';

export const courtFormSchema = courtFieldsSchema
  .omit({ hourlyPriceCents: true })
  .extend({
    hourlyPrice: z
      .number('Enter a price')
      .min(0, 'Price cannot be negative')
      .max(MAX_HOURLY_PRICE_CENTS / CENTS_PER_UNIT, 'Price is too high'),
    isActive: z.boolean(),
  })
  .refine(openBeforeClose, OPEN_BEFORE_CLOSE_ISSUE);

export type CourtFormValues = z.infer<typeof courtFormSchema>;

export const NEW_COURT: CourtFormValues = {
  name: '',
  sportType: 'PADEL',
  openHour: 8,
  closeHour: 22,
  hourlyPrice: 30,
  isActive: true,
};

export const toCourtFormValues = (court: CourtDto): CourtFormValues => ({
  name: court.name,
  sportType: court.sportType,
  openHour: court.openHour,
  closeHour: court.closeHour,
  hourlyPrice: court.hourlyPriceCents / CENTS_PER_UNIT,
  isActive: court.isActive,
});

export const toCourtRequest = ({
  hourlyPrice,
  ...values
}: CourtFormValues): CreateCourtRequest => ({
  ...values,
  hourlyPriceCents: Math.round(hourlyPrice * CENTS_PER_UNIT),
});

export const COURT_SERVER_FIELDS: ServerFieldMap<CourtFormValues> = {
  name: 'name',
  sportType: 'sportType',
  hourlyPriceCents: 'hourlyPrice',
  openHour: 'openHour',
  closeHour: 'closeHour',
  isActive: 'isActive',
};

const hourOptions = (hours: number[]) =>
  hours.map((hour) => ({ value: hour, label: formatHour(hour) }));

const OPEN_HOURS = hourOptions(Array.from({ length: HOURS_PER_DAY }, (_, hour) => hour));
const CLOSE_HOURS = hourOptions(Array.from({ length: HOURS_PER_DAY }, (_, hour) => hour + 1));

export const courtFields = (currency: string): FieldConfig<CourtFormValues>[] => [
  { kind: 'text', name: 'name', label: 'Court name', placeholder: 'e.g. Centre Court' },
  { kind: 'select', name: 'sportType', label: 'Sport', options: SPORT_OPTIONS, span: 'half' },
  {
    kind: 'text',
    name: 'hourlyPrice',
    label: `Hourly price (${currency})`,
    type: 'number',
    step: PRICE_STEP,
    span: 'half',
  },
  { kind: 'select', name: 'openHour', label: 'Opens at', options: OPEN_HOURS, span: 'half' },
  { kind: 'select', name: 'closeHour', label: 'Closes at', options: CLOSE_HOURS, span: 'half' },
  {
    kind: 'switch',
    name: 'isActive',
    label: 'Accepting bookings',
    description: 'Inactive courts are hidden from players. Their booking history is kept.',
  },
];

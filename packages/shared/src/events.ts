export const AVAILABILITY_CHANGED_EVENT = 'availability.changed';

export interface AvailabilityChangedEvent {
  courtId: number;
  date: string;
}

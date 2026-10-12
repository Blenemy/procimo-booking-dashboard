import type { BookingDto } from '@courtly/shared';
import { describe, expect, it } from 'vitest';
import { bookingPhase } from '@/features/bookings/my-bookings/booking-phase';

const booking = (overrides: Partial<BookingDto> = {}): BookingDto => ({
  id: 1,
  court: { id: 1, name: 'Centre Court', sportType: 'TENNIS' },
  startsAt: '2026-06-13T16:00:00.000Z',
  endsAt: '2026-06-13T18:00:00.000Z',
  durationHours: 2,
  status: 'CONFIRMED',
  totalPriceCents: 6000,
  createdAt: '2026-06-01T10:00:00.000Z',
  cancelledAt: null,
  cancellableUntil: '2026-06-13T14:00:00.000Z',
  ...overrides,
});

const at = (iso: string) => new Date(iso);

describe('cancellation window', () => {
  it('offers cancelling up to and including the cutoff', () => {
    expect(bookingPhase(booking(), at('2026-06-13T13:59:59.999Z'))).toBe('cancellable');
    expect(bookingPhase(booking(), at('2026-06-13T14:00:00.000Z'))).toBe('cancellable');
  });

  it('locks cancelling once the booking is less than two hours away', () => {
    expect(bookingPhase(booking(), at('2026-06-13T14:00:00.001Z'))).toBe('locked');
  });

  it('never offers cancelling a booking that is cancelled, running or finished', () => {
    const beforeCutoff = at('2026-06-13T10:00:00.000Z');
    expect(bookingPhase(booking({ status: 'CANCELLED' }), beforeCutoff)).toBe('cancelled');
    expect(bookingPhase(booking(), at('2026-06-13T16:30:00.000Z'))).toBe('inProgress');
    expect(bookingPhase(booking(), at('2026-06-13T18:00:00.000Z'))).toBe('completed');
  });
});

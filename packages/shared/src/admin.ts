import type { BookingDto } from './bookings';
import type { CourtDto } from './courts';

export interface AdminBookingDto extends BookingDto {
  user: {
    id: number;
    name: string;
    email: string;
  };
}

export interface AdminCourtDayDto {
  court: CourtDto;
  revenueCents: number;
  bookings: AdminBookingDto[];
}

export interface AdminDayDto {
  date: string;
  currency: string;
  totalRevenueCents: number;
  courts: AdminCourtDayDto[];
}

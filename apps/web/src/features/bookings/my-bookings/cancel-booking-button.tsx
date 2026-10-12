import type { BookingDto } from '@courtly/shared';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useFacility } from '@/features/config/queries';
import { useCancelBooking } from '../queries';

const BUTTON_CLASS = 'h-9 rounded-lg px-4 text-xs font-semibold';

interface CancelBookingButtonProps {
  booking: BookingDto;
  when: string;
  locked: boolean;
}

export function CancelBookingButton({ booking, when, locked }: CancelBookingButtonProps) {
  const facility = useFacility();
  const cancelBooking = useCancelBooking();

  if (locked) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span tabIndex={0} className="rounded-lg">
            <Button variant="outline" className={BUTTON_CLASS} disabled>
              Cancel booking
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          Cancellation closed at {facility.time(booking.cancellableUntil)}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <ConfirmDialog
      trigger={
        <Button
          variant="outline"
          className={`${BUTTON_CLASS} border-destructive/25 text-destructive hover:bg-destructive/5 hover:text-destructive`}
          disabled={cancelBooking.isPending}
        >
          {cancelBooking.isPending ? 'Cancelling…' : 'Cancel booking'}
        </Button>
      }
      title="Cancel this booking?"
      description={`${booking.court.name}, ${when}. The slot will be released for other players.`}
      cancelLabel="Keep booking"
      confirmLabel="Cancel booking"
      destructive
      onConfirm={() => cancelBooking.mutate(booking.id)}
    />
  );
}

import type { CourtDto } from '@courtly/shared';
import { PencilIcon, PowerIcon, PowerOffIcon } from 'lucide-react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { IconButton } from '@/components/icon-button';
import { useSetCourtActive } from '@/features/courts/queries';

interface CourtActionsProps {
  court: CourtDto;
  onEdit: (court: CourtDto) => void;
}

export function CourtActions({ court, onEdit }: CourtActionsProps) {
  const setActive = useSetCourtActive();
  const toggle = (isActive: boolean) => setActive.mutate({ courtId: court.id, isActive });

  return (
    <div className="flex justify-end gap-2">
      <IconButton label={`Edit ${court.name}`} icon={PencilIcon} onClick={() => onEdit(court)} />
      {court.isActive ? (
        <ConfirmDialog
          trigger={
            <IconButton
              label={`Deactivate ${court.name}`}
              icon={PowerOffIcon}
              disabled={setActive.isPending}
            />
          }
          title={`Deactivate ${court.name}?`}
          description="Players will no longer be able to book this court. Existing bookings and the full booking history are kept."
          confirmLabel="Deactivate"
          destructive
          onConfirm={() => toggle(false)}
        />
      ) : (
        <IconButton
          label={`Activate ${court.name}`}
          icon={PowerIcon}
          disabled={setActive.isPending}
          onClick={() => toggle(true)}
        />
      )}
    </div>
  );
}

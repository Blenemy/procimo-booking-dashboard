import type { CourtDto } from '@courtly/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';
import { FormFields } from '@/components/form/form-fields';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useFacility } from '@/features/config/queries';
import { useCreateCourt, useUpdateCourt } from '@/features/courts/queries';
import { errorMessage } from '@/lib/api-client';
import { applyServerFieldErrors } from '@/lib/form-errors';
import {
  COURT_SERVER_FIELDS,
  NEW_COURT,
  courtFields,
  courtFormSchema,
  toCourtFormValues,
  toCourtRequest,
} from './court-form';

const FORM_COPY = {
  create: {
    title: 'Add court',
    description: 'New courts can be booked as soon as they are active.',
    submit: 'Add court',
  },
  edit: {
    title: 'Edit court',
    description: 'Changes apply to new bookings. Existing bookings are kept.',
    submit: 'Save changes',
  },
} as const;

interface CourtFormProps {
  court: CourtDto | null;
  onDone: () => void;
}

function CourtForm({ court, onDone }: CourtFormProps) {
  const facility = useFacility();
  const createCourt = useCreateCourt();
  const updateCourt = useUpdateCourt();
  const copy = FORM_COPY[court ? 'edit' : 'create'];
  const form = useForm({
    resolver: zodResolver(courtFormSchema),
    defaultValues: court ? toCourtFormValues(court) : NEW_COURT,
  });

  const showServerError = (error: unknown) => {
    if (applyServerFieldErrors(error, form.setError, COURT_SERVER_FIELDS)) return;
    form.setError('root.server', { message: errorMessage(error) });
  };

  const onSubmit = form.handleSubmit((values) => {
    const request = toCourtRequest(values);
    const callbacks = { onSuccess: onDone, onError: showServerError };
    if (court) updateCourt.mutate({ courtId: court.id, changes: request }, callbacks);
    else createCourt.mutate(request, callbacks);
  });

  const isPending = createCourt.isPending || updateCourt.isPending;
  const serverError = form.formState.errors.root?.server?.message;

  return (
    <FormProvider {...form}>
      <form className="flex flex-col gap-5" onSubmit={(event) => void onSubmit(event)} noValidate>
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>
        <FormFields fields={courtFields(facility.currency)} />
        {serverError && (
          <Alert variant="destructive">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving…' : copy.submit}
          </Button>
        </DialogFooter>
      </form>
    </FormProvider>
  );
}

interface CourtFormDialogProps {
  court: CourtDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CourtFormDialog({ court, open, onOpenChange }: CourtFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {open && (
          <CourtForm key={court?.id ?? 'new'} court={court} onDone={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

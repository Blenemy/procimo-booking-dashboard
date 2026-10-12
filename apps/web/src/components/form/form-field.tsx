import { useId } from 'react';
import type { ReactNode } from 'react';
import { useFormContext } from 'react-hook-form';
import type { FieldPath, FieldValues } from 'react-hook-form';
import { Label } from '@/components/ui/label';

export interface FieldControlProps {
  id: string;
  'aria-invalid': boolean;
  'aria-describedby'?: string;
}

export interface FormFieldProps<T extends FieldValues> {
  name: FieldPath<T>;
  label: string;
  description?: string;
  children: (control: FieldControlProps) => ReactNode;
}

export function FormField<T extends FieldValues>({
  name,
  label,
  description,
  children,
}: FormFieldProps<T>) {
  const { getFieldState, formState } = useFormContext<T>();
  const { error } = getFieldState(name, formState);
  const id = useId();
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;
  const describedBy = [description && descriptionId, error?.message && errorId]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children({
        id,
        'aria-invalid': Boolean(error),
        'aria-describedby': describedBy || undefined,
      })}
      {description && (
        <p id={descriptionId} className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {error?.message && (
        <p id={errorId} className="text-sm text-destructive">
          {error.message}
        </p>
      )}
    </div>
  );
}

import { useId } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import type { FieldPath, FieldValues } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export interface SwitchFieldConfig<T extends FieldValues> {
  name: FieldPath<T>;
  label: string;
  description?: string;
}

export function SwitchField<T extends FieldValues>({
  name,
  label,
  description,
}: SwitchFieldConfig<T>) {
  const { control } = useFormContext<T>();
  const id = useId();
  const descriptionId = `${id}-description`;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange, onBlur, ref } }) => (
        <div className="flex items-center justify-between gap-4 rounded-xl border p-3">
          <div className="flex flex-col gap-0.5">
            <Label htmlFor={id}>{label}</Label>
            {description && (
              <p id={descriptionId} className="text-xs text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          <Switch
            id={id}
            ref={ref}
            checked={value === true}
            onCheckedChange={onChange}
            onBlur={onBlur}
            aria-describedby={description ? descriptionId : undefined}
          />
        </div>
      )}
    />
  );
}

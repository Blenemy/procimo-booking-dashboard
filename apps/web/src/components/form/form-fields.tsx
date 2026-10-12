import { cn } from 'cn';
import type { FieldValues } from 'react-hook-form';
import { SelectField } from './select-field';
import type { SelectFieldConfig } from './select-field';
import { SwitchField } from './switch-field';
import type { SwitchFieldConfig } from './switch-field';
import { TextField } from './text-field';
import type { TextFieldConfig } from './text-field';

interface FieldLayout {
  span?: 'full' | 'half';
}

export type FieldConfig<T extends FieldValues> = FieldLayout &
  (
    | ({ kind: 'text' } & TextFieldConfig<T>)
    | ({ kind: 'select' } & SelectFieldConfig<T>)
    | ({ kind: 'switch' } & SwitchFieldConfig<T>)
  );

function Field<T extends FieldValues>({ field }: { field: FieldConfig<T> }) {
  switch (field.kind) {
    case 'text':
      return <TextField {...field} />;
    case 'select':
      return <SelectField {...field} />;
    case 'switch':
      return <SwitchField {...field} />;
  }
}

export function FormFields<T extends FieldValues>({ fields }: { fields: FieldConfig<T>[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((field) => (
        <div key={field.name} className={cn(field.span !== 'half' && 'sm:col-span-2')}>
          <Field field={field} />
        </div>
      ))}
    </div>
  );
}

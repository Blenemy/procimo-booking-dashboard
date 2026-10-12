import type { HTMLInputAutoCompleteAttribute } from 'react';
import { useFormContext } from 'react-hook-form';
import type { FieldValues } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { FormField } from './form-field';
import type { FormFieldProps } from './form-field';

export interface TextFieldConfig<T extends FieldValues> extends Omit<
  FormFieldProps<T>,
  'children'
> {
  type?: 'text' | 'email' | 'password' | 'number';
  autoComplete?: HTMLInputAutoCompleteAttribute;
  placeholder?: string;
  step?: string;
}

export function TextField<T extends FieldValues>({
  type = 'text',
  autoComplete,
  placeholder,
  step,
  ...field
}: TextFieldConfig<T>) {
  const { register } = useFormContext<T>();

  return (
    <FormField {...field}>
      {(control) => (
        <Input
          {...control}
          type={type}
          autoComplete={autoComplete}
          placeholder={placeholder}
          step={step}
          {...register(field.name, { valueAsNumber: type === 'number' })}
        />
      )}
    </FormField>
  );
}

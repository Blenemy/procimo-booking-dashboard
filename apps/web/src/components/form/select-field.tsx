import { Controller, useFormContext } from 'react-hook-form';
import type { FieldValues } from 'react-hook-form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormField } from './form-field';
import type { FormFieldProps } from './form-field';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectFieldConfig<T extends FieldValues> extends Omit<
  FormFieldProps<T>,
  'children'
> {
  options: readonly SelectOption[];
  placeholder?: string;
}

export function SelectField<T extends FieldValues>({
  options,
  placeholder,
  ...field
}: SelectFieldConfig<T>) {
  const { control } = useFormContext<T>();
  const optionFor = (key: string) => options.find((option) => String(option.value) === key);

  return (
    <FormField {...field}>
      {(fieldControl) => (
        <Controller
          control={control}
          name={field.name}
          render={({ field: { value, onChange, onBlur, ref } }) => (
            <Select
              value={options.find((option) => option.value === value)?.value.toString() ?? ''}
              onValueChange={(key) => onChange(optionFor(key)?.value)}
            >
              <SelectTrigger {...fieldControl} ref={ref} onBlur={onBlur} className="w-full">
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={String(option.value)}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      )}
    </FormField>
  );
}

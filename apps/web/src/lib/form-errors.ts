import { ERROR_CODES } from '@courtly/shared';
import type { ValidationIssue } from '@courtly/shared';
import type { FieldPath, FieldValues, UseFormSetError } from 'react-hook-form';
import { ApiError } from './api-client';

const isValidationIssue = (value: unknown): value is ValidationIssue =>
  typeof value === 'object' &&
  value !== null &&
  'path' in value &&
  typeof value.path === 'string' &&
  'message' in value &&
  typeof value.message === 'string';

export type ServerFieldMap<T extends FieldValues> = Partial<Record<string, FieldPath<T>>>;

export function applyServerFieldErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: ServerFieldMap<T>,
): boolean {
  if (!(error instanceof ApiError) || error.code !== ERROR_CODES.VALIDATION_ERROR) return false;
  if (!Array.isArray(error.details)) return false;

  let applied = false;
  for (const issue of error.details.filter(isValidationIssue)) {
    const field = fields[issue.path];
    if (!field) continue;
    setError(field, { type: 'server', message: issue.message });
    applied = true;
  }
  return applied;
}

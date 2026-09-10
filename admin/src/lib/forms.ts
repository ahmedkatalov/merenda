import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { isApiError } from './api';

/**
 * Map `error.fields` from a validation_error response onto react-hook-form fields.
 * Returns true when at least one field error was applied.
 */
export function applyServerErrors<T extends FieldValues>(err: unknown, setError: UseFormSetError<T>, allowed?: readonly string[]): boolean {
  if (!isApiError(err) || !err.fields) return false;
  let applied = false;
  for (const [field, message] of Object.entries(err.fields)) {
    if (allowed && !allowed.includes(field)) continue;
    setError(field as Path<T>, { type: 'server', message });
    applied = true;
  }
  return applied;
}

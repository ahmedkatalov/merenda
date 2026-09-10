import { useId, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface FormFieldProps {
  label?: ReactNode;
  help?: ReactNode;
  error?: string | undefined;
  required?: boolean;
  htmlFor?: string;
  className?: string;
  /** Put label and control on one row (for switches). */
  inline?: boolean;
  children: ReactNode | ((id: string) => ReactNode);
}

export function FormField({ label, help, error, required, htmlFor, className, inline, children }: FormFieldProps) {
  const autoId = useId();
  const id = htmlFor ?? autoId;
  const content = typeof children === 'function' ? children(id) : children;
  return (
    <div className={cn('flex flex-col gap-1.5', inline && 'flex-row items-center justify-between gap-4', className)}>
      {label && (
        <label htmlFor={id} className="text-[13px] font-medium text-zinc-700">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}
      {content}
      {error ? (
        <p className="text-[13px] text-red-600" role="alert">
          {error}
        </p>
      ) : help ? (
        <p className="text-[13px] text-zinc-500">{help}</p>
      ) : null}
    </div>
  );
}

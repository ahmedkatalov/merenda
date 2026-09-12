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
  const isControl = typeof children === 'function';
  const content = isControl ? children(id) : children;
  // Only a render-prop child receives `id`; for static children (e.g. a segmented
  // control) render a plain caption so the label never points at a missing element.
  const labelCls = 'text-[13px] font-medium text-zinc-700';
  return (
    <div className={cn('flex flex-col gap-1.5', inline && 'flex-row items-center justify-between gap-4', className)}>
      {label &&
        (isControl ? (
          <label htmlFor={id} className={labelCls}>
            {label}
            {required && <span className="ml-0.5 text-red-500">*</span>}
          </label>
        ) : (
          <span className={labelCls}>
            {label}
            {required && <span className="ml-0.5 text-red-500">*</span>}
          </span>
        ))}
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

import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { controlBase, controlInvalid } from './Input';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ className, invalid, rows = 3, ...rest }, ref) {
  return <textarea ref={ref} rows={rows} className={cn(controlBase, 'min-h-[80px] resize-y px-3 py-2 leading-relaxed', invalid && controlInvalid, className)} aria-invalid={invalid || undefined} {...rest} />;
});

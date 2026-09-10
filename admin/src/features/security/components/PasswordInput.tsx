import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input, type InputProps } from '@/components/ui';

export type PasswordInputProps = Omit<InputProps, 'type' | 'suffix'>;

/** Password field with a show/hide toggle (same affordance as the login page). */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(props, ref) {
  const [show, setShow] = useState(false);
  return (
    <Input
      ref={ref}
      type={show ? 'text' : 'password'}
      placeholder="••••••••"
      spellCheck={false}
      suffix={
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? 'Скрыть пароль' : 'Показать пароль'}
          className="inline-flex size-8 items-center justify-center rounded-md text-zinc-400 transition-colors hover:text-zinc-700 focus-ring"
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      }
      {...props}
    />
  );
});

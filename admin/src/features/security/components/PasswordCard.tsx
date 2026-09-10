import { useId } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Info } from 'lucide-react';
import { errorMessage, isApiError } from '@/lib/api';
import { applyServerErrors } from '@/lib/forms';
import { Button, Card, FormField } from '@/components/ui';
import { useCurrentUser } from '@/features/auth/hooks';
import { useChangePassword } from '../hooks';
import { PasswordInput } from './PasswordInput';
import { PasswordStrength } from './PasswordStrength';

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Введите текущий пароль'),
    newPassword: z.string().min(8, 'Минимум 8 символов'),
    confirm: z.string().min(1, 'Повторите пароль'),
  })
  .superRefine((v, ctx) => {
    if (v.newPassword && v.newPassword === v.currentPassword) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['newPassword'], message: 'Новый пароль совпадает с текущим' });
    }
    if (v.confirm && v.confirm !== v.newPassword) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['confirm'], message: 'Пароли не совпадают' });
    }
  });
type FormValues = z.infer<typeof schema>;

const EMPTY: FormValues = { currentPassword: '', newPassword: '', confirm: '' };

export function PasswordCard() {
  const user = useCurrentUser();
  const change = useChangePassword();
  const formId = useId();
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: EMPTY });
  const { errors, isDirty, isSubmitting } = form.formState;
  const newPassword = form.watch('newPassword');

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await change.mutateAsync({ currentPassword: values.currentPassword, newPassword: values.newPassword });
      form.reset(EMPTY);
    } catch (e) {
      if (applyServerErrors(e, form.setError, ['currentPassword', 'newPassword'])) return;
      if (isApiError(e) && (e.status === 400 || e.status === 401)) {
        form.setError('currentPassword', { type: 'server', message: 'Неверный текущий пароль' }, { shouldFocus: true });
        return;
      }
      toast.error(errorMessage(e));
    }
  });

  return (
    <Card
      title="Смена пароля"
      description="Не менее 8 символов. Лучше — буквы разного регистра, цифры и символы."
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-1.5 text-[13px] text-zinc-500">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            <span>После смены пароля все остальные сессии будут завершены.</span>
          </p>
          <Button type="submit" form={formId} variant="primary" disabled={!isDirty} loading={isSubmitting} className="sm:shrink-0">
            Изменить пароль
          </Button>
        </div>
      }
    >
      <form id={formId} onSubmit={onSubmit} className="space-y-4" noValidate>
        {/* Lets password managers associate the new password with the account. */}
        <input type="email" name="username" autoComplete="username" value={user?.email ?? ''} readOnly tabIndex={-1} aria-hidden="true" className="sr-only" />
        <FormField label="Текущий пароль" error={errors.currentPassword?.message}>
          {(id) => <PasswordInput id={id} autoComplete="current-password" invalid={!!errors.currentPassword} {...form.register('currentPassword')} />}
        </FormField>
        <div className="space-y-2">
          <FormField label="Новый пароль" error={errors.newPassword?.message}>
            {(id) => <PasswordInput id={id} autoComplete="new-password" invalid={!!errors.newPassword} {...form.register('newPassword')} />}
          </FormField>
          <PasswordStrength value={newPassword} />
        </div>
        <FormField label="Повторите пароль" error={errors.confirm?.message}>
          {(id) => <PasswordInput id={id} autoComplete="new-password" invalid={!!errors.confirm} {...form.register('confirm')} />}
        </FormField>
      </form>
    </Card>
  );
}

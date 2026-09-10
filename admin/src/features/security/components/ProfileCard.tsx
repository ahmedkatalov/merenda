import { useEffect, useId } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Mail, UserRound } from 'lucide-react';
import type { AdminUser } from '@merenda/shared';
import { errorMessage } from '@/lib/api';
import { applyServerErrors } from '@/lib/forms';
import { formatDateTime } from '@/lib/utils';
import { Button, Card, ErrorState, FormField, Input, Skeleton } from '@/components/ui';
import { useCurrentUser } from '@/features/auth/hooks';
import { useMe, useUpdateProfile } from '../hooks';

const schema = z.object({
  name: z.string().trim().min(1, 'Введите имя').max(80, 'Не более 80 символов'),
  email: z.string().trim().min(1, 'Введите email').email('Некорректный email'),
});
type FormValues = z.infer<typeof schema>;

const ROLE_LABELS: Record<AdminUser['role'], string> = { owner: 'Владелец', manager: 'Менеджер' };

const toValues = (u: AdminUser | null): FormValues => ({ name: u?.name ?? '', email: u?.email ?? '' });

export function ProfileCard() {
  const user = useCurrentUser();
  const me = useMe();
  const update = useUpdateProfile();
  const formId = useId();
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: toValues(user) });
  const { errors, isDirty, isSubmitting } = form.formState;

  // Sync the form with the freshly fetched profile, but never clobber an edit in progress.
  useEffect(() => {
    if (user && !isDirty) form.reset(toValues(user));
  }, [user, isDirty, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const updated = await update.mutateAsync(values);
      form.reset(toValues(updated));
    } catch (e) {
      if (!applyServerErrors(e, form.setError, ['name', 'email'])) toast.error(errorMessage(e));
    }
  });

  if (!user) {
    return (
      <Card title="Профиль" description="Имя и email администратора.">
        {me.isError ? (
          <ErrorState error={me.error} onRetry={() => void me.refetch()} />
        ) : (
          <div className="space-y-4" aria-busy="true">
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-16" />
              <Skeleton className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-16" />
              <Skeleton className="h-10" />
            </div>
          </div>
        )}
      </Card>
    );
  }

  return (
    <Card
      title="Профиль"
      description="Имя и email администратора."
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex flex-wrap gap-x-3 gap-y-0.5 text-[13px] text-zinc-500">
            <span>
              Роль: <span className="font-medium text-zinc-700">{ROLE_LABELS[user.role]}</span>
            </span>
            {user.lastLoginAt && <span>Последний вход: {formatDateTime(user.lastLoginAt)}</span>}
          </p>
          <div className="flex shrink-0 gap-2 sm:justify-end">
            {isDirty && (
              <Button variant="ghost" onClick={() => form.reset()} disabled={isSubmitting}>
                Отменить
              </Button>
            )}
            <Button type="submit" form={formId} variant="primary" disabled={!isDirty} loading={isSubmitting}>
              Сохранить
            </Button>
          </div>
        </div>
      }
    >
      <form id={formId} onSubmit={onSubmit} className="space-y-4" noValidate>
        <FormField label="Имя" required error={errors.name?.message}>
          {(id) => <Input id={id} autoComplete="name" placeholder="Имя администратора" maxLength={80} prefix={<UserRound />} invalid={!!errors.name} {...form.register('name')} />}
        </FormField>
        <FormField label="Email" required error={errors.email?.message} help="Используется для входа в панель.">
          {(id) => <Input id={id} type="email" autoComplete="email" placeholder="admin@merenda.ru" prefix={<Mail />} invalid={!!errors.email} {...form.register('email')} />}
        </FormField>
      </form>
    </Card>
  );
}

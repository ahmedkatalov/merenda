import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { errorMessage, isApiError } from '@/lib/api';
import { applyServerErrors } from '@/lib/forms';
import { Button, FormField, Input } from '@/components/ui';
import { Wordmark } from '@/app/Wordmark';
import { authApi } from '../api';
import { useBootstrapAuth, useIsAuthenticated } from '../hooks';
import { useAuthStore } from '../store';

const schema = z.object({
  email: z.string().trim().min(1, 'Введите email').email('Некорректный email'),
  password: z.string().min(1, 'Введите пароль'),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const booted = useBootstrapAuth();
  const authed = useIsAuthenticated();
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((s) => s.setSession);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });

  if (booted && authed) {
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={from && from !== '/login' ? from : '/'} replace />;
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      const res = await authApi.login(values);
      setSession(res);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from && from !== '/login' ? from : '/', { replace: true });
    } catch (e) {
      if (applyServerErrors(e, form.setError, ['email', 'password'])) return;
      if (isApiError(e) && e.status === 429) {
        setFormError('Слишком много попыток входа. Подождите минуту и попробуйте снова.');
      } else if (isApiError(e) && e.status === 401) {
        setFormError('Неверный email или пароль.');
      } else {
        setFormError(errorMessage(e));
      }
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-10">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 flex justify-center">
          <Wordmark size="lg" />
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-soft sm:p-8">
          <h1 className="text-lg font-semibold text-zinc-900">Вход в панель управления</h1>
          <p className="mt-1 text-sm text-zinc-500">Введите данные администратора.</p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
            <FormField label="Email" error={form.formState.errors.email?.message}>
              {(id) => <Input id={id} type="email" autoComplete="username" placeholder="admin@merenda.ru" prefix={<Mail />} invalid={!!form.formState.errors.email} data-autofocus {...form.register('email')} />}
            </FormField>
            <FormField label="Пароль" error={form.formState.errors.password?.message}>
              {(id) => (
                <Input
                  id={id}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  prefix={<Lock />}
                  invalid={!!form.formState.errors.password}
                  suffix={
                    <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'} className="inline-flex size-8 items-center justify-center rounded-md text-zinc-400 hover:text-zinc-700">
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  }
                  {...form.register('password')}
                />
              )}
            </FormField>
            {formError && (
              <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] text-red-700">
                {formError}
              </div>
            )}
            <Button type="submit" variant="primary" size="lg" fullWidth loading={form.formState.isSubmitting}>
              Войти
            </Button>
          </form>
        </div>
        <p className="mt-6 text-center text-[12px] text-zinc-400">Merenda Admin · панель управления сайтом</p>
      </div>
    </div>
  );
}

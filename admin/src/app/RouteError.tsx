import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { Button } from '@/components/ui';

export function RouteError() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : error instanceof Error ? error.message : 'Неизвестная ошибка';
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 p-6 text-center">
      <h1 className="text-xl font-semibold text-zinc-900">Что-то пошло не так</h1>
      <p className="max-w-md text-sm text-zinc-500">{message}</p>
      <Button variant="primary" onClick={() => window.location.reload()}>
        Перезагрузить
      </Button>
    </div>
  );
}

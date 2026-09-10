import { RefreshCw, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { t } from '@/lib/i18n';

interface Props {
  message?: string;
  onRetry: () => void;
  retrying?: boolean;
}

export function ErrorScreen({ message, onRetry, retrying }: Props) {
  return (
    <div className="flex min-h-dvh items-center justify-center px-6">
      <div className="card-surface flex w-full max-w-md flex-col items-center gap-4 px-8 py-10 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-warning-soft text-warning">
          <WifiOff className="size-6" />
        </span>
        <h1 className="text-[1.5rem]">{t.errors.title}</h1>
        <p className="text-muted">{message || t.errors.text}</p>
        <Button onClick={onRetry} loading={retrying} className="mt-2">
          <RefreshCw className="size-4" />
          {t.common.retry}
        </Button>
      </div>
    </div>
  );
}

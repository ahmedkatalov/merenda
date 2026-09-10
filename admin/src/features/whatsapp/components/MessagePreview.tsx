import { Copy, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { normalizeWhatsappNumber, type OrderSettings } from '@merenda/shared';
import { copyToClipboard } from '@/lib/utils';
import { Button, Card } from '@/components/ui';
import { buildSampleMessage } from '../lib/buildMessage';

/** Live WhatsApp-style preview of the order message built from the current form values. */
export function MessagePreview({ settings, className }: { settings: OrderSettings; className?: string }) {
  const message = buildSampleMessage(settings);
  const digits = normalizeWhatsappNumber(settings.whatsappNumber);

  const onCopy = async () => {
    if (await copyToClipboard(message)) toast.success('Скопировано');
    else toast.error('Не удалось скопировать');
  };

  return (
    <Card title="Так выглядит сообщение" description="Пример заказа с вашими настройками." className={className}>
      <div className="rounded-2xl bg-[#EFE7DD] p-3 sm:p-4">
        <div className="relative ml-auto max-w-[96%] rounded-2xl rounded-tr-sm bg-[#DCF8C6] px-3.5 pb-5 pt-2.5 shadow-[0_1px_0.5px_rgb(0_0_0/0.13)]">
          <pre className="whitespace-pre-wrap break-words font-sans text-[13px] leading-relaxed text-zinc-900">{message}</pre>
          <span className="absolute bottom-1.5 right-3 text-[11px] tabular-nums text-zinc-500/80" aria-hidden="true">
            12:34
          </span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <p className="flex min-w-0 items-center gap-1.5 text-[13px] text-zinc-500">
          <Link2 className="size-3.5 shrink-0" aria-hidden="true" />
          {digits ? (
            <span className="truncate">
              Ссылка: <span className="font-mono text-zinc-700">wa.me/{digits}</span>
            </span>
          ) : (
            <span>Номер не указан — заказы будут только в панели</span>
          )}
        </p>
        <Button variant="ghost" size="sm" icon={<Copy />} onClick={() => void onCopy()}>
          Копировать текст
        </Button>
      </div>
    </Card>
  );
}

import { motion } from 'motion/react';
import { Check, Copy, MessageCircle } from 'lucide-react';
import type { CreateOrderResponse } from '@merenda/shared';
import { Button, ButtonLink } from '@/components/ui/Button';
import { useCopy } from '@/lib/hooks';
import { t } from '@/lib/i18n';

export function OrderSuccess({ result }: { result: CreateOrderResponse }) {
  const [copied, copy] = useCopy();
  const { order, whatsappUrl, message } = result;

  return (
    <div className="flex flex-col items-center gap-5 py-8 text-center">
      <motion.span
        className="flex size-20 items-center justify-center rounded-full bg-success-soft text-success"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 26 }}
      >
        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.12, type: 'spring', stiffness: 400, damping: 22 }}>
          <Check className="size-9" strokeWidth={2.5} />
        </motion.span>
      </motion.span>
      <div>
        <h3 className="text-[1.5rem]">{t.success.title}</h3>
        <p className="mt-1 text-[1.0625rem] font-semibold text-accent">
          {t.success.number}{order.number}
        </p>
      </div>
      {message ? <p className="max-w-sm text-muted">{message}</p> : null}
      {whatsappUrl ? (
        <div className="flex w-full max-w-sm flex-col gap-2.5">
          <ButtonLink href={whatsappUrl} target="_blank" rel="noopener" size="lg" full>
            <MessageCircle className="size-5" />
            {t.success.whatsapp}
          </ButtonLink>
          <p className="text-[0.8125rem] text-muted">{t.success.whatsappHint}</p>
          <Button variant="ghost" size="md" full onClick={() => void copy(order.whatsappMessage)}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? t.common.copied : t.success.copyMessage}
          </Button>
        </div>
      ) : (
        <div className="flex w-full max-w-sm flex-col gap-2.5">
          <p className="rounded-input bg-surface-alt px-4 py-3 text-[0.9375rem] text-heading">{t.success.noWhatsapp}</p>
          {order.whatsappMessage ? (
            <Button variant="secondary" size="md" full onClick={() => void copy(order.whatsappMessage)}>
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? t.common.copied : t.success.copyMessage}
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}

import { formatMoney, ORDER_TYPE_LABELS } from '@merenda/shared';
import { t } from '@/lib/i18n';
import { useSiteData } from '@/features/site/SiteContext';
import type { Checkout } from './hooks/useCheckout';

export function CheckoutForm({ checkout }: { checkout: Checkout }) {
  const { site, currency } = useSiteData();
  const { items, total, orderType, customer, setCustomer, comment, setComment, error, isPreview } = checkout;
  const o = site.orders;

  return (
    <form
      className="flex flex-col gap-5 py-2"
      onSubmit={(e) => {
        e.preventDefault();
        void checkout.submit();
      }}
      id="checkout-form"
    >
      {o.askName || o.askPhone || o.askComment ? (
        <div className="flex flex-col gap-3.5">
          <h3 className="text-[1.25rem]">{t.checkout.detailsTitle}</h3>
          {o.askName ? (
            <label className="flex flex-col gap-1.5 text-[0.875rem] font-medium text-heading">
              {t.checkout.name}
              <input className="input" name="name" autoComplete="name" placeholder={t.checkout.namePlaceholder} value={customer.name} onChange={(e) => setCustomer({ name: e.target.value })} maxLength={80} />
            </label>
          ) : null}
          {o.askPhone ? (
            <label className="flex flex-col gap-1.5 text-[0.875rem] font-medium text-heading">
              {t.checkout.phone}
              <input className="input" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder={t.checkout.phonePlaceholder} value={customer.phone} onChange={(e) => setCustomer({ phone: e.target.value })} maxLength={32} />
            </label>
          ) : null}
          {o.askComment ? (
            <label className="flex flex-col gap-1.5 text-[0.875rem] font-medium text-heading">
              {t.checkout.comment}
              <textarea className="input min-h-24 resize-y" name="comment" placeholder={t.checkout.commentPlaceholder} value={comment} onChange={(e) => setComment(e.target.value)} maxLength={500} />
            </label>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-2 rounded-card border border-border bg-surface-alt/50 p-4">
        <div className="flex items-center justify-between text-[0.875rem]">
          <span className="text-muted">{t.checkout.orderType}</span>
          <span className="font-medium text-heading">{orderType ? ORDER_TYPE_LABELS[orderType] : '—'}</span>
        </div>
        <ul className="mt-1 flex flex-col gap-1.5 border-t border-border pt-3 text-[0.9375rem]">
          {items.map((i) => (
            <li key={i.productId} className="flex items-baseline">
              <span className="min-w-0 truncate">{i.name} <span className="text-muted">× {i.quantity}</span></span>
              <span className="dot-leader" aria-hidden />
              <span className="tabular-nums">{formatMoney(i.priceMinor * i.quantity, currency)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-1 flex items-baseline justify-between border-t border-border pt-3">
          <span className="font-medium">{t.cart.total}</span>
          <span className="text-[1.25rem] font-semibold tabular-nums text-heading">{formatMoney(total, currency)}</span>
        </div>
      </div>

      {error ? (
        <p role="alert" className="rounded-input bg-danger-soft px-4 py-3 text-[0.9375rem] text-danger">{error}</p>
      ) : isPreview ? (
        <p className="text-[0.8125rem] text-muted">{t.cart.previewNote}</p>
      ) : null}
    </form>
  );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CreateOrderResponse, OrderType } from '@merenda/shared';
import { ApiRequestError } from '@/lib/api';
import { t } from '@/lib/i18n';
import { useCartItems, useCartTotal } from '@/features/cart/hooks/useCart';
import { useCartStore } from '@/features/cart/store';
import { useCreateOrder } from '@/features/site/hooks/useSiteQueries';
import { useSiteData } from '@/features/site/SiteContext';
import { useOrdering } from '../ordering';

export type CheckoutStep = 'cart' | 'type' | 'details' | 'success';
export const STEP_ORDER: CheckoutStep[] = ['cart', 'type', 'details', 'success'];

export function useCheckout(open: boolean) {
  const { site, isPreview } = useSiteData();
  const items = useCartItems();
  const total = useCartTotal();
  const customer = useCartStore((s) => s.customer);
  const setCustomer = useCartStore((s) => s.setCustomer);
  const clear = useCartStore((s) => s.clear);
  const { venue } = useOrdering();
  const mutation = useCreateOrder();

  const allowedTypes = useMemo<OrderType[]>(() => {
    const out: OrderType[] = [];
    if (site.orders.allowDineIn) out.push('dine_in');
    if (site.orders.allowTakeaway) out.push('takeaway');
    return out.length ? out : ['takeaway'];
  }, [site.orders.allowDineIn, site.orders.allowTakeaway]);

  const [step, setStep] = useState<CheckoutStep>('cart');
  const [orderType, setOrderType] = useState<OrderType | null>(null);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateOrderResponse | null>(null);

  useEffect(() => {
    if (open) return;
    const id = window.setTimeout(() => {
      setStep('cart');
      setError(null);
      setResult(null);
    }, 300);
    return () => window.clearTimeout(id);
  }, [open]);

  const minOrder = site.orders.minOrderMinor;
  const belowMin = minOrder > 0 && total < minOrder;
  const canCheckout = items.length > 0 && !belowMin && venue.canOrder;
  const askAny = site.orders.askName || site.orders.askPhone || site.orders.askComment;

  const start = useCallback(() => {
    setError(null);
    if (allowedTypes.length > 1) {
      setStep('type');
    } else {
      setOrderType(allowedTypes[0] ?? 'takeaway');
      setStep('details');
    }
  }, [allowedTypes]);

  const chooseType = useCallback((type: OrderType) => {
    setOrderType(type);
    setError(null);
    setStep('details');
  }, []);

  const back = useCallback(() => {
    setError(null);
    setStep((s) => (s === 'details' && allowedTypes.length > 1 ? 'type' : 'cart'));
  }, [allowedTypes.length]);

  const submit = useCallback(async () => {
    if (!orderType || !items.length) return;
    setError(null);
    if (isPreview) {
      setError(t.cart.previewNote);
      return;
    }
    try {
      const res = await mutation.mutateAsync({
        type: orderType,
        customerName: site.orders.askName && customer.name.trim() ? customer.name.trim() : undefined,
        customerPhone: site.orders.askPhone && customer.phone.trim() ? customer.phone.trim() : undefined,
        comment: site.orders.askComment && comment.trim() ? comment.trim() : undefined,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      });
      setResult(res);
      clear();
      setStep('success');
    } catch (e) {
      if (e instanceof ApiRequestError) {
        const fieldMsg = Object.values(e.fields)[0];
        setError(fieldMsg ? `${e.message} ${fieldMsg}` : e.message || t.checkout.errorGeneric);
      } else {
        setError(t.checkout.errorGeneric);
      }
    }
  }, [orderType, items, isPreview, mutation, site.orders, customer, comment, clear]);

  return {
    step,
    items,
    total,
    minOrder,
    belowMin,
    canCheckout,
    venue,
    allowedTypes,
    orderType,
    customer,
    setCustomer,
    comment,
    setComment,
    askAny,
    error,
    result,
    submitting: mutation.isPending,
    isPreview,
    start,
    chooseType,
    back,
    submit,
  };
}

export type Checkout = ReturnType<typeof useCheckout>;

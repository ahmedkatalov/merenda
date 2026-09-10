import { lazy, Suspense, useEffect, useState } from 'react';
import { ErrorScreen } from '@/components/layout/ErrorScreen';
import { PageSkeleton } from '@/components/layout/PageSkeleton';
import { ToastHost } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';
import { scrollToElement } from '@/lib/scroll';
import { CartPill } from '@/features/cart/CartPill';
import { useCartCount } from '@/features/cart/hooks/useCart';
import { useCartSync } from '@/features/cart/hooks/useCartSync';
import { useCartUi } from '@/features/cart/uiStore';
import { useProductSheet } from '@/features/menu/productSheetStore';
import { useOrdering } from '@/features/order/ordering';
import { Seo } from '@/features/site/Seo';
import { SiteProvider } from '@/features/site/SiteContext';
import { useSite } from '@/features/site/hooks/useSiteQueries';
import { SectionRenderer } from '@/sections/SectionRenderer';
import { startPreviewBridge, usePreviewStore } from './preview';

const CartDrawer = lazy(() => import('@/features/cart/CartDrawer'));
const ProductSheet = lazy(() => import('@/features/menu/ProductSheet'));

/** Becomes true the first time `flag` is true and stays true (mount lazy chunks on demand). */
function useEverTrue(flag: boolean): boolean {
  const [ever, setEver] = useState(flag);
  useEffect(() => {
    if (flag) setEver(true);
  }, [flag]);
  return ever;
}

function usePreviewScroll(): void {
  const target = usePreviewStore((s) => s.scrollTo);
  useEffect(() => {
    if (!target) return;
    const el = document.querySelector<HTMLElement>(`[data-section-id="${target.sectionId}"]`);
    scrollToElement(el);
  }, [target]);
}

function SiteShell() {
  useCartSync();
  usePreviewScroll();
  const count = useCartCount();
  const { venue: ordering } = useOrdering();
  const cartOpen = useCartUi((s) => s.open);
  const productOpen = useProductSheet((s) => s.product !== null);
  const mountCart = useEverTrue(cartOpen);
  const mountProduct = useEverTrue(productOpen);
  const showPill = ordering.enabled && count > 0;

  return (
    <>
      <Seo />
      <div className={cn('flex min-h-dvh flex-col', showPill && 'pb-24 md:pb-0')}>
        <SectionRenderer />
      </div>
      {ordering.enabled ? <CartPill /> : null}
      {mountCart ? (
        <Suspense fallback={null}>
          <CartDrawer />
        </Suspense>
      ) : null}
      {mountProduct ? (
        <Suspense fallback={null}>
          <ProductSheet />
        </Suspense>
      ) : null}
      <ToastHost raised={showPill} />
    </>
  );
}

export function App() {
  const site = useSite();
  useEffect(() => startPreviewBridge(), []);

  if (site.isPending) return <PageSkeleton />;
  if (site.isError || !site.data) {
    return <ErrorScreen message={site.error?.message} onRetry={() => void site.refetch()} retrying={site.isFetching} />;
  }
  return (
    <SiteProvider bootstrap={site.data}>
      <SiteShell />
    </SiteProvider>
  );
}

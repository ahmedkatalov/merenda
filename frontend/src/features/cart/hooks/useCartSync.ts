import { useEffect } from 'react';
import { useToastStore } from '@/components/ui/Toast';
import { t } from '@/lib/i18n';
import { useMenuIndex } from '@/features/menu/hooks/useMenuIndex';
import { useCartStore } from '../store';

/** Re-prices cart items from the latest menu and drops vanished/unavailable ones. */
export function useCartSync(): void {
  const { productsById, ready } = useMenuIndex();
  const syncWithProducts = useCartStore((s) => s.syncWithProducts);
  const push = useToastStore((s) => s.push);

  useEffect(() => {
    if (!ready) return;
    const { removed, updated } = syncWithProducts(productsById);
    if (removed.length) push(`${t.cart.syncRemoved} ${removed.join(', ')}`, 'warning');
    else if (updated) push(t.cart.syncUpdated);
  }, [productsById, ready, syncWithProducts, push]);
}

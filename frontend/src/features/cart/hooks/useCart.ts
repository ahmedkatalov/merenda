import { useCartStore, selectCount, selectTotal, type CartItem } from '../store';

export const useCartItems = (): CartItem[] => useCartStore((s) => s.items);
export const useCartCount = (): number => useCartStore(selectCount);
export const useCartTotal = (): number => useCartStore(selectTotal);
export const useCartQuantity = (productId: string): number =>
  useCartStore((s) => s.items.find((i) => i.productId === productId)?.quantity ?? 0);

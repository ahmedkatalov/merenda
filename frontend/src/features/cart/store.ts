import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import type { Product } from '@merenda/shared';
import { isPreview } from '@/app/preview';

export interface CartItem {
  productId: string;
  name: string;
  priceMinor: number;
  quantity: number;
  imageUrl: string | null;
}

export interface CartCustomer {
  name: string;
  phone: string;
}

export interface SyncResult {
  removed: string[];
  updated: number;
}

interface CartState {
  items: CartItem[];
  customer: CartCustomer;
  /** Timestamp of the last add, drives the badge bump animation. */
  lastAddedAt: number;
  add: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  setCustomer: (patch: Partial<CartCustomer>) => void;
  syncWithProducts: (products: ReadonlyMap<string, Product>) => SyncResult;
}

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

function safeLocalStorage(): StateStorage {
  if (isPreview) return noopStorage;
  try {
    return window.localStorage;
  } catch {
    return noopStorage;
  }
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      customer: { name: '', phone: '' },
      lastAddedAt: 0,
      add: (item, quantity = 1) =>
        set((s) => {
          const existing = s.items.find((i) => i.productId === item.productId);
          const items = existing
            ? s.items.map((i) => (i.productId === item.productId ? { ...i, ...item, quantity: Math.min(99, i.quantity + quantity) } : i))
            : [...s.items, { ...item, quantity: Math.max(1, quantity) }];
          return { items, lastAddedAt: Date.now() };
        }),
      setQuantity: (productId, quantity) =>
        set((s) => ({
          items:
            quantity <= 0
              ? s.items.filter((i) => i.productId !== productId)
              : s.items.map((i) => (i.productId === productId ? { ...i, quantity: Math.min(99, quantity) } : i)),
        })),
      remove: (productId) => set((s) => ({ items: s.items.filter((i) => i.productId !== productId) })),
      clear: () => set({ items: [] }),
      setCustomer: (patch) => set((s) => ({ customer: { ...s.customer, ...patch } })),
      syncWithProducts: (products) => {
        const removed: string[] = [];
        let updated = 0;
        const items: CartItem[] = [];
        for (const item of get().items) {
          const p = products.get(item.productId);
          if (!p || p.availability !== 'available') {
            removed.push(item.name);
            continue;
          }
          if (p.priceMinor !== item.priceMinor || p.name !== item.name) updated += 1;
          items.push({ ...item, priceMinor: p.priceMinor, name: p.name });
        }
        if (removed.length || updated) set({ items });
        return { removed, updated };
      },
    }),
    {
      name: 'site-cart-v1',
      storage: createJSONStorage(safeLocalStorage),
      partialize: (s) => ({ items: s.items, customer: s.customer }),
    },
  ),
);

export const selectCount = (s: CartState): number => s.items.reduce((n, i) => n + i.quantity, 0);
export const selectTotal = (s: CartState): number => s.items.reduce((n, i) => n + i.quantity * i.priceMinor, 0);

import { create } from 'zustand';
import type { Product } from '@merenda/shared';

interface ProductSheetState {
  product: Product | null;
  menuId: string | null;
  open: (product: Product, menuId: string) => void;
  close: () => void;
}

export const useProductSheet = create<ProductSheetState>()((set) => ({
  product: null,
  menuId: null,
  open: (product, menuId) => set({ product, menuId }),
  close: () => set({ product: null }),
}));

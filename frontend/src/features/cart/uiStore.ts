import { create } from 'zustand';

interface CartUiState {
  open: boolean;
  openCart: () => void;
  closeCart: () => void;
}

export const useCartUi = create<CartUiState>()((set) => ({
  open: false,
  openCart: () => set({ open: true }),
  closeCart: () => set({ open: false }),
}));

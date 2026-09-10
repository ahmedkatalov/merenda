import { create } from 'zustand';
import type { AdminUser, LoginResponse } from '@merenda/shared';

interface AuthState {
  /** Access JWT, memory only. */
  accessToken: string | null;
  user: AdminUser | null;
  /** True once the silent refresh on boot finished (either way). */
  booted: boolean;
  setSession: (res: LoginResponse) => void;
  setUser: (user: AdminUser) => void;
  clearSession: () => void;
  setBooted: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  booted: false,
  setSession: (res) => set({ accessToken: res.accessToken, user: res.user }),
  setUser: (user) => set({ user }),
  clearSession: () => set({ accessToken: null, user: null }),
  setBooted: () => set({ booted: true }),
}));

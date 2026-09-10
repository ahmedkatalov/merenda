import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { refreshSession } from '@/lib/api';
import { authApi } from './api';
import { useAuthStore } from './store';

/** Silent session restore on app boot. */
export function useBootstrapAuth() {
  const booted = useAuthStore((s) => s.booted);
  const setBooted = useAuthStore((s) => s.setBooted);
  useEffect(() => {
    if (booted) return;
    let cancelled = false;
    void refreshSession().finally(() => {
      if (!cancelled) setBooted();
    });
    return () => {
      cancelled = true;
    };
  }, [booted, setBooted]);
  return booted;
}

export function useLogout() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const clear = useAuthStore((s) => s.clearSession);
  return async () => {
    try {
      await authApi.logout();
    } catch {
      /* ignore */
    }
    clear();
    qc.clear();
    navigate('/login', { replace: true });
  };
}

export const useCurrentUser = () => useAuthStore((s) => s.user);
export const useIsAuthenticated = () => useAuthStore((s) => s.accessToken !== null);
